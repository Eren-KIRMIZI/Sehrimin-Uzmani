from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.events.bus import event_bus
from app.core.exceptions import NotFoundException
from app.core.security import get_current_user
from app.modules.appointments.models import Appointment
from app.modules.categories.models import Service
from app.modules.favorites.models import Favorite
from app.modules.providers.models import ProviderProfile
from app.modules.requests.models import ServiceRequest
from app.modules.users.models import User

router = APIRouter(prefix="/favorites", tags=["Favorites"])


@router.post("/{provider_id}")
def add_favorite(
    provider_id: int,
    note: str = "",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    provider = (
        db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    )
    if not provider:
        raise NotFoundException("Uzman")

    existing = (
        db.query(Favorite)
        .filter(
            Favorite.user_id == current_user.id, Favorite.provider_id == provider_id
        )
        .first()
    )
    if existing:
        db.delete(existing)
        db.commit()
        return {"message": "Favorilerden kaldırıldı", "is_favorite": False}

    fav = Favorite(user_id=current_user.id, provider_id=provider_id, note=note or None)
    db.add(fav)
    db.commit()
    return {"message": "Favorilere eklendi", "is_favorite": True}


@router.get("")
def list_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    favorites = (
        db.query(Favorite)
        .filter(Favorite.user_id == current_user.id)
        .order_by(Favorite.created_at.desc())
        .limit(50)
        .all()
    )

    result = []
    for f in favorites:
        provider = (
            db.query(ProviderProfile)
            .filter(ProviderProfile.id == f.provider_id)
            .first()
        )
        if provider:
            user = db.query(User).filter(User.id == provider.user_id).first()
            perf = provider.performance

            last_service_name = None
            if f.last_service_id:
                svc = db.query(Service).filter(Service.id == f.last_service_id).first()
                last_service_name = svc.name if svc else None

            result.append(
                {
                    "id": f.id,
                    "provider_id": provider.id,
                    "business_name": provider.business_name,
                    "rating": perf.rating if perf else 0.0,
                    "review_count": perf.review_count if perf else 0,
                    "completed_jobs": perf.completed_jobs if perf else 0,
                    "note": f.note,
                    "last_service_name": last_service_name,
                    "last_service_date": f.last_service_date,
                    "user": {
                        "first_name": user.first_name if user else None,
                        "last_name": user.last_name if user else None,
                        "avatar": user.avatar if user else None,
                    },
                    "created_at": f.created_at,
                }
            )
    return result


@router.delete("/{provider_id}")
def remove_favorite(
    provider_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    fav = (
        db.query(Favorite)
        .filter(
            Favorite.user_id == current_user.id, Favorite.provider_id == provider_id
        )
        .first()
    )
    if not fav:
        raise NotFoundException("Favori")

    db.delete(fav)
    db.commit()
    return {"message": "Favorilerden kaldırıldı"}


@router.post("/{provider_id}/rehaire")
def rehaire_provider(
    provider_id: int,
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Tekrar İş Ver — Favorilenen uzmanla daha önce yapılmış bir hizmeti
    aynı detaylarla yeniden talep eder.
    """
    provider = (
        db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    )
    if not provider:
        raise NotFoundException("Uzman")

    fav = (
        db.query(Favorite)
        .filter(
            Favorite.user_id == current_user.id,
            Favorite.provider_id == provider_id,
        )
        .first()
    )

    last_request = None

    # 1) Favorinin son request bilgisi varsa onu kullan
    if fav and fav.last_request_id:
        last_request = (
            db.query(ServiceRequest)
            .filter(
                ServiceRequest.id == fav.last_request_id,
                ServiceRequest.customer_id == current_user.id,
            )
            .first()
        )

    # 2) Yoksa, bu uzmanın tamamlanmış appointment'larından birini bul
    if not last_request:
        completed_appt = (
            db.query(Appointment)
            .filter(
                Appointment.customer_id == current_user.id,
                Appointment.provider_id == provider_id,
                Appointment.status == "COMPLETED",
            )
            .order_by(Appointment.created_at.desc())
            .first()
        )
        if completed_appt:
            last_request = (
                db.query(ServiceRequest)
                .filter(
                    ServiceRequest.id == completed_appt.request_id,
                )
                .first()
            )

    if not last_request:
        raise HTTPException(
            status_code=400,
            detail="Bu uzmanla daha önce tamamlanmış bir hizmet bulunamadı.",
        )

    # 3) Yeni talep oluştur (önceki talepten bilgileri kopyala)
    new_request = ServiceRequest(
        customer_id=current_user.id,
        category_id=last_request.category_id,
        subcategory_id=last_request.subcategory_id,
        service_id=last_request.service_id,
        title=f"Tekrar: {last_request.title}",
        description=last_request.description,
        city_id=last_request.city_id,
        district_id=last_request.district_id,
        latitude=last_request.latitude,
        longitude=last_request.longitude,
        urgency=last_request.urgency,
        status="DRAFT",
    )
    db.add(new_request)
    db.flush()

    # 4) Yeni request'i hemen yayımla (matching tetiklenir)
    from app.modules.requests.state import RequestState, RequestStateMachine

    sm = RequestStateMachine(RequestState.DRAFT)

    def on_publish(old_state, new_state):
        new_request.status = new_state.value
        db.commit()
        db.refresh(new_request)
        event_bus.publish(
            "REQUEST_PUBLISHED", {"request_id": new_request.id}, background_tasks
        )

    sm.transition_to(RequestState.PUBLISHED, on_transition=on_publish)

    # 5) Favori bilgisini güncelle
    if fav:
        fav.last_request_id = new_request.id
        fav.last_service_id = last_request.service_id
        fav.last_service_date = datetime.now(timezone.utc)
        db.commit()

    return {
        "message": f"Tekrar iş talebi oluşturuldu. {provider.business_name} yakında teklif gönderecektir.",
        "new_request_id": new_request.id,
        "status": new_request.status,
    }


@router.get("/{provider_id}/history")
def provider_job_history(
    provider_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Bu uzmanla yapılmış tüm tamamlanmış işleri listeler.
    """
    provider = (
        db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    )
    if not provider:
        raise NotFoundException("Uzman")

    appointments = (
        db.query(Appointment)
        .filter(
            Appointment.customer_id == current_user.id,
            Appointment.provider_id == provider_id,
            Appointment.status == "COMPLETED",
        )
        .order_by(Appointment.created_at.desc())
        .all()
    )

    result = []
    for appt in appointments:
        request = (
            db.query(ServiceRequest)
            .filter(ServiceRequest.id == appt.request_id)
            .first()
        )
        service = (
            db.query(Service).filter(Service.id == request.service_id).first()
            if request
            else None
        )

        result.append(
            {
                "appointment_id": appt.id,
                "request_id": appt.request_id,
                "service_name": service.name if service else None,
                "request_title": request.title if request else None,
                "completed_at": appt.end_at or appt.created_at,
                "location": appt.location,
            }
        )

    return {
        "provider_id": provider_id,
        "business_name": provider.business_name,
        "total_jobs": len(result),
        "history": result,
    }


@router.patch("/{provider_id}/note")
def update_favorite_note(
    provider_id: int,
    note: str = "",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Favori uzmana not ekleme/güncelleme"""
    fav = (
        db.query(Favorite)
        .filter(
            Favorite.user_id == current_user.id,
            Favorite.provider_id == provider_id,
        )
        .first()
    )
    if not fav:
        raise NotFoundException("Favori")

    fav.note = note or None
    db.commit()
    return {"message": "Not güncellendi", "note": fav.note}

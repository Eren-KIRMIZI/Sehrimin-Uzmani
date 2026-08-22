from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.appointments.repository import appointment_repo
from app.modules.appointments.service import appointment_service
from app.modules.users.models import User
from app.modules.providers.models import ProviderProfile
import datetime

router = APIRouter(prefix="/appointments", tags=["appointments"])

@router.get("/available-slots")
def get_available_slots(provider_id: int, date: str, db: Session = Depends(get_db)):
    try:
        dt = datetime.datetime.strptime(date, "%Y-%m-%d")
        dow_iso = dt.isoweekday() # 1=Mon, 7=Sun
        # frontend mock dow is 0-6 where 0=Sun.
        # But backend provider_availability seed uses 1-5 for Mon-Fri.
        dow_str = str(dow_iso)
    except Exception:
        dow_str = "1"
        
    profile = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not profile:
        return {"date": date, "provider_id": provider_id, "total_slots": 0, "slots": []}
        
    avail = None
    for a in profile.availability:
        if a.day_of_week == dow_str:
            avail = a
            break
            
    slots = []
    if avail:
        try:
            start_h = int(avail.start_time.split(':')[0])
            end_h = int(avail.end_time.split(':')[0])
            for h in range(start_h, end_h):
                slots.append({
                    "start": f"{h:02d}:00",
                    "end": f"{h+1:02d}:00",
                    "available": True
                })
        except Exception:
            pass
            
    return {"date": date, "provider_id": provider_id, "total_slots": len(slots), "slots": slots}


def _check_provider_access(appt, current_user: User):
    """Yalnızca randevunun uzmanı veya müşterisi veya ADMIN erişebilir."""
    if current_user.role == "ADMIN":
        return
    profile = current_user.provider_profile
    is_provider = profile and profile.id == appt.provider_id
    is_customer = appt.customer_id == current_user.id
    if not is_provider and not is_customer:
        raise HTTPException(status_code=403, detail="Bu randevuya erişim yetkiniz yok")


@router.get("/{appt_id}")
def get_appointment(
    appt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appt = appointment_repo.get(db, appt_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Randevu bulunamadı")
    _check_provider_access(appt, current_user)
    return {"id": appt.id, "status": appt.status, "start_at": str(appt.start_at)}


@router.post("/{appt_id}/confirm")
def confirm_appointment(
    appt_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Uzman randevuyu onaylar"""
    appt = appointment_repo.get(db, appt_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Randevu bulunamadı")
    profile = current_user.provider_profile
    if (
        not (profile and profile.id == appt.provider_id)
        and current_user.role != "ADMIN"
    ):
        raise HTTPException(
            status_code=403, detail="Bu randevuyu yalnızca ilgili uzman onaylayabilir"
        )
    try:
        appt = appointment_service.confirm(db, appt_id, background_tasks)
        return {"message": "Randevu onaylandı", "status": appt.status}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{appt_id}/start")
def start_appointment(
    appt_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Uzman işe başladı"""
    appt = appointment_repo.get(db, appt_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Randevu bulunamadı")
    profile = current_user.provider_profile
    if (
        not (profile and profile.id == appt.provider_id)
        and current_user.role != "ADMIN"
    ):
        raise HTTPException(
            status_code=403, detail="Bu randevuyu yalnızca ilgili uzman başlatabilir"
        )
    try:
        appt = appointment_service.start(db, appt_id, background_tasks)
        return {"message": "İş başlatıldı", "status": appt.status}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{appt_id}/complete")
def complete_appointment(
    appt_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """İş tamamlandı — değerlendirme bildirimi gönderilir"""
    appt = appointment_repo.get(db, appt_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Randevu bulunamadı")
    profile = current_user.provider_profile
    if (
        not (profile and profile.id == appt.provider_id)
        and current_user.role != "ADMIN"
    ):
        raise HTTPException(
            status_code=403, detail="Bu randevuyu yalnızca ilgili uzman tamamlayabilir"
        )
    try:
        appt = appointment_service.complete(db, appt_id, background_tasks)
        return {
            "message": "İş tamamlandı. Müşteriye değerlendirme bildirimi gönderildi.",
            "status": appt.status,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{appt_id}/cancel")
def cancel_appointment(
    appt_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appt = appointment_repo.get(db, appt_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Randevu bulunamadı")
    # Hem uzman hem müşteri iptal edebilir
    _check_provider_access(appt, current_user)
    try:
        appt = appointment_service.cancel(db, appt_id, background_tasks)
        return {"message": "Randevu iptal edildi", "status": appt.status}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{appt_id}/no-show")
def no_show_appointment(
    appt_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appt = appointment_repo.get(db, appt_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Randevu bulunamadı")
    profile = current_user.provider_profile
    if (
        not (profile and profile.id == appt.provider_id)
        and current_user.role != "ADMIN"
    ):
        raise HTTPException(
            status_code=403,
            detail="Bu randevuyu yalnızca ilgili uzman gelmedi olarak işaretleyebilir",
        )
    try:
        appt = appointment_service.no_show(db, appt_id, background_tasks)
        return {"message": "Uzman gelmedi olarak işaretlendi", "status": appt.status}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

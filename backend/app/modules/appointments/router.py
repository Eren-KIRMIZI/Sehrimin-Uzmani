from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.modules.users.models import User
from app.modules.providers.models import ProviderProfile
from app.modules.appointments.models import Appointment
from app.modules.requests.models import ServiceRequest
from app.modules.quotes.models import Quote
from app.modules.commissions.models import Transaction, ProviderEarning, CommissionRate
from app.modules.appointments.schemas import AppointmentCreate, AppointmentUpdate
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.post("")
def create_appointment(
    data: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    request = db.query(ServiceRequest).filter(ServiceRequest.id == data.request_id).first()
    if not request:
        raise NotFoundException("Talep")

    provider = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not provider:
        raise ForbiddenException("Uzman profili olusturmadan randevu olusturamazsiniz")

    if data.quote_id:
        quote = db.query(Quote).filter(Quote.id == data.quote_id).first()
        if not quote:
            raise NotFoundException("Teklif")
        if quote.status != "ACCEPTED":
            raise BadRequestException("Sadece kabul edilmis teklifler icin randevu olusturulabilir")
        if quote.provider_id != provider.id:
            raise ForbiddenException("Bu teklif size ait degil")
        provider_id = provider.id
    else:
        provider_id = provider.id

    appointment = Appointment(
        request_id=data.request_id,
        provider_id=provider_id,
        customer_id=request.customer_id,
        quote_id=data.quote_id,
        start_at=data.start_at,
        end_at=data.end_at,
        location=data.location,
        notes=data.notes,
    )
    db.add(appointment)

    request.status = "IN_PROGRESS"
    db.commit()
    db.refresh(appointment)
    return {"message": "Randevu olusturuldu", "appointment": appointment}


@router.get("")
def list_my_appointments(
    status: str = None,
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    limit = min(max(1, limit), 50)
    offset = (max(1, page) - 1) * limit

    query = db.query(Appointment)

    provider = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if provider:
        query = query.filter(Appointment.provider_id == provider.id)
    else:
        query = query.filter(Appointment.customer_id == current_user.id)

    if status:
        query = query.filter(Appointment.status == status)

    total = query.count()
    appointments = query.order_by(Appointment.start_at.desc()).offset(offset).limit(limit).all()
    return {
        "items": [
            {
                "id": a.id,
                "request_id": a.request_id,
                "start_at": a.start_at,
                "end_at": a.end_at,
                "status": a.status,
                "location": a.location,
                "notes": a.notes,
                "created_at": a.created_at,
            }
            for a in appointments
        ],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/{appointment_id}")
def get_appointment(appointment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise NotFoundException("Randevu")

    provider = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    is_customer = appointment.customer_id == current_user.id
    is_provider = provider and appointment.provider_id == provider.id
    is_admin = current_user.role in ["ADMIN", "MODERATOR"]

    if not is_customer and not is_provider and not is_admin:
        raise ForbiddenException("Bu randevuyu goruntuleme yetkiniz yok")

    return {
        "id": appointment.id,
        "request_id": appointment.request_id,
        "provider_id": appointment.provider_id,
        "customer_id": appointment.customer_id,
        "quote_id": appointment.quote_id,
        "start_at": appointment.start_at,
        "end_at": appointment.end_at,
        "status": appointment.status,
        "location": appointment.location,
        "notes": appointment.notes,
        "created_at": appointment.created_at,
    }


@router.patch("/{appointment_id}")
def update_appointment(
    appointment_id: int,
    data: AppointmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise NotFoundException("Randevu")

    provider = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    is_customer = appointment.customer_id == current_user.id
    is_provider = provider and appointment.provider_id == provider.id

    if not is_customer and not is_provider:
        raise ForbiddenException("Bu randevuyu duzenleme yetkiniz yok")

    allowed_fields = {"location", "notes", "start_at", "end_at"}
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        if field in allowed_fields:
            setattr(appointment, field, value)

    db.commit()
    db.refresh(appointment)
    return {"message": "Randevu guncellendi", "appointment": appointment}


@router.post("/{appointment_id}/complete")
def complete_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).with_for_update().first()
    if not appointment:
        raise NotFoundException("Randevu")

    provider = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    is_customer = appointment.customer_id == current_user.id
    is_provider = provider and appointment.provider_id == provider.id

    if not is_customer and not is_provider:
        raise ForbiddenException("Bu randevuyu tamamlama yetkiniz yok")

    if appointment.status not in ("CONFIRMED", "IN_PROGRESS"):
        raise BadRequestException(f"Durum '{appointment.status}' olan randevu tamamlanamaz")

    appointment.status = "COMPLETED"

    request = db.query(ServiceRequest).filter(ServiceRequest.id == appointment.request_id).first()
    if request:
        request.status = "COMPLETED"

    quote = None
    if appointment.quote_id:
        quote = db.query(Quote).filter(Quote.id == appointment.quote_id).first()

    if quote and quote.price:
        rate_obj = db.query(CommissionRate).filter(CommissionRate.is_active == True).first()
        rate = rate_obj.rate if rate_obj else 0.10

        provider_user = db.query(User).filter(User.id == appointment.provider_id).first()
        user_discount = provider_user.commission_discount if provider_user and provider_user.commission_discount else 0.0

        if rate_obj and rate_obj.category_id:
            from app.modules.subscriptions.models import ProviderSubscription
            sub = db.query(ProviderSubscription).filter(
                ProviderSubscription.provider_id == appointment.provider_id,
                ProviderSubscription.status == "active",
            ).first()
            if sub and sub.plan and sub.plan.commission_discount:
                plan_discount = sub.plan.commission_discount
                user_discount = max(user_discount, plan_discount)

        effective_rate = rate * (1 - user_discount)
        commission_amount = round(quote.price * effective_rate, 2)
        provider_earning = round(quote.price - commission_amount, 2)

        transaction = Transaction(
            provider_id=appointment.provider_id,
            appointment_id=appointment.id,
            amount=quote.price,
            commission_rate=effective_rate,
            commission_amount=commission_amount,
            provider_earning=provider_earning,
            status="completed",
            description=f"Randevu #{appointment.id} tamamlandi",
        )
        db.add(transaction)

        earning = db.query(ProviderEarning).filter(
            ProviderEarning.provider_id == appointment.provider_id
        ).with_for_update().first()
        if not earning:
            earning = ProviderEarning(provider_id=appointment.provider_id)
            db.add(earning)

        earning.total_earned += provider_earning
        earning.total_commission_paid += commission_amount
        earning.pending_amount += provider_earning

    db.commit()
    return {"message": "Randevu tamamlandi", "commission": commission_amount if quote and quote.price else 0}


@router.post("/{appointment_id}/cancel")
def cancel_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise NotFoundException("Randevu")

    provider = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    is_customer = appointment.customer_id == current_user.id
    is_provider = provider and appointment.provider_id == provider.id

    if not is_customer and not is_provider:
        raise ForbiddenException("Bu randevuyu iptal etme yetkiniz yok")

    if appointment.status in ("COMPLETED", "CANCELLED"):
        raise BadRequestException(f"Durum '{appointment.status}' olan randevu iptal edilemez")

    appointment.status = "CANCELLED"

    request = db.query(ServiceRequest).filter(ServiceRequest.id == appointment.request_id).first()
    if request:
        request.status = "CANCELLED"

    db.commit()
    return {"message": "Randevu iptal edildi"}

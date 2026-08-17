from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.modules.users.models import User
from app.modules.providers.models import ProviderProfile
from app.modules.appointments.models import Appointment
from app.modules.requests.models import ServiceRequest
from app.modules.appointments.schemas import AppointmentCreate, AppointmentUpdate
from app.core.exceptions import NotFoundException, ForbiddenException

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
        provider_id = request.customer_id
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
    return {"message": "Randevu oluşturuldu", "appointment": appointment}


@router.get("")
def list_my_appointments(
    status: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Appointment)

    provider = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if provider:
        query = query.filter(Appointment.provider_id == provider.id)
    else:
        query = query.filter(Appointment.customer_id == current_user.id)

    if status:
        query = query.filter(Appointment.status == status)

    appointments = query.order_by(Appointment.start_at.desc()).all()
    return [
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
    ]


@router.get("/{appointment_id}")
def get_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise NotFoundException("Randevu")
    return appointment


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

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(appointment, field, value)
    db.commit()
    db.refresh(appointment)
    return {"message": "Randevu güncellendi", "appointment": appointment}


@router.post("/{appointment_id}/complete")
def complete_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise NotFoundException("Randevu")

    appointment.status = "COMPLETED"

    request = db.query(ServiceRequest).filter(ServiceRequest.id == appointment.request_id).first()
    if request:
        request.status = "COMPLETED"

    db.commit()
    return {"message": "Randevu tamamlandı"}


@router.post("/{appointment_id}/cancel")
def cancel_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise NotFoundException("Randevu")

    appointment.status = "CANCELLED"

    request = db.query(ServiceRequest).filter(ServiceRequest.id == appointment.request_id).first()
    if request:
        request.status = "CANCELLED"

    db.commit()
    return {"message": "Randevu iptal edildi"}

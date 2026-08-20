from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.appointments.repository import appointment_repo
from app.modules.appointments.service import appointment_service

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.get("/{appt_id}")
def get_appointment(appt_id: int, db: Session = Depends(get_db)):
    appt = appointment_repo.get(db, appt_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Randevu bulunamadı")
    return {"id": appt.id, "status": appt.status, "start_at": str(appt.start_at)}


@router.post("/{appt_id}/confirm")
def confirm_appointment(appt_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Uzman randevuyu onaylar"""
    try:
        appt = appointment_service.confirm(db, appt_id, background_tasks)
        return {"message": "Randevu onaylandı", "status": appt.status}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{appt_id}/start")
def start_appointment(appt_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Uzman işe başladı"""
    try:
        appt = appointment_service.start(db, appt_id, background_tasks)
        return {"message": "İş başlatıldı", "status": appt.status}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{appt_id}/complete")
def complete_appointment(appt_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """İş tamamlandı — değerlendirme bildirimi gönderilir"""
    try:
        appt = appointment_service.complete(db, appt_id, background_tasks)
        return {"message": "İş tamamlandı. Müşteriye değerlendirme bildirimi gönderildi.", "status": appt.status}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{appt_id}/cancel")
def cancel_appointment(appt_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    try:
        appt = appointment_service.cancel(db, appt_id, background_tasks)
        return {"message": "Randevu iptal edildi", "status": appt.status}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{appt_id}/no-show")
def no_show_appointment(appt_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    try:
        appt = appointment_service.no_show(db, appt_id, background_tasks)
        return {"message": "Uzman gelmedi olarak işaretlendi", "status": appt.status}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

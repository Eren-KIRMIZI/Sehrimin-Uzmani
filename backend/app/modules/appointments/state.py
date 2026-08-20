from enum import Enum
from app.core.base.state_machine import BaseStateMachine


class AppointmentState(str, Enum):
    PENDING = "PENDING"          # Randevu oluşturuldu, uzman onayı bekleniyor
    CONFIRMED = "CONFIRMED"      # Uzman onayladı
    REMINDED = "REMINDED"        # Hatırlatma gönderildi
    IN_PROGRESS = "IN_PROGRESS"  # Hizmet başladı (uzman "başladım" dedi)
    COMPLETED = "COMPLETED"      # Hizmet tamamlandı
    CANCELLED = "CANCELLED"      # İptal edildi
    NO_SHOW = "NO_SHOW"          # Uzman gelmedi


class AppointmentStateMachine(BaseStateMachine):
    def __init__(self, current_state: AppointmentState):
        super().__init__(current_state)
        self.transitions = {
            AppointmentState.PENDING:     [AppointmentState.CONFIRMED, AppointmentState.CANCELLED],
            AppointmentState.CONFIRMED:   [AppointmentState.IN_PROGRESS, AppointmentState.CANCELLED, AppointmentState.NO_SHOW],
            AppointmentState.REMINDED:    [AppointmentState.IN_PROGRESS, AppointmentState.CANCELLED, AppointmentState.NO_SHOW],
            AppointmentState.IN_PROGRESS: [AppointmentState.COMPLETED, AppointmentState.CANCELLED],
            AppointmentState.COMPLETED:   [],
            AppointmentState.CANCELLED:   [],
            AppointmentState.NO_SHOW:     [],
        }

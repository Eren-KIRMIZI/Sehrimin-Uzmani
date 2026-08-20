from typing import Dict, List, Any, Callable
from enum import Enum

class BaseStateMachine:
    """Durum makineleri (State Machine) için temel sınıf."""
    
    def __init__(self, current_state: Enum):
        self.current_state = current_state
        self.transitions: Dict[Enum, List[Enum]] = {}

    def can_transition_to(self, new_state: Enum) -> bool:
        allowed = self.transitions.get(self.current_state, [])
        return new_state in allowed

    def transition_to(self, new_state: Enum, on_transition: Callable = None, **kwargs):
        if not self.can_transition_to(new_state):
            raise ValueError(f"Geçersiz durum değişimi: {self.current_state} -> {new_state}")
        
        old_state = self.current_state
        self.current_state = new_state
        
        if on_transition:
            on_transition(old_state, new_state, **kwargs)

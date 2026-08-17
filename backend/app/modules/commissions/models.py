from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from datetime import datetime
import enum
from app.core.database import Base
from app.core.encryption import encrypt, decrypt


class CommissionStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    DISPUTED = "disputed"
    REFUNDED = "refunded"


class CommissionRate(Base):
    __tablename__ = "commission_rates"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    rate = Column(Float, nullable=False, default=0.10)
    min_amount = Column(Float, nullable=True)
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    category = relationship("Category", lazy="joined")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    amount = Column(Float, nullable=False)
    commission_rate = Column(Float, nullable=False, default=0.10)
    commission_amount = Column(Float, nullable=False)
    provider_earning = Column(Float, nullable=False)
    status = Column(String(20), default="pending")
    payment_method = Column(String(50), nullable=True)
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)

    provider = relationship("User", lazy="joined")
    appointment = relationship("Appointment", lazy="joined")


class ProviderEarning(Base):
    __tablename__ = "provider_earnings"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_earned = Column(Float, default=0.0)
    total_commission_paid = Column(Float, default=0.0)
    pending_amount = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)
    last_calculated_at = Column(DateTime, default=datetime.utcnow)

    provider = relationship("User", lazy="joined")


class PayoutRequest(Base):
    __tablename__ = "payout_requests"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    bank_name = Column(String(100), nullable=True)
    iban = Column(String(200), nullable=True)
    account_holder = Column(String(200), nullable=True)
    status = Column(String(20), default="pending")
    processed_at = Column(DateTime, nullable=True)
    admin_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    provider = relationship("User", lazy="joined")

    _iban_plain = None
    _account_holder_plain = None

    @hybrid_property
    def iban_decrypted(self):
        if self._iban_plain is not None:
            return self._iban_plain
        if self.iban:
            try:
                return decrypt(self.iban)
            except Exception:
                return self.iban
        return None

    @iban_decrypted.setter
    def iban_decrypted(self, value):
        self._iban_plain = value
        if value:
            self.iban = encrypt(value)
        else:
            self.iban = None

    @hybrid_property
    def account_holder_decrypted(self):
        if self._account_holder_plain is not None:
            return self._account_holder_plain
        if self.account_holder:
            try:
                return decrypt(self.account_holder)
            except Exception:
                return self.account_holder
        return None

    @account_holder_decrypted.setter
    def account_holder_decrypted(self, value):
        self._account_holder_plain = value
        if value:
            self.account_holder = encrypt(value)
        else:
            self.account_holder = None

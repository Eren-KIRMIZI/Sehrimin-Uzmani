import enum


class UserRole(str, enum.Enum):
    USER = "USER"
    PROVIDER = "PROVIDER"
    ADMIN = "ADMIN"
    MODERATOR = "MODERATOR"


class VerificationStatus(str, enum.Enum):
    NONE = "NONE"
    BASIC = "BASIC"
    IDENTITY = "IDENTITY"
    PROFESSIONAL = "PROFESSIONAL"
    BUSINESS = "BUSINESS"


class RequestStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    MATCHING = "MATCHING"
    QUOTING = "QUOTING"
    ACCEPTED = "ACCEPTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    DISPUTED = "DISPUTED"


class QuoteStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    WITHDRAWN = "WITHDRAWN"


class AppointmentStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"
    NO_SHOW = "NO_SHOW"


class ReviewStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    HIDDEN = "HIDDEN"
    REPORTED = "REPORTED"


class NotificationType(str, enum.Enum):
    NEW_QUOTE = "NEW_QUOTE"
    NEW_MESSAGE = "NEW_MESSAGE"
    APPOINTMENT_CONFIRMED = "APPOINTMENT_CONFIRMED"
    APPOINTMENT_REMINDER = "APPOINTMENT_REMINDER"
    SERVICE_COMPLETED = "SERVICE_COMPLETED"
    NEW_REVIEW = "NEW_REVIEW"
    QUOTE_EXPIRED = "QUOTE_EXPIRED"
    SYSTEM = "SYSTEM"


class MessageType(str, enum.Enum):
    TEXT = "TEXT"
    IMAGE = "IMAGE"
    FILE = "FILE"
    QUOTE = "QUOTE"
    APPOINTMENT = "APPOINTMENT"
    LOCATION = "LOCATION"
    SYSTEM = "SYSTEM"


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    AUTHORIZED = "AUTHORIZED"
    PAID = "PAID"
    REFUNDED = "REFUNDED"
    FAILED = "FAILED"


class DisputeStatus(str, enum.Enum):
    OPEN = "OPEN"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"


class UrgencyLevel(str, enum.Enum):
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    URGENT = "URGENT"


class PricingType(str, enum.Enum):
    FIXED = "FIXED"
    HOURLY = "HOURLY"
    STARTING = "STARTING"
    NEGOTIABLE = "NEGOTIABLE"


class DayOfWeek(str, enum.Enum):
    MONDAY = "MONDAY"
    TUESDAY = "TUESDAY"
    WEDNESDAY = "WEDNESDAY"
    THURSDAY = "THURSDAY"
    FRIDAY = "FRIDAY"
    SATURDAY = "SATURDAY"
    SUNDAY = "SUNDAY"

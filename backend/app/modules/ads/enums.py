from enum import Enum


class AdStatus(str, Enum):
    DRAFT = "DRAFT"
    PENDING_REVIEW = "PENDING_REVIEW"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    SOLD = "SOLD"
    EXPIRED = "EXPIRED"
    REJECTED = "REJECTED"
    DELETED = "DELETED"


class AdCondition(str, Enum):
    NEW = "NEW"
    LIKE_NEW = "LIKE_NEW"
    GOOD = "GOOD"
    USED = "USED"


class AdPriceType(str, Enum):
    FIXED = "FIXED"
    NEGOTIABLE = "NEGOTIABLE"
    FREE = "FREE"


class AdSort(str, Enum):
    NEWEST = "newest"
    OLDEST = "oldest"
    PRICE_ASC = "price_asc"
    PRICE_DESC = "price_desc"


class ReportStatus(str, Enum):
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"

from fastapi import HTTPException


class AppException(HTTPException):
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)


class NotFoundException(AppException):
    def __init__(self, resource: str = "Kayıt"):
        super().__init__(status_code=404, detail=f"{resource} bulunamadı")


class UnauthorizedException(AppException):
    def __init__(self, detail: str = "Yetkiniz yetersiz"):
        super().__init__(status_code=401, detail=detail)


class ForbiddenException(AppException):
    def __init__(self, detail: str = "Erişim reddedildi"):
        super().__init__(status_code=403, detail=detail)


class BadRequestException(AppException):
    def __init__(self, detail: str = "Geçersiz istek"):
        super().__init__(status_code=400, detail=detail)


class ConflictException(AppException):
    def __init__(self, detail: str = "Bu kayıt zaten mevcut"):
        super().__init__(status_code=409, detail=detail)


class ValidationException(AppException):
    def __init__(self, detail: str = "Doğrulama hatası"):
        super().__init__(status_code=422, detail=detail)

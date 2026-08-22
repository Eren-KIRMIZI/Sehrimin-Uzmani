export const formatTRY = (value: number | null | undefined, fallback = '0'): string => {
  if (value == null || isNaN(Number(value))) return `${fallback} ₺`;
  return `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(value)} ₺`;
};

export const formatDate = (value: string | null | undefined): string => {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('tr-TR', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Taslak',
  OPEN: 'Açık',
  IN_PROGRESS: 'Devam Ediyor',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal Edildi',
};

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Planlandı',
  CONFIRMED: 'Onaylandı',
  IN_PROGRESS: 'Devam Ediyor',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal Edildi',
  NO_SHOW: 'Gelmedi',
};

export const DISPUTE_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Açık',
  IN_REVIEW: 'İncelemede',
  RESOLVED: 'Çözüldü',
  CLOSED: 'Kapatıldı',
};

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Taslak',
  SUBMITTED: 'Gönderildi',
  PENDING: 'Bekliyor',
  ACCEPTED: 'Kabul Edildi',
  REJECTED: 'Reddedildi',
  REVISED: 'Revize Edildi',
};

export const URGENCY_LABELS: Record<string, string> = {
  LOW: 'Düşük',
  MEDIUM: 'Orta',
  HIGH: 'Yüksek',
  EMERGENCY: 'Acil',
};

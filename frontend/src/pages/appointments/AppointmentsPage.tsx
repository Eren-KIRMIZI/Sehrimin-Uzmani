import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Star, CheckCircle2, XCircle, Play, UserX, ShieldCheck } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import SEO from '../../components/SEO';
import { useAuthStore } from '../../stores/authStore';
import { useAppointments, useAppointmentAction, useCreateReview } from '../../hooks/useQueries';
import { EmptyState } from '../../components/ui/Feedback';
import { toast, toastApiError } from '../../stores/toastStore';
import type { Appointment } from '../../types';
import { formatDateTime, APPOINTMENT_STATUS_LABELS } from '../../utils/format';

const STATUS_BADGE: Record<string, string> = {
  SCHEDULED: 'badge-outline',
  CONFIRMED: 'badge-success',
  IN_PROGRESS: 'badge-warning',
  COMPLETED: 'badge-primary',
  CANCELLED: 'badge-error',
  NO_SHOW: 'badge-error',
};

const ReviewModal: React.FC<{ appointment: Appointment; onClose: () => void }> = ({ appointment, onClose }) => {
  const createReview = useCreateReview();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [subRatings, setSubRatings] = useState({ communication: 5, quality: 5, price: 5, punctuality: 5 });

  const submit = async () => {
    try {
      await createReview.mutateAsync({
        provider_id: appointment.provider_id,
        rating,
        comment,
        communication_rating: subRatings.communication,
        quality_rating: subRatings.quality,
        price_rating: subRatings.price,
        punctuality_rating: subRatings.punctuality,
      });
      toast.success('Değerlendirmeniz kaydedildi. Teşekkürler!');
      onClose();
    } catch (err) {
      toastApiError(err, 'Değerlendirme kaydedilemedi');
    }
  };

  const starPicker = (value: number, onChange: (v: number) => void) => (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          aria-label={`${n} yıldız`}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <Star size={20} color={n <= value ? 'var(--color-accent)' : 'var(--color-border-light)'} fill={n <= value ? 'var(--color-accent)' : 'none'} />
        </button>
      ))}
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={onClose}
    >
      <div className="card" style={{ maxWidth: 480, width: '100%', padding: 24 }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 6px', fontWeight: 800 }}>Hizmeti Değerlendir</h3>
        <p style={{ margin: '0 0 18px', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
          Deneyiminizi paylaşarak diğer kullanıcılara yardımcı olun.
        </p>

        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>Genel Puan</span>
            {starPicker(rating, setRating)}
          </div>
          {([
            ['communication', 'İletişim'], ['quality', 'İş Kalitesi'],
            ['price', 'Fiyat'], ['punctuality', 'Zamanında'],
          ] as const).map(([key, label]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>{label}</span>
              {starPicker(subRatings[key], v => setSubRatings(s => ({ ...s, [key]: v })))}
            </div>
          ))}
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Yorumunuz..."
            rows={3}
            style={{
              background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', padding: 12, color: 'var(--color-text)',
              fontFamily: 'inherit', resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={onClose}>Vazgeç</button>
            <button className="btn btn-primary" onClick={submit} disabled={createReview.isPending}>
              Gönder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppointmentsPage: React.FC = () => {
  const { user } = useAuthStore();
  const isProvider = user?.role === 'PROVIDER';
  const { data, isLoading, refetch } = useAppointments();
  const action = useAppointmentAction();
  const [reviewFor, setReviewFor] = useState<Appointment | null>(null);

  const runAction = async (id: number, act: 'confirm' | 'start' | 'complete' | 'cancel' | 'noShow') => {
    try {
      await action.mutateAsync({ id, action: act });
      toast.success('Randevu güncellendi.');
    } catch (err) {
      toastApiError(err, 'İşlem başarısız');
    }
  };

  const items = data?.items ?? [];
  const now = Date.now();
  const upcoming = items.filter(a =>
    ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(a.status) && +new Date(a.start_at) >= now - 86400000);
  const past = items.filter(a => !upcoming.includes(a));

  const renderCard = (a: Appointment) => {
    const counterpartName = isProvider
      ? `${a.customer?.first_name ?? ''} ${a.customer?.last_name ?? ''}`.trim() || 'Müşteri'
      : a.provider?.business_name || 'Uzman';

    return (
      <div key={a.id} className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <strong>{counterpartName}</strong>
              <span className={`badge ${STATUS_BADGE[a.status] || 'badge-outline'}`}>
                {APPOINTMENT_STATUS_LABELS[a.status] || a.status}
              </span>
            </div>
            <div style={{ marginTop: 6, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              📅 {formatDateTime(a.start_at)}{a.end_at ? ` – ${formatDateTime(a.end_at).split(', ')[1] ?? ''}` : ''}
            </div>
            {a.location && <div style={{ fontSize: '0.82rem', color: 'var(--color-text-dim)', marginTop: 2 }}>📍 {a.location}</div>}
            {a.notes && <div style={{ fontSize: '0.82rem', color: 'var(--color-text-dim)', marginTop: 2 }}>{a.notes}</div>}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {isProvider && a.status === 'SCHEDULED' && (
              <button className="btn btn-primary" onClick={() => runAction(a.id, 'confirm')} disabled={action.isPending}>
                <ShieldCheck size={15} /> Onayla
              </button>
            )}
            {isProvider && a.status === 'CONFIRMED' && (
              <button className="btn btn-primary" onClick={() => runAction(a.id, 'start')} disabled={action.isPending}>
                <Play size={15} /> İşe Başla
              </button>
            )}
            {isProvider && a.status === 'IN_PROGRESS' && (
              <button className="btn btn-primary" onClick={() => runAction(a.id, 'complete')} disabled={action.isPending}>
                <CheckCircle2 size={15} /> Tamamla
              </button>
            )}
            {!isProvider && ['SCHEDULED', 'CONFIRMED'].includes(a.status) && (
              <button className="btn btn-outline" onClick={() => runAction(a.id, 'cancel')} disabled={action.isPending}>
                <XCircle size={15} /> İptal Et
              </button>
            )}
            {isProvider && ['CONFIRMED', 'SCHEDULED'].includes(a.status) && (
              <button className="btn btn-outline" onClick={() => runAction(a.id, 'noShow')} disabled={action.isPending} title="Müşteri gelmedi">
                <UserX size={15} /> Gelmedi
              </button>
            )}
            {!isProvider && a.status === 'COMPLETED' && (
              <button className="btn btn-outline" onClick={() => setReviewFor(a)}>
                <Star size={15} /> Değerlendir
              </button>
            )}
            <Link to="/chat" className="btn btn-outline">Mesaj</Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <SEO title="Randevularım" description="Randevularınızı yönetin" />
      <div className="container" style={{ padding: '32px 24px', maxWidth: 900 }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.8rem', margin: 0 }}>Randevularım</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 28px' }}>
          {isProvider ? 'İş randevularınızı onaylayın ve yönetin.' : 'Uzmanlarla planladığınız randevular.'}
        </p>

        {isLoading && <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)' }}>Yükleniyor...</div>}
        {!isLoading && items.length === 0 && (
          <EmptyState
            icon={<CalendarClock size={36} />}
            title="Henüz randevunuz yok"
            message={
              isProvider
                ? 'Teklifleriniz kabul edildiğinde randevular burada görünür.'
                : 'Bir uzmanla anlaştığınızda randevunuzu buradan takip edebilirsiniz.'
            }
            action={!isProvider ? <Link to="/search" className="btn btn-primary">Uzman Ara</Link> : undefined}
          />
        )}

        {upcoming.length > 0 && (
          <>
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: 'var(--color-text-muted)' }}>Yaklaşan</h3>
            <div style={{ display: 'grid', gap: 12, marginBottom: 28 }}>
              {upcoming.map(renderCard)}
            </div>
          </>
        )}

        {past.length > 0 && (
          <>
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: 'var(--color-text-muted)' }}>Geçmiş</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              {past.map(renderCard)}
            </div>
          </>
        )}

        {reviewFor && <ReviewModal appointment={reviewFor} onClose={() => { setReviewFor(null); void refetch(); }} />}
      </div>
    </Layout>
  );
};

export default AppointmentsPage;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ChevronDown, ChevronUp, Check, X, MapPin, Calendar, MessageSquare } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import SEO from '../../components/SEO';
import {
  useMyRequests, useQuotesForRequest, useAcceptQuote, useRejectQuote,
} from '../../hooks/useQueries';
import { EmptyState } from '../../components/ui/Feedback';
import { toast, toastApiError } from '../../stores/toastStore';
import type { Quote, ServiceRequest } from '../../types';
import { formatTRY, formatDate, formatDateTime, REQUEST_STATUS_LABELS, URGENCY_LABELS, QUOTE_STATUS_LABELS } from '../../utils/format';

const QuoteCard: React.FC<{ quote: Quote }> = ({ quote }) => {
  const acceptQuote = useAcceptQuote();
  const rejectQuote = useRejectQuote();
  const [expanded, setExpanded] = useState(false);

  const isPending = quote.status === 'SUBMITTED' || quote.status === 'PENDING' || quote.status === 'REVISED';

  const handleAccept = async () => {
    try {
      await acceptQuote.mutateAsync(quote.id);
      toast.success('Teklif kabul edildi! Uzman ile iletişime geçebilirsiniz.');
    } catch (err) {
      toastApiError(err, 'Teklif kabul edilemedi');
    }
  };

  const handleReject = async () => {
    try {
      await rejectQuote.mutateAsync(quote.id);
      toast.info('Teklif reddedildi.');
    } catch (err) {
      toastApiError(err, 'Teklif reddedilemedi');
    }
  };

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%', background: 'var(--color-surface-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--color-primary-light)',
          }}>
            {(quote.provider.business_name || '?').charAt(0)}
          </div>
          <div>
            <Link to={`/provider/${quote.provider_id}`} style={{ fontWeight: 700, color: 'var(--color-text)', textDecoration: 'none' }}>
              {quote.provider.business_name}
            </Link>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              ⭐ {quote.provider.rating?.toFixed(1)} · {quote.provider.review_count} yorum
              {quote.provider.verification_level !== 'NONE' && ' · ✔ Doğrulanmış'}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-accent-light)' }}>{formatTRY(quote.price)}</div>
          <span className="badge badge-outline" style={{ fontSize: '0.72rem' }}>
            {QUOTE_STATUS_LABELS[quote.status] || quote.status}
          </span>
        </div>
      </div>

      {quote.description && (
        <p style={{ margin: '12px 0 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{quote.description}</p>
      )}

      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          marginTop: 10, background: 'none', border: 'none', color: 'var(--color-primary-light)',
          cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4, padding: 0,
        }}
      >
        Detaylar {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div style={{ marginTop: 10, display: 'grid', gap: 8, fontSize: '0.85rem' }}>
          {quote.estimated_duration && <div>⏱️ Süre: {quote.estimated_duration}</div>}
          {quote.warranty && <div>🛡️ Garanti: {quote.warranty}</div>}
          {quote.materials && <div>🧰 Malzeme: {quote.materials}</div>}
          <div style={{ color: 'var(--color-text-dim)', fontSize: '0.78rem' }}>
            Teklif tarihi: {formatDateTime(quote.created_at)}
          </div>
        </div>
      )}

      {isPending && (
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleAccept} disabled={acceptQuote.isPending}>
            <Check size={15} /> Kabul Et
          </button>
          <button className="btn btn-outline" onClick={handleReject} disabled={rejectQuote.isPending}>
            <X size={15} /> Reddet
          </button>
          <Link to="/chat" className="btn btn-outline">
            <MessageSquare size={15} /> Mesaj Gönder
          </Link>
        </div>
      )}
    </div>
  );
};

const RequestItem: React.FC<{ request: ServiceRequest }> = ({ request }) => {
  const [open, setOpen] = useState(false);
  const { data: quotes, isLoading: quotesLoading } = useQuotesForRequest(open ? request.id : undefined);

  const statusLabel = REQUEST_STATUS_LABELS[request.status] || request.status;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left', background: 'none', border: 'none',
          color: 'inherit', cursor: 'pointer', padding: '18px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700 }}>{request.title}</span>
            <span className="badge badge-primary">{statusLabel}</span>
            <span className="badge badge-outline">{URGENCY_LABELS[request.urgency] || request.urgency}</span>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: '0.8rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
            <span><MapPin size={12} style={{ verticalAlign: -2 }} /> {request.city?.name ?? '-'}</span>
            <span>Bütçe: {formatTRY(request.budget_min)} – {formatTRY(request.budget_max)}</span>
            {request.preferred_date && <span><Calendar size={12} style={{ verticalAlign: -2 }} /> {formatDate(request.preferred_date)}</span>}
            <span>{formatDate(request.created_at)}</span>
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {open && (
        <div style={{ padding: '0 20px 20px', display: 'grid', gap: 12 }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{request.description}</p>
          {request.notes && (
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-dim)' }}>Not: {request.notes}</p>
          )}
          <h4 style={{ margin: '8px 0 0', fontSize: '0.95rem' }}>Gelen Teklifler</h4>
          {quotesLoading && <div style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>Teklifler yükleniyor...</div>}
          {quotes && quotes.length > 0 ? (
            quotes.map(q => <QuoteCard key={q.id} quote={q} />)
          ) : !quotesLoading ? (
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', padding: '8px 0' }}>
              Henüz teklif gelmedi. Uzmanlar talebinizi inceliyor.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

const MyRequestsPage: React.FC = () => {
  const { data, isLoading, isError, refetch } = useMyRequests();

  return (
    <Layout>
      <SEO title="Taleplerim" description="Hizmet talepleriniz ve gelen teklifler" />
      <div className="container" style={{ padding: '32px 24px', maxWidth: 900 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: '1.8rem', margin: 0 }}>Taleplerim</h1>
            <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
              Taleplerinizi yönetin, gelen teklifleri karşılaştırın.
            </p>
          </div>
          <Link to="/request/create" className="btn btn-primary">Yeni Talep</Link>
        </div>

        {isLoading && <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)' }}>Yükleniyor...</div>}
        {isError && (
          <EmptyState
            icon={<FileText size={36} />}
            title="Talepler yüklenemedi"
            message="Bir hata oluştu, lütfen tekrar deneyin."
            action={<button className="btn btn-outline" onClick={() => refetch()}>Tekrar Dene</button>}
          />
        )}
        {data && data.items.length === 0 && (
          <EmptyState
            icon={<FileText size={36} />}
            title="Henüz talebiniz yok"
            message="İhtiyacınız olan hizmeti anlatın, bölgenizdeki uzmanlar size teklif göndersin."
            action={<Link to="/request/create" className="btn btn-primary">İlk Talebinizi Oluşturun</Link>}
          />
        )}
        <div style={{ display: 'grid', gap: 14 }}>
          {data?.items.map(r => <RequestItem key={r.id} request={r} />)}
        </div>
      </div>
    </Layout>
  );
};

export default MyRequestsPage;

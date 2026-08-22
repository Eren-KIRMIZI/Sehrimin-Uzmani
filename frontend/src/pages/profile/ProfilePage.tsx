import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon, Lock, ShieldCheck, Trash2, Briefcase, BadgeCheck,
  Plus, MapPin, FolderPlus, Clock,
} from 'lucide-react';
import Layout from '../../components/layout/Layout';
import SEO from '../../components/SEO';
import { useAuthStore } from '../../stores/authStore';
import {
  useUpdateProfile, useChangePassword, useEnable2fa, useVerify2fa, useDisable2fa,
  useMyProviderProfile, useCategories, useCities, useDistricts,
  useApplyVerification, useMyVerifications,
} from '../../hooks/useQueries';
import { providersApi } from '../../services';
import { toast, toastApiError } from '../../stores/toastStore';
import { formatDateTime } from '../../utils/format';

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--color-text)',
  fontFamily: 'inherit', fontSize: '0.9rem',
};

const SectionCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="card" style={{ padding: 22 }}>
    <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px', fontWeight: 700 }}>
      {icon} {title}
    </h3>
    {children}
  </div>
);

const PersonalInfoSection: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const updateProfile = useUpdateProfile();
  const [form, setForm] = useState({
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    phone: user?.phone ?? '',
  });

  const save = async () => {
    try {
      const updated = await updateProfile.mutateAsync(form);
      setUser({ ...user!, ...updated });
      toast.success('Profil bilgileri güncellendi.');
    } catch (err) {
      toastApiError(err, 'Profil güncellenemedi');
    }
  };

  return (
    <SectionCard icon={<UserIcon size={18} />} title="Kişisel Bilgiler">
      <div style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
        <label style={{ fontSize: '0.85rem' }}>Ad
          <input style={inputStyle} value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
        </label>
        <label style={{ fontSize: '0.85rem' }}>Soyad
          <input style={inputStyle} value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
        </label>
        <label style={{ fontSize: '0.85rem' }}>Telefon
          <input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+90..." />
        </label>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          E-posta: <strong style={{ color: 'var(--color-text)' }}>{user?.email}</strong> (değiştirilemez)
        </div>
        <button className="btn btn-primary" onClick={save} disabled={updateProfile.isPending} style={{ justifySelf: 'start' }}>
          Kaydet
        </button>
      </div>
    </SectionCard>
  );
};

const PasswordSection: React.FC = () => {
  const changePassword = useChangePassword();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const submit = async () => {
    if (next.length < 6) return toast.error('Yeni şifre en az 6 karakter olmalı');
    if (next !== confirm) return toast.error('Şifreler eşleşmiyor');
    try {
      await changePassword.mutateAsync({ current, next });
      toast.success('Şifreniz güncellendi.');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err) {
      toastApiError(err, 'Şifre değiştirilemedi');
    }
  };

  return (
    <SectionCard icon={<Lock size={18} />} title="Şifre Değiştir">
      <div style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
        <input type="password" style={inputStyle} placeholder="Mevcut şifre" value={current} onChange={e => setCurrent(e.target.value)} />
        <input type="password" style={inputStyle} placeholder="Yeni şifre" value={next} onChange={e => setNext(e.target.value)} />
        <input type="password" style={inputStyle} placeholder="Yeni şifre (tekrar)" value={confirm} onChange={e => setConfirm(e.target.value)} />
        <button className="btn btn-primary" onClick={submit} disabled={changePassword.isPending || !current || !next} style={{ justifySelf: 'start' }}>
          Şifreyi Güncelle
        </button>
      </div>
    </SectionCard>
  );
};

const TwoFactorSection: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const enable2fa = useEnable2fa();
  const verify2fa = useVerify2fa();
  const disable2fa = useDisable2fa();
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');

  const startEnable = async () => {
    try {
      const res = await enable2fa.mutateAsync(undefined);
      setQrUri(res.qr_uri);
    } catch (err) {
      toastApiError(err, '2FA başlatılamadı');
    }
  };

  const confirmEnable = async () => {
    try {
      await verify2fa.mutateAsync(code);
      setUser({ ...user!, two_factor_enabled: true });
      toast.success('İki faktörlü doğrulama etkinleştirildi.');
      setQrUri(null); setCode('');
    } catch (err) {
      toastApiError(err);
    }
  };

  const turnOff = async () => {
    try {
      await disable2fa.mutateAsync(password);
      setUser({ ...user!, two_factor_enabled: false });
      toast.info('İki faktörlü doğrulama kapatıldı.');
      setPassword('');
    } catch (err) {
      toastApiError(err);
    }
  };

  return (
    <SectionCard icon={<ShieldCheck size={18} />} title="Güvenlik — İki Faktörlü Doğrulama">
      {user?.two_factor_enabled ? (
        <div style={{ display: 'grid', gap: 10, maxWidth: 480 }}>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-success)' }}>✔ Etkin</p>
          <input type="password" style={inputStyle} placeholder="Şifreniz" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="btn btn-outline" onClick={turnOff} disabled={!password || disable2fa.isPending} style={{ justifySelf: 'start' }}>
            Kapat
          </button>
        </div>
      ) : qrUri ? (
        <div style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
            Authenticator uygulamanızla QR kodu okutun ve doğrulama kodunu girin.
          </p>
          <img src={qrUri} alt="2FA QR kodu" width={160} height={160} style={{ borderRadius: 8, background: '#fff', padding: 6 }} />
          <input style={inputStyle} placeholder="6 haneli kod (demo: 123456)" value={code} onChange={e => setCode(e.target.value)} maxLength={6} />
          <button className="btn btn-primary" onClick={confirmEnable} disabled={code.length !== 6} style={{ justifySelf: 'start' }}>
            Doğrula ve Etkinleştir
          </button>
        </div>
      ) : (
        <button className="btn btn-primary" onClick={startEnable} disabled={enable2fa.isPending}>
          İki Faktörlü Doğrulamayı Etkinleştir
        </button>
      )}
    </SectionCard>
  );
};

const DangerZone: React.FC = () => {
  const navigate = useNavigate();
  const logout = useAuthStore(s => s.logout);
  const [confirmText, setConfirmText] = useState('');
  const [open, setOpen] = useState(false);

  const deleteAccount = async () => {
    try {
      const { usersApi } = await import('../../services');
      await usersApi.deleteMe();
      logout();
      toast.info('Hesabınız silindi.');
      navigate('/');
    } catch (err) {
      toastApiError(err, 'Hesap silinemedi');
    }
  };

  return (
    <SectionCard icon={<Trash2 size={18} />} title="Hesabı Sil">
      {!open ? (
        <>
          <p style={{ margin: '0 0 12px', fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
            Hesabınızı silmek geri alınamaz. Tüm verileriniz kaldırılır.
          </p>
          <button className="btn btn-outline" style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }} onClick={() => setOpen(true)}>
            Hesabımı Sil
          </button>
        </>
      ) : (
        <div style={{ display: 'grid', gap: 10, maxWidth: 480 }}>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-error)' }}>
            Onaylamak için "SİL" yazın.
          </p>
          <input style={inputStyle} value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="SİL" />
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={() => setOpen(false)}>Vazgeç</button>
            <button
              className="btn btn-primary"
              style={{ background: 'var(--color-error)' }}
              onClick={deleteAccount}
              disabled={confirmText !== 'SİL'}
            >
              Kalıcı Olarak Sil
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  );
};

// ── Uzman bölümleri ─────────────────────────────────────────────────────────

const BusinessInfoSection: React.FC = () => {
  const { data: provider, refetch } = useMyProviderProfile();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ business_name: string; bio: string; hourly_rate: number; years_experience: number; is_available: boolean } | null>(null);

  React.useEffect(() => {
    if (provider && !form) {
      setForm({
        business_name: provider.business_name ?? '',
        bio: provider.bio ?? '',
        hourly_rate: provider.hourly_rate ?? 0,
        years_experience: provider.years_experience ?? 0,
        is_available: provider.is_available,
      });
    }
  }, [provider, form]);

  if (!provider) return null;

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await providersApi.updateMe(form);
      await refetch();
      toast.success('İşletme bilgileri güncellendi.');
    } catch (err) {
      toastApiError(err, 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  if (!form) return null;
  return (
    <SectionCard icon={<Briefcase size={18} />} title="İşletme Bilgileri">
      <div style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
        <label style={{ fontSize: '0.85rem' }}>İşletme Adı
          <input style={inputStyle} value={form.business_name} onChange={e => setForm(f => f && { ...f, business_name: e.target.value })} />
        </label>
        <label style={{ fontSize: '0.85rem' }}>Hakkında
          <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={form.bio} onChange={e => setForm(f => f && { ...f, bio: e.target.value })} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ fontSize: '0.85rem' }}>Saatlik Ücret (₺)
            <input type="number" style={inputStyle} value={form.hourly_rate} onChange={e => setForm(f => f && { ...f, hourly_rate: Number(e.target.value) })} />
          </label>
          <label style={{ fontSize: '0.85rem' }}>Deneyim (yıl)
            <input type="number" style={inputStyle} value={form.years_experience} onChange={e => setForm(f => f && { ...f, years_experience: Number(e.target.value) })} />
          </label>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem' }}>
          <input type="checkbox" checked={form.is_available} onChange={e => setForm(f => f && { ...f, is_available: e.target.checked })} />
          Yeni işlere açığım
        </label>
        <button className="btn btn-primary" onClick={save} disabled={saving} style={{ justifySelf: 'start' }}>Kaydet</button>
      </div>
    </SectionCard>
  );
};

const VerificationSection: React.FC = () => {
  const { data: myVerifications } = useMyVerifications();
  const applyVerification = useApplyVerification();
  const [type, setType] = useState<'IDENTITY' | 'PROFESSIONAL' | 'BUSINESS'>('IDENTITY');
  const [documentUrl, setDocumentUrl] = useState('');
  const [note, setNote] = useState('');

  const apply = async () => {
    try {
      await applyVerification.mutateAsync({ verification_type: type, document_url: documentUrl, note });
      toast.success('Doğrulama başvurunuz alındı. Admin incelemesinden sonra sonuçlanır.');
      setDocumentUrl(''); setNote('');
    } catch (err) {
      toastApiError(err, 'Başvuru gönderilemedi');
    }
  };

  const typeLabels: Record<string, string> = { IDENTITY: 'Kimlik', PROFESSIONAL: 'Mesleki Belge', BUSINESS: 'İşletme Belgesi' };
  const statusLabels: Record<string, string> = { PENDING: 'Beklemede', APPROVED: 'Onaylandı', REJECTED: 'Reddedildi' };

  return (
    <SectionCard icon={<BadgeCheck size={18} />} title="Doğrulama Başvurusu">
      <div style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
        {myVerifications && myVerifications.length > 0 && (
          <div style={{ display: 'grid', gap: 8 }}>
            {myVerifications.map(v => (
              <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', padding: '8px 12px', background: 'var(--color-surface-2)', borderRadius: 8 }}>
                <span>{typeLabels[v.verification_type] ?? v.verification_type}</span>
                <span style={{
                  color: v.status === 'APPROVED' ? 'var(--color-success)' : v.status === 'REJECTED' ? 'var(--color-error)' : 'var(--color-warning)',
                }}>
                  {statusLabels[v.status] ?? v.status}{v.reviewed_at ? ` · ${formatDateTime(v.reviewed_at)}` : ''}
                </span>
              </div>
            ))}
          </div>
        )}
        <select style={inputStyle} value={type} onChange={e => setType(e.target.value as typeof type)}>
          <option value="IDENTITY">Kimlik Doğrulama</option>
          <option value="PROFESSIONAL">Mesleki Belge (diploma/sertifika)</option>
          <option value="BUSINESS">İşletme Belgesi</option>
        </select>
        <input style={inputStyle} placeholder="Belge görsel bağlantısı (URL)" value={documentUrl} onChange={e => setDocumentUrl(e.target.value)} />
        <textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Not (opsiyonel)" value={note} onChange={e => setNote(e.target.value)} />
        <button className="btn btn-primary" onClick={apply} disabled={applyVerification.isPending} style={{ justifySelf: 'start' }}>
          Başvuruyu Gönder
        </button>
      </div>
    </SectionCard>
  );
};

const ProviderSetupSections: React.FC = () => {
  const { data: provider, refetch } = useMyProviderProfile();
  const { data: cities } = useCities();
  const { data: districts } = useDistricts(cities?.[0]?.id);
  const { data: categories } = useCategories();

  const [serviceId, setServiceId] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [portfolioTitle, setPortfolioTitle] = useState('');
  const [cityId, setCityId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [day, setDay] = useState('1');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('18:00');

  if (!provider) return null;
  const cityDistricts = districts?.filter(d => String(d.city_id) === cityId);

  const wrap = async (fn: () => Promise<unknown>, successMsg: string) => {
    try {
      await fn();
      await refetch();
      toast.success(successMsg);
    } catch (err) {
      toastApiError(err);
    }
  };

  return (
    <>
      <SectionCard icon={<Plus size={18} />} title="Hizmet Ekle">
        <div style={{ display: 'grid', gap: 10, maxWidth: 520 }}>
          {provider.services.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {provider.services.map((s: any) => (
                <span key={s.id} className="badge badge-outline">{s.service.name}</span>
              ))}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 10 }}>
            <select style={inputStyle} value={serviceId} onChange={e => setServiceId(e.target.value)}>
              <option value="">Hizmet seçin</option>
              {(categories ?? []).map(c => (
                <optgroup key={c.id} label={c.name}>
                  {(c.subcategories ?? []).flatMap(sc => sc.services ?? []).map(sv => (
                    <option key={sv.id} value={sv.id}>{sv.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <input type="number" style={inputStyle} placeholder="Başlangıç ₺" value={servicePrice} onChange={e => setServicePrice(e.target.value)} />
            <button
              className="btn btn-outline"
              disabled={!serviceId}
              onClick={() => {
                void wrap(
                  () => providersApi.addService({ service_id: Number(serviceId), starting_price: Number(servicePrice) || undefined }),
                  'Hizmet eklendi.'
                );
                setServiceId(''); setServicePrice('');
              }}
            >
              <Plus size={15} />
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={<FolderPlus size={18} />} title="Portföy Çalışması Ekle">
        <div style={{ display: 'grid', gap: 10, maxWidth: 520 }}>
          <input style={inputStyle} placeholder="Görsel URL" value={portfolioUrl} onChange={e => setPortfolioUrl(e.target.value)} />
          <input style={inputStyle} placeholder="Başlık" value={portfolioTitle} onChange={e => setPortfolioTitle(e.target.value)} />
          <button
            className="btn btn-outline"
            style={{ justifySelf: 'start' }}
            disabled={!portfolioUrl}
            onClick={() => {
              void wrap(() => providersApi.addPortfolio({ image_url: portfolioUrl, title: portfolioTitle }), 'Portföy çalışması eklendi.');
              setPortfolioUrl(''); setPortfolioTitle('');
            }}
          >
            Portföye Ekle
          </button>
        </div>
      </SectionCard>

      <SectionCard icon={<MapPin size={18} />} title="Hizmet Bölgesi Ekle">
        <div style={{ display: 'grid', gap: 10, maxWidth: 520 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10 }}>
            <select style={inputStyle} value={cityId} onChange={e => { setCityId(e.target.value); setDistrictId(''); }}>
              <option value="">İl seçin</option>
              {(cities ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select style={inputStyle} value={districtId} onChange={e => setDistrictId(e.target.value)} disabled={!cityId}>
              <option value="">İlçe (opsiyonel)</option>
              {(cityDistricts ?? []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <button
              className="btn btn-outline"
              disabled={!cityId}
              onClick={() => {
                void wrap(
                  () => providersApi.addLocation({ city_id: Number(cityId), district_id: districtId ? Number(districtId) : undefined }),
                  'Hizmet bölgesi eklendi.'
                );
                setCityId(''); setDistrictId('');
              }}
            >
              <Plus size={15} />
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={<Clock size={18} />} title="Çalışma Saati Ekle">
        <div style={{ display: 'grid', gap: 10, maxWidth: 520 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr auto', gap: 10 }}>
            <select style={inputStyle} value={day} onChange={e => setDay(e.target.value)}>
              {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map((d, i) => (
                <option key={i} value={i === 6 ? 6 : i + 1}>{d}</option>
              ))}
            </select>
            <input type="time" style={inputStyle} value={start} onChange={e => setStart(e.target.value)} />
            <input type="time" style={inputStyle} value={end} onChange={e => setEnd(e.target.value)} />
            <button
              className="btn btn-outline"
              onClick={() => {
                void wrap(
                  () => providersApi.addAvailability({ day_of_week: Number(day), start_time: start, end_time: end }),
                  'Çalışma saati eklendi.'
                );
              }}
            >
              <Plus size={15} />
            </button>
          </div>
        </div>
      </SectionCard>
    </>
  );
};

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const isProvider = user?.role === 'PROVIDER';

  return (
    <Layout>
      <SEO title="Profilim" description="Hesap ayarlarınız" />
      <div className="container" style={{ padding: '32px 24px', maxWidth: 760, display: 'grid', gap: 20 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.8rem', margin: 0 }}>Profilim</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
            Hesap bilgilerinizi ve tercihlerinizi yönetin.
          </p>
        </div>

        <PersonalInfoSection />
        {isProvider && <BusinessInfoSection />}
        {isProvider && <ProviderSetupSections />}
        {isProvider && <VerificationSection />}
        <PasswordSection />
        <TwoFactorSection />
        <DangerZone />
      </div>
    </Layout>
  );
};

export default ProfilePage;

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import SEO from '../components/SEO';

interface StaticContent {
  title: string;
  intro: string;
  sections: { heading: string; body: string[] }[];
}

const CONTENT: Record<string, StaticContent> = {
  hakkimizda: {
    title: 'Hakkımızda',
    intro: 'Şehrimin Uzmanı, ihtiyaç duyduğunuz hizmeti güvenle alabilmeniz için bölgenizdeki doğrulanmış uzmanları tek platformda buluşturur.',
    sections: [
      { heading: 'Misyonumuz', body: ['Uzman bulmak zor olmamalı. Elektrikçiden psikoloğa, temizlikten özel derse kadar onlarca kategoride; puanlanmış, yorumlanmış ve doğrulanmış uzmanlarla saniyeler içinde iletişim kurabilirsiniz.'] },
      { heading: 'Nasıl Çalışır?', body: ['Talebinizi oluşturun veya arama yapın → gelen teklifleri karşılaştırın → size uygun uzmanla randevulaşın → iş tamamlandığında değerlendirin. Tüm süreç platform üzerinden şeffaf şekilde yürür.'] },
      { heading: 'Değerlerimiz', body: ['Şeffaflık: Gizli ücret yok, teklifler açık.', 'Güven: Kimlik ve mesleki belge doğrulaması.', 'Kalite: Gerçek müşteri değerlendirmeleri.'] },
    ],
  },
  iletisim: {
    title: 'İletişim',
    intro: 'Sorularınız ve geri bildirimleriniz için bize ulaşın — en kısa sürede dönüş yapıyoruz.',
    sections: [
      { heading: 'Destek', body: ['E-posta: destek@sehriminuzmani.com', 'Telefon: +90 (850) 000 00 00 (Hafta içi 09:00–18:00)'] },
      { heading: 'Adres', body: ['Şehrimin Uzmanı Teknoloji A.Ş.', 'Kadıköy / İstanbul'] },
      { heading: 'İş Ortaklıkları', body: ['Uzman olarak platformumuza katılmak veya kurumsal iş birlikleri için: isbirligi@sehriminuzmani.com'] },
    ],
  },
  gizlilik: {
    title: 'Gizlilik Politikası',
    intro: 'Kişisel verilerinizin güvenliği bizim için önemlidir. Bu politika, hangi verileri hangi amaçlarla işlediğimizi açıklar.',
    sections: [
      { heading: 'Topladığımız Veriler', body: ['Hesap bilgileriniz (ad, e-posta, telefon)', 'Talep, teklif ve randevu kayıtları', 'Platform kullanımına ilişkin teknik veriler'] },
      { heading: 'Verilerin Kullanımı', body: ['Hizmetlerin sunulması ve iyileştirilmesi', 'Size en uygun uzmanların önerilmesi', 'Yasal yükümlülüklerin yerine getirilmesi'] },
      { heading: 'Veri Güvenliği', body: ['Tüm veriler şifreli olarak saklanır ve yetkisiz erişime karşı korunur. Verilerinizi KVKK kapsamındaki haklar çerçevesinde yönetebilirsiniz.'] },
    ],
  },
  kvkk: {
    title: 'KVKK Aydınlatma Metni',
    intro: '6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu Şehrimin Uzmanı Teknoloji A.Ş.’dir.',
    sections: [
      { heading: 'İşleme Amaçları', body: ['Üyelik ve hesap yönetimi', 'Hizmet taleplerinin uzmanlarla eşleştirilmesi', 'Ödeme ve komisyon süreçlerinin yürütülmesi'] },
      { heading: 'Aktarım', body: ['Verileriniz, hizmetin sunulması için gerekli ölçüde; barındırma ve ödeme sağlayıcıları gibi tedarikçilerimize ve yasal talepler halinde yetkili mercilere aktarılabilir.'] },
      { heading: 'Haklarınız', body: ['KVKK m.11 kapsamında verilerinize erişme, düzeltme, silme ve işlemeye itiraz etme haklarına sahipsiniz. Taleplerinizi destek@sehriminuzmani.com adresine iletebilirsiniz.'] },
    ],
  },
  'kullanici-sozlesmesi': {
    title: 'Kullanıcı Sözleşmesi',
    intro: 'Platformu kullanarak bu sözleşmeyi kabul etmiş sayılırsınız.',
    sections: [
      { heading: 'Hizmet Kapsamı', body: ['Şehrimin Uzmanı, uzmanlar ile kullanıcıları buluşturan bir aracı platformdur. Hizmetin ifası taraflar arasındaki anlaşmaya tabidir; platform işin sonucunu garanti etmez.'] },
      { heading: 'Kullanıcı Yükümlülükleri', body: ['Doğru ve güncel bilgi sağlamak', 'Başkalarının haklarını ihlal etmemek', 'Platformu kötüye kullanmamak (spam, dolandırıcılık vb.)'] },
      { heading: 'Hesap İptali', body: ['Kurallara aykırı davranan hesaplar uyarı verilmeksizin askıya alınabilir.'] },
    ],
  },
  'cerez-politikasi': {
    title: 'Çerez Politikası',
    intro: 'Oturumunuzun çalışması ve deneyiminizin iyileştirilmesi için çerezler kullanılır.',
    sections: [
      { heading: 'Zorunlu Çerezler', body: ['Oturum açma ve güvenlik için gereklidir; devre dışı bırakılamaz.'] },
      { heading: 'Tercih Çerezleri', body: ['Tema ve dil gibi tercihleriniz hatırlanır.'] },
      { heading: 'Yönetimi', body: ['Tarayıcı ayarlarınızdan çerezleri her zaman silebilir veya engelleyebilirsiniz.'] },
    ],
  },
  guvenlik: {
    title: 'Güvenlik',
    intro: 'Güvenli bir platform için aldığımız önlemler ve sizin yapabilecekleriniz.',
    sections: [
      { heading: 'Aldığımız Önlemler', body: ['Kimlik ve belge doğrulama süreçleri', 'AI destekli dolandırıcılık risk skoru', 'Anlaşmazlık çözüm merkezi'] },
      { heading: 'Sizin İçin Önerilerimiz', body: ['Güçlü ve benzersiz bir şifre kullanın', 'İki faktörlü doğrulamayı etkinleştirin', 'Ödemeleri daima platform üzerinden yapın'] },
    ],
  },
  sss: {
    title: 'Sıkça Sorulan Sorular',
    intro: 'En çok merak edilenler.',
    sections: [
      { heading: 'Uzmanlar nasıl doğrulanıyor?', body: ['Uzmanlar kimlik, mesleki belge veya işletme belgesi doğrulamalarından geçebilir. Doğrulama seviyeleri profillerinde görünür.'] },
      { heading: 'Komisyon ne kadar?', body: ['Komisyon oranı uzmanın abonelik planına göre %0–30 indirimle değişir. Detaylar Planlar sayfasındadır.'] },
      { heading: 'Bir sorun olursa ne yapmalıyım?', body: ['Randevu gelmeme, kalite sorunları gibi durumlarda Anlaşmazlık sayfasından şikayet oluşturabilirsiniz; ekibimiz iki tarafı da dinleyerek süreci yürütür.'] },
    ],
  },
};

const StaticPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const content = CONTENT[slug ?? ''];

  return (
    <Layout>
      <SEO title={content?.title ?? 'Sayfa Bulunamadı'} description={content?.intro} />
      <div className="container" style={{ padding: '48px 24px', maxWidth: 760 }}>
        {content ? (
          <>
            <h1 style={{ fontWeight: 800, fontSize: '2rem', margin: '0 0 8px' }}>{content.title}</h1>
            <p style={{ color: 'var(--color-text-muted)', margin: '0 0 28px' }}>{content.intro}</p>
            <div style={{ display: 'grid', gap: 20 }}>
              {content.sections.map(s => (
                <div key={s.heading} className="card" style={{ padding: 22 }}>
                  <h3 style={{ margin: '0 0 10px', fontWeight: 700 }}>{s.heading}</h3>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {s.body.map((line, i) => (
                      <p key={i} style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <h2 style={{ marginTop: 0 }}>Sayfa bulunamadı</h2>
            <Link to="/" className="btn btn-primary">Ana Sayfaya Dön</Link>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StaticPage;

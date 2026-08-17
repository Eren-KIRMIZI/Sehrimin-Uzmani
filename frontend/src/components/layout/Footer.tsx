import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-primary text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">Şehrinin Uzmani</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Şehrindeki doğru uzmanı bul. İhtiyacını anlat, bölgedeki güvenilir uzmanlardan teklif al.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Kategoriler</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/category/ev-yasam" className="hover:text-accent transition-colors">Ev & Yaşam</Link></li>
              <li><Link to="/category/teknik-hizmetler" className="hover:text-accent transition-colors">Teknik Hizmetler</Link></li>
              <li><Link to="/category/saglik-wellness" className="hover:text-accent transition-colors">Sağlık & Wellness</Link></li>
              <li><Link to="/category/egitim" className="hover:text-accent transition-colors">Eğitim</Link></li>
              <li><Link to="/category/arac" className="hover:text-accent transition-colors">Araç</Link></li>
              <li><Link to="/category/dijital-hizmetler" className="hover:text-accent transition-colors">Dijital Hizmetler</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Popüler Şehirler</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/city/istanbul" className="hover:text-accent transition-colors">İstanbul</Link></li>
              <li><Link to="/city/ankara" className="hover:text-accent transition-colors">Ankara</Link></li>
              <li><Link to="/city/izmir" className="hover:text-accent transition-colors">İzmir</Link></li>
              <li><Link to="/city/antalya" className="hover:text-accent transition-colors">Antalya</Link></li>
              <li><Link to="/city/nevsehir" className="hover:text-accent transition-colors">Nevşehir</Link></li>
              <li><Link to="/city/kayseri" className="hover:text-accent transition-colors">Kayseri</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/register" className="hover:text-accent transition-colors">Uzman Ol</Link></li>
              <li><Link to="/pricing" className="hover:text-accent transition-colors">Uzman Planlari</Link></li>
              <li><Link to="/how-it-works" className="hover:text-accent transition-colors">Nasil Calisir?</Link></li>
              <li><Link to="/about" className="hover:text-accent transition-colors">Hakkimizda</Link></li>
              <li><Link to="/contact" className="hover:text-accent transition-colors">Iletisim</Link></li>
              <li><Link to="/terms" className="hover:text-accent transition-colors">Kullanim Sartlari</Link></li>
              <li><Link to="/privacy" className="hover:text-accent transition-colors">Gizlilik Politikasi</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© 2026 Şehrinin Uzmani. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">81 ilde hizmet veriyoruz</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

# sehriminUzmani - Load Test Suite

Bu dizin, sistemin 10.000 (ve ötesi) eşzamanlı kullanıcı altında stabilitesini ölçmek için tasarlanmış production-grade sentetik veri üretici ve k6 scriptlerini içerir.

## 1. Sentetik Veri Üretimi (Seed)

Load test'in gerçeği yansıtması için üretim ortamındaki veri hacmi simüle edilmelidir. `generate_seed.py` ortam değişkenleri ile çalışır.

### Smoke Test (Düşük Hacim) İçin Veri:
```bash
export PROVIDERS=10000
python tests/load/generate_seed.py
```

### Production Benchmark (Yüksek Hacim) İçin Veri:
```bash
export PROVIDERS=500000
# Veya milyonlarca service ve message
python tests/load/generate_seed.py
```

*Not: Script, RAM'i doldurmamak adına SQLAlchemy bulk_save_objects ile çalışır.*

## 2. K6 Load Testlerinin Çalıştırılması

ÖNEMLİ KURAL: Testleri **asla 10k ile doğrudan başlatmayın**. Kapasite testi (Capacity Planning) adım adım yapılır:

1. **Smoke (100 VU):** Hatalar, 404'ler ve DB bağlantı sorunları var mı?
2. **Small/Medium (500-1000 VU):** Ortalama trafik davranışı.
3. **Target (10.000 VU):** Hedef kapasiteye ulaşılabiliyor mu?
4. **Stress (15.000 VU):** Sistem kırıldığında, kendini onarabiliyor mu?
5. **Soak (10.000 VU, 45-60 DK):** Bellek veya bağlantı sızıntısı var mı?

### Komutlar:

```bash
# HTTP Baseline
k6 run -e BASE_URL=https://staging.sehriminuzmani.com tests/load/http_baseline.js

# WebSocket
k6 run -e WS_URL=wss://staging.sehriminuzmani.com tests/load/websocket.js

# Mixed (HTTP + WebSocket)
k6 run -e BASE_URL=https://staging... -e WS_URL=wss://staging... tests/load/mixed.js

# Spike Test
k6 run -e BASE_URL=https://staging... tests/load/spike.js

# Soak Test (Uzun süreli)
k6 run -e BASE_URL=https://staging... tests/load/soak.js
```

## 3. Kök Neden Analizi (Root Cause Analysis - RCA) Metodolojisi

Eğer k6 test sonucunda `p99 = 2.4 sec` görürseniz **asla doğrudan mimari çözüm (PgBouncer, AsyncPg vb.) uygulamayın.**

P99 süresinin yükseldiği andaki metriklere çapraz (correlation) bakılmalıdır:

1. **Hangi Endpoint ve Query Yavaşladı?**
   - Search ise: `EXPLAIN (ANALYZE, BUFFERS)` çıktısını alın. Index taraması, Sort veya Nested Loop bottleneck'lerini inceleyin.
2. **DB Active Connections kaç?**
   - Limitlere dayanmışsa (`pg_stat_activity`), PostgreSQL Pool saturation oluşmuştur. (Bkz: Uvicorn worker sayısını düşürmek veya Pool'u optimize etmek).
3. **Backend CPU Yükü Ne Durumda?**
   - Uvicorn/Gunicorn %100 CPU'da ise, I/O değil CPU bottleneck vardır. Daha fazla worker (Horizontal Scaling) gerekir.
4. **AnyIO Threadpool Saturation**
   - Event loop `asyncio.to_thread` havuzunda kuyruk bekliyor olabilir.

### Gözetim Listesi
Test esnasında terminalin dışında şu araçlar da açık olmalıdır:
- `htop` (Uygulama/Load Generator makinesi CPU)
- `watch -n 1 "psql -c 'SELECT count(*) FROM pg_stat_activity WHERE state=\'active\''"`
- Redis: `redis-cli info stats` (Hit ratio ve ops/sec takibi)

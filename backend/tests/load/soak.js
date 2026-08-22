import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
  scenarios: {
    soak_test: {
      executor: 'constant-vus',
      vus: 10000, 
      duration: '45m', // 45 dakika boyunca surekli ve sabit 10k kullanici
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1200'], 
    'http_req_failed': ['rate<0.01'] // Hata orani 45 dk boyunca dusuk kalmali
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function () {
  let rand = Math.random();

  if (rand < 0.70) {
    if (Math.random() < 0.5) {
      let res = http.get(`${BASE_URL}/api/v1/categories`);
      check(res, { 'status is 200': (r) => r.status === 200 });
    } else {
      let providerId = randomIntBetween(1, 10000);
      let res = http.get(`${BASE_URL}/api/v1/providers/${providerId}`);
      check(res, { 'status is 200 or 404': (r) => r.status === 200 || r.status === 404 });
    }
  } else if (rand < 0.90) {
    let res = http.get(`${BASE_URL}/api/v1/search/providers?q=temizlik`);
    check(res, { 'status is 200': (r) => r.status === 200 });
  } else {
    let res = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
      username: `loadtest_0_${randomIntBetween(1, 5000)}@test.com`,
      password: "fakehash"
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  sleep(randomIntBetween(2, 6)); // Soak'da biraz daha insani (realistik) bekleme suresi
}

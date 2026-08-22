import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
  scenarios: {
    http_baseline: {
      executor: 'ramping-vus',
      startVUs: 100,
      stages: [
        { duration: '2m', target: 1000 },
        { duration: '3m', target: 3000 },
        { duration: '5m', target: 5000 },
        { duration: '5m', target: 7500 },
        { duration: '10m', target: 10000 }, // Steady state
        { duration: '3m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    'http_req_failed': ['rate<0.01'], // Hata orani %1'in altinda olmali
    // Endpoint spesifik threshold'lar
    'http_req_duration{name:Categories}': ['p(95)<100', 'p(99)<250'],
    'http_req_duration{name:Profile}': ['p(95)<200', 'p(99)<500'],
    'http_req_duration{name:Search}': ['p(95)<500', 'p(99)<1200'], // Search daha yavas olabilir
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function () {
  let rand = Math.random();

  // %70 Read (Kategori veya Profil Goruntuleme)
  if (rand < 0.70) {
    if (Math.random() < 0.5) {
      let res = http.get(`${BASE_URL}/api/v1/categories`, { tags: { name: 'Categories' } });
      check(res, { 'status is 200': (r) => r.status === 200 });
    } else {
      let providerId = randomIntBetween(1, 10000);
      let res = http.get(`${BASE_URL}/api/v1/providers/${providerId}`, { tags: { name: 'Profile' } });
      check(res, { 'status is 200 or 404': (r) => r.status === 200 || r.status === 404 });
    }
  } 
  // %20 Search
  else if (rand < 0.90) {
    let terms = ["elektrik", "boya", "temizlik", "klima", "tesisat"];
    let q = terms[randomIntBetween(0, terms.length - 1)];
    let res = http.get(`${BASE_URL}/api/v1/search/providers?q=${q}`, { tags: { name: 'Search' } });
    check(res, { 'status is 200': (r) => r.status === 200 });
  }
  // %10 Write (Sadece sisteme yuk bindirmek adina public/mock bir endpoint)
  else {
    let res = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
      username: `loadtest_0_${randomIntBetween(1, 5000)}@test.com`,
      password: "fakehash"
    }), { 
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'Login' } 
    });
    check(res, { 'status is 200 or 401': (r) => r.status === 200 || r.status === 401 });
  }

  // Gercek kullanici bekleyisi (Think time)
  sleep(randomIntBetween(1, 5));
}

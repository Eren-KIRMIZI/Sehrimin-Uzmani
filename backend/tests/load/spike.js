import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
  scenarios: {
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 100,
      stages: [
        { duration: '1m', target: 3000 },
        { duration: '1m', target: 5000 },
        { duration: '1m', target: 10000 },
        { duration: '1m', target: 15000 }, // Kırılma noktası (Break-point)
        { duration: '2m', target: 15000 },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    // Spike testinde genellikle thresholds testin abort olmamasi icin hafifletilir
    // Cunku amac "sistem nerede ve nasil cokuyor/yavasliyor" onu gormek
    'http_req_failed': ['rate<0.10'], // %10 hata oranına kadar spike'a devam et
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function () {
  let rand = Math.random();

  if (rand < 0.60) {
    let res = http.get(`${BASE_URL}/api/v1/categories`);
    check(res, { 'status is 200': (r) => r.status === 200 });
  } else if (rand < 0.90) {
    let res = http.get(`${BASE_URL}/api/v1/search/providers?q=elektrik`);
    check(res, { 'status is 200': (r) => r.status === 200 });
  } else {
    let res = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
      username: `loadtest_0_${randomIntBetween(1, 5000)}@test.com`,
      password: "fakehash"
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Spike'da kullanici cok hizli istek atar
  sleep(randomIntBetween(1, 2)); 
}

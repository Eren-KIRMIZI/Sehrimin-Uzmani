import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
  scenarios: {
    http_traffic: {
      executor: 'ramping-vus',
      exec: 'http_test',
      startVUs: 100,
      stages: [
        { duration: '3m', target: 5000 },
        { duration: '5m', target: 8000 },
        { duration: '10m', target: 8000 },
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
    websocket_traffic: {
      executor: 'ramping-vus',
      exec: 'ws_test',
      startVUs: 50,
      stages: [
        { duration: '3m', target: 1000 },
        { duration: '5m', target: 2000 }, // Toplam 8k HTTP + 2k WS = 10k Mix
        { duration: '10m', target: 2000 },
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
    }
  },
  thresholds: {
    'http_req_duration': ['p(95)<300', 'p(99)<1000'], 
    'http_req_failed': ['rate<0.01']
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
const WS_URL = __ENV.WS_URL || 'ws://localhost:8000';

export function http_test() {
  let rand = Math.random();

  // %40 Normal API
  if (rand < 0.40) {
    let res = http.get(`${BASE_URL}/api/v1/categories`);
    check(res, { 'status is 200': (r) => r.status === 200 });
  } 
  // %25 Search
  else if (rand < 0.65) {
    let terms = ["elektrik", "boya", "temizlik"];
    let q = terms[randomIntBetween(0, terms.length - 1)];
    let res = http.get(`${BASE_URL}/api/v1/search/providers?q=${q}`);
    check(res, { 'status is 200': (r) => r.status === 200 });
  }
  // %15 Profil Detay
  else if (rand < 0.80) {
    let providerId = randomIntBetween(1, 10000);
    let res = http.get(`${BASE_URL}/api/v1/providers/${providerId}`);
    check(res, { 'status is 200 or 404': (r) => r.status === 200 || r.status === 404 });
  }
  // %20 Write & Auth
  else {
    let res = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
      username: `loadtest_${randomIntBetween(0, 100)}_${randomIntBetween(1, 4000)}@test.com`,
      password: "fakehash"
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  sleep(randomIntBetween(1, 4));
}

export function ws_test() {
  const url = `${WS_URL}/ws/test_mixed_${__VU}`;
  
  ws.connect(url, {}, function (socket) {
    socket.on('open', () => {
      let isIdle = Math.random() < 0.90;
      socket.setInterval(function timeout() {
        if (isIdle) {
          socket.send(JSON.stringify({ action: 'ping' }));
        } else {
          socket.send(JSON.stringify({ action: 'send_message', conversation_id: 1, content: 'Mixed test' }));
        }
      }, randomIntBetween(5000, 15000));
    });
    
    socket.setTimeout(function () {
      socket.close();
    }, 600000);
  });
}

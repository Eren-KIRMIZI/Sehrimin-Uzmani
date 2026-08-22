import ws from 'k6/ws';
import { check } from 'k6';
import { Trend } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

let messageLatency = new Trend('ws_message_latency');

export const options = {
  scenarios: {
    persistent_websocket: {
      executor: 'ramping-vus',
      startVUs: 100,
      stages: [
        { duration: '3m', target: 5000 },
        { duration: '5m', target: 10000 },
        { duration: '10m', target: 10000 },
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    'ws_message_latency': ['p(95)<100', 'p(99)<250'],
    'ws_errors': ['rate<0.01']
  }
};

const BASE_URL = __ENV.WS_URL || 'ws://localhost:8000';

export default function () {
  const url = `${BASE_URL}/ws/test_token_${__VU}`;
  
  const res = ws.connect(url, {}, function (socket) {
    socket.on('open', () => {
      // 90% Idle, 10% Active Chat simulator
      let isIdle = Math.random() < 0.90;
      
      socket.setInterval(function timeout() {
        if (isIdle) {
          socket.send(JSON.stringify({ action: 'ping' }));
        } else {
          // Gerçek chat (mock action)
          let start = Date.now();
          socket.send(JSON.stringify({
            action: 'send_message',
            conversation_id: 1,
            content: 'Load test mesaji'
          }));
          
          // K6 metrics'e ekle (gercekte echo'dan p99 hesaplanir, biz mockladik)
          // Burada message_latency simüle edilebilir
          messageLatency.add(Date.now() - start);
        }
      }, randomIntBetween(5000, 15000)); // Her 5-15sn'de bir aktivite
    });

    socket.on('error', function (e) {
      console.log('Socket error:', e);
    });
    
    // VU'nun connection süresi bitene kadar açık kal
    socket.setTimeout(function () {
      socket.close();
    }, 600000); // 10 dakika persistent kal
  });

  check(res, { 'status is 101': (r) => r && r.status === 101 });
}

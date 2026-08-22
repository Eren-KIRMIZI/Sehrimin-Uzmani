import { useEffect, useRef, useCallback, useState } from 'react';
import type { Message } from '../types';

interface WebSocketMessage {
  type: 'message' | 'mark_read' | 'typing' | 'error';
  conversation_id?: number;
  data?: Message;
  error?: string;
}

interface UseWebSocketOptions {
  onMessage?: (msg: Message) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    // Mock oturumda gerçek WS yok — bağlanmayı deneme
    if (token.startsWith('mock.')) return;

    try {
      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const host = import.meta.env.VITE_WS_URL
        ? String(import.meta.env.VITE_WS_URL).replace(/\/$/, '')
        : import.meta.env.DEV
          ? `${proto}://${window.location.hostname}:8000`
          : `${proto}://${window.location.host}`;
      const ws = new WebSocket(`${host}/ws/${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        retryCountRef.current = 0;
        options.onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          // Backend sends {"action": "new_message", "message": {...}} or {"action": "new_notification", "notification": {...}}
          if (payload.action === 'new_message' && payload.message) {
            options.onMessage?.(payload.message);
          } else if (payload.type === 'message' && payload.data) { // Fallback for any older format
            options.onMessage?.(payload.data);
          }
          
          if (payload.action === 'new_notification' && payload.notification) {
            // Dispatch a custom event so other components (like NotificationCenter) can listen
            const event = new CustomEvent('new_ws_notification', { detail: payload.notification });
            window.dispatchEvent(event);
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        options.onDisconnect?.();

        // Exponential backoff, max 30s
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
        retryCountRef.current++;
        retryTimerRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      // ignore
    }
  }, [options]);

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const sendMessage = useCallback((conversation_id: number, content: string, type = 'TEXT') => {
    send({ type: 'message', conversation_id, content, message_type: type });
  }, [send]);

  const markRead = useCallback((conversation_id: number) => {
    send({ type: 'mark_read', conversation_id });
  }, [send]);

  const disconnect = useCallback(() => {
    clearTimeout(retryTimerRef.current);
    wsRef.current?.close();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(retryTimerRef.current);
      wsRef.current?.close();
    };
  }, []);

  return { isConnected, sendMessage, markRead, disconnect };
}

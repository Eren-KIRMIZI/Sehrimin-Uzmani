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

    try {
      const ws = new WebSocket(`ws://${window.location.hostname}:8000/ws/${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        retryCountRef.current = 0;
        options.onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const payload: WebSocketMessage = JSON.parse(event.data);
          if (payload.type === 'message' && payload.data) {
            options.onMessage?.(payload.data);
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

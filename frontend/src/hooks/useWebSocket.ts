import { useState, useEffect, useRef, useCallback } from 'react';

interface UseWebSocketOptions {
  url: string;
  onMessage?: (data: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  reconnect?: boolean;
  maxRetries?: number;
}

export function useWebSocket({
  url,
  onMessage,
  onOpen,
  onClose,
  reconnect = true,
  maxRetries = 5,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const socket = new WebSocket(url);

      socket.onopen = () => {
        setIsConnected(true);
        retryCountRef.current = 0;
        onOpen?.();
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch {
          console.error('WebSocket mesaj parse hatasi');
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        onClose?.();

        if (reconnect && retryCountRef.current < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
          retryCountRef.current += 1;
          timeoutRef.current = setTimeout(connect, delay);
        }
      };

      socket.onerror = () => {
        socket.close();
      };

      wsRef.current = socket;
    } catch (err) {
      console.error('WebSocket baglanti hatasi:', err);
    }
  }, [url, onMessage, onOpen, onClose, reconnect, maxRetries]);

  const disconnect = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    retryCountRef.current = maxRetries;
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, [maxRetries]);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { isConnected, connect, disconnect, send };
}

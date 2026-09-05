'use client';

import { useEffect, useRef } from 'react';

type MessageHandler<T = unknown> = (data: T) => void;

/**
 * Subscribes to a WebSocket server and invokes `handler` whenever a message
 * with the given `event` name arrives.
 *
 * By default it connects to `ws://<current-host>/ws`. Override with the
 * optional third argument or the `NEXT_PUBLIC_WS_URL` env variable.
 */
export function useWebSocket<T = unknown>(
  event: string,
  handler: MessageHandler<T>,
  url?: string
) {
  const handlerRef = useRef<MessageHandler<T>>(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const wsUrl =
      url ??
      process.env.NEXT_PUBLIC_WS_URL ??
      `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;

    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const connect = () => {
      socket = new WebSocket(wsUrl);

      socket.addEventListener('open', () => {
        // Connection is ready – nothing extra to do on open.
      });

      socket.addEventListener('message', (messageEvent: MessageEvent) => {
        try {
          const payload = JSON.parse(messageEvent.data);
          if (payload && payload.event === event) {
            handlerRef.current(payload.data as T);
          }
        } catch {
          // Non-JSON payloads are ignored – handler only fires for matching events.
        }
      });

      socket.addEventListener('close', () => {
        if (cancelled) return;
        reconnectTimer = setTimeout(connect, 3000);
      });

      socket.addEventListener('error', () => {
        socket?.close();
      });
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [event, url]);
}

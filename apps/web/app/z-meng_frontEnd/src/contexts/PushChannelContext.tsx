import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { connectPushChannel, type PushChannelEvent } from '../services/push/push';

type PushConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface PushChannelContextValue {
  status: PushConnectionStatus;
  events: PushChannelEvent[];
  lastEvent: PushChannelEvent | null;
}

interface PushChannelProviderProps {
  enabled: boolean;
  children: ReactNode;
}

const PushChannelContext = createContext<PushChannelContextValue>({
  status: 'idle',
  events: [],
  lastEvent: null
});

// Maintains one authenticated SSE connection after login and stores a rolling in-memory event buffer for the UI.
export function PushChannelProvider({ enabled, children }: PushChannelProviderProps) {
  const [status, setStatus] = useState<PushConnectionStatus>('idle');
  const [events, setEvents] = useState<PushChannelEvent[]>([]);

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      setEvents([]);
      return;
    }

    setStatus('connecting');

    const eventSource = connectPushChannel({
      onConnected: () => setStatus('connected'),
      onDisconnected: () => setStatus((current) => (current === 'error' ? current : 'connecting')),
      onError: () => setStatus('error'),
      onEvent: (event) => {
        setStatus('connected');
        setEvents((current) => [...current.slice(-99), event]);
      }
    });

    return () => {
      eventSource.close();
      setStatus('idle');
    };
  }, [enabled]);

  const value = useMemo<PushChannelContextValue>(
    () => ({
      status,
      events,
      lastEvent: events[events.length - 1] ?? null
    }),
    [events, status]
  );

  return (
    <PushChannelContext.Provider value={value}>
      {children}
    </PushChannelContext.Provider>
  );
}

// Exposes the shared push channel state so feature modules can react to backend events without reopening the stream.
export function usePushChannel(): PushChannelContextValue {
  return useContext(PushChannelContext);
}

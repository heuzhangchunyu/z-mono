export interface PushChannelEvent<TMessage = Record<string, unknown>> {
  eventType: string;
  message: TMessage;
}

interface ConnectPushChannelInput {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onEvent: (event: PushChannelEvent) => void;
  onError?: () => void;
}

// Opens the authenticated SSE channel so the frontend can receive backend push events with cookies attached.
export function connectPushChannel(input: ConnectPushChannelInput): EventSource {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:4101';
  const eventSource = new EventSource(`${baseUrl}/push/stream`, {
    withCredentials: true
  });

  eventSource.onopen = () => {
    input.onConnected?.();
  };

  eventSource.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data) as PushChannelEvent;
      input.onEvent(parsed);
    } catch (error) {
      console.error('Failed to parse push channel event.', error);
    }
  };

  eventSource.onerror = () => {
    input.onError?.();
    input.onDisconnected?.();
  };

  return eventSource;
}

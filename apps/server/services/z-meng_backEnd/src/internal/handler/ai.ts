import type Koa from 'koa';

import { readJsonBody } from '../http/body.js';
import { closeEventStream, openEventStream, writeServerSentEvent } from '../http/sse.js';
import { readAuthenticatedUserId } from '../http/session.js';
import type { GenerateChatPayload } from '../model/ai.js';
import { AIChatService } from '../service/aiChatService.js';
import { AuthService } from '../service/authService.js';

export function createGenerateChatHandler(authService: AuthService, aiChatService: AIChatService): Koa.Middleware {
  return async (ctx) => {
    const payload = await readJsonBody<GenerateChatPayload>(ctx);
    const user = await authService.requireActiveUser(readAuthenticatedUserId(ctx));

    if (payload.stream) {
      const abortController = new AbortController();
      const handleClientClose = () => abortController.abort();
      ctx.req.on('close', handleClientClose);

      const response = openEventStream(ctx);

      try {
        for await (const event of aiChatService.streamChat(user.id, payload, abortController.signal)) {
          if (event.type === 'delta') {
            writeServerSentEvent(response, {
              event: 'delta',
              data: {
                text: event.text,
                model: event.model
              }
            });
            continue;
          }

          writeServerSentEvent(response, {
            event: 'completed',
            data: event.data
          });
        }

        writeServerSentEvent(response, {
          event: 'done',
          data: {
            ok: true
          }
        });
      } catch (error) {
        writeServerSentEvent(response, {
          event: 'error',
          data: {
            message: error instanceof Error ? error.message : 'AI stream failed.'
          }
        });
      } finally {
        ctx.req.off('close', handleClientClose);
        closeEventStream(response);
      }

      return;
    }

    const result = await aiChatService.generateChat(user.id, payload);

    ctx.status = 200;
    ctx.body = {
      message: 'AI completion generated successfully.',
      data: result
    };
  };
}

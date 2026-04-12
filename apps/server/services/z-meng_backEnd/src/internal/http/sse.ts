import type Koa from 'koa';
import type { ServerResponse } from 'node:http';

export interface ServerSentEvent {
  event: string;
  data: unknown;
}

export function openEventStream(ctx: Koa.Context): ServerResponse {
  ctx.respond = false;
  ctx.res.statusCode = 200;
  ctx.res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  ctx.res.setHeader('Cache-Control', 'no-cache, no-transform');
  ctx.res.setHeader('Connection', 'keep-alive');
  ctx.res.setHeader('X-Accel-Buffering', 'no');
  ctx.res.flushHeaders?.();

  return ctx.res;
}

export function writeServerSentEvent(response: ServerResponse, event: ServerSentEvent): void {
  response.write(`event: ${event.event}\n`);
  response.write(`data: ${JSON.stringify(event.data)}\n\n`);
}

export function closeEventStream(response: ServerResponse): void {
  response.end();
}

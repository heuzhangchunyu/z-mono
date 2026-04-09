import type Koa from 'koa';

export async function readJsonBody<T>(ctx: Koa.Context): Promise<T> {
  const chunks: Buffer[] = [];

  await new Promise<void>((resolve, reject) => {
    ctx.req.on('data', (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    ctx.req.on('end', resolve);
    ctx.req.on('error', reject);
  });

  if (chunks.length === 0) {
    throw createBadRequestError('Request body is required.');
  }

  const bodyText = Buffer.concat(chunks).toString('utf8').trim();
  if (!bodyText) {
    throw createBadRequestError('Request body is required.');
  }

  try {
    return JSON.parse(bodyText) as T;
  } catch {
    throw createBadRequestError('Request body must be valid JSON.');
  }
}

export function createHttpError(status: number, message: string): Error & { status: number } {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
}

export function createBadRequestError(message: string): Error & { status: number } {
  return createHttpError(400, message);
}

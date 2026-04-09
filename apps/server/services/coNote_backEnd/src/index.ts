import Koa, { type Context } from 'koa';
import cors from '@koa/cors';

const app = new Koa();
const port = Number(process.env.PORT ?? 4100);

app.use(cors());
app.use(async (ctx: Context) => {
  ctx.body = {
    service: 'coNote_backEnd',
    message: 'coNote backend service is running.',
    timestamp: new Date().toISOString()
  };
});

app.listen(port, () => {
  console.log(`coNote_backEnd listening on http://localhost:${port}`);
});

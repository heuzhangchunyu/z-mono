import Koa from 'koa';
import cors from '@koa/cors';

const app = new Koa();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(async (ctx) => {
  ctx.body = {
    message: 'Koa server is running.',
    timestamp: new Date().toISOString()
  };
});

app.listen(port, () => {
  console.log(`server listening on http://localhost:${port}`);
});

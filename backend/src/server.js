import 'dotenv/config';
import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

app.listen(env.port, () => {
  console.log(`Resolve LK backend listening on port ${env.port}`);
  console.log(`Swagger UI: http://localhost:${env.port}/api-docs`);
});

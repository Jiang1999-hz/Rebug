import 'dotenv/config';

import { handle } from '@hono/node-server/vercel';
import { createApp } from '../apps/api/dist/src/app.js';

const app = createApp();

export default handle(app);

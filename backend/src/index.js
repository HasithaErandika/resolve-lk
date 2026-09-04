import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { issuesRouter } from './routes/issues.js';
import { myReportsRouter } from './routes/myReports.js';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/issues', issuesRouter);
app.use('/api/my-reports', myReportsRouter);

// Multer/general error handler — keeps error responses in the same friendly JSON shape.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Unexpected server error.' });
});

const port = process.env.PORT || 8787;
app.listen(port, () => console.log(`Resolve LK backend listening on port ${port}`));

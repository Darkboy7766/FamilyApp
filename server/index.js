import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../.env') });

const TOKEN = process.env.BASEROW_TOKEN;
const TABLE_IDS = {
  people:   process.env.BASEROW_TABLE_PEOPLE,
  events:   process.env.BASEROW_TABLE_EVENTS,
  routines: process.env.BASEROW_TABLE_ROUTINES,
  tasks:    process.env.BASEROW_TABLE_TASKS,
  expenses: process.env.BASEROW_TABLE_EXPENSES,
};

if (!TOKEN || Object.values(TABLE_IDS).some(v => !v)) {
  console.error('Грешка: Липсват BASEROW_TOKEN или BASEROW_TABLE_* в .env файла.');
  process.exit(1);
}

const BASEROW = 'https://api.baserow.io';
const authHeader = () => ({ 'Authorization': `Token ${TOKEN}`, 'Content-Type': 'application/json' });

const app = express();
app.use(express.json());

// Photo upload → Baserow user files (recordId param is ignored at upload time)
app.post('/api/upload-photo/:recordId', express.raw({ type: 'multipart/*', limit: '10mb' }), async (req, res) => {
  try {
    const response = await fetch(`${BASEROW}/api/user-files/upload-file/`, {
      method: 'POST',
      headers: { 'Authorization': `Token ${TOKEN}`, 'Content-Type': req.headers['content-type'] },
      body: req.body,
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Upload proxy грешка:', err);
    res.status(500).json({ error: 'Upload proxy error' });
  }
});

// Single row: GET / PATCH / DELETE /api/baserow/:table/:id
app.all('/api/baserow/:table/:id', async (req, res) => {
  const tableId = TABLE_IDS[req.params.table];
  if (!tableId) return res.status(404).json({ error: 'Unknown table' });

  const url = `${BASEROW}/api/database/rows/table/${tableId}/${req.params.id}/?user_field_names=true`;
  try {
    const body = ['POST', 'PATCH', 'PUT'].includes(req.method) ? JSON.stringify(req.body) : undefined;
    const response = await fetch(url, { method: req.method, headers: authHeader(), body });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Proxy грешка:', err);
    res.status(500).json({ error: 'Proxy error' });
  }
});

// Row list + create: GET / POST /api/baserow/:table
app.all('/api/baserow/:table', async (req, res) => {
  const tableId = TABLE_IDS[req.params.table];
  if (!tableId) return res.status(404).json({ error: 'Unknown table' });

  const qs = new URLSearchParams(req.query).toString();
  const url = `${BASEROW}/api/database/rows/table/${tableId}/?user_field_names=true${qs ? `&${qs}` : ''}`;
  try {
    const body = ['POST', 'PATCH', 'PUT'].includes(req.method) ? JSON.stringify(req.body) : undefined;
    const response = await fetch(url, { method: req.method, headers: authHeader(), body });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Proxy грешка:', err);
    res.status(500).json({ error: 'Proxy error' });
  }
});

if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API прокси работи на http://localhost:${PORT}`);
});

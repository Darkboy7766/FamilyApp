import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../.env') });

const PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!PAT || !BASE_ID) {
  console.error('Грешка: Липсва AIRTABLE_PAT или AIRTABLE_BASE_ID в .env файла.');
  process.exit(1);
}

const app = express();
app.use(express.json());

// Direct file upload → Airtable Content API (must be before express.json routes)
app.post('/api/upload-photo/:recordId', express.raw({ type: 'multipart/*', limit: '10mb' }), async (req, res) => {
  const { recordId } = req.params;
  const contentType = req.headers['content-type'];
  const url = `https://content.airtable.com/v0/${BASE_ID}/${recordId}/${encodeURIComponent('Снимка')}/uploadAttachment`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': contentType },
      body: req.body,
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Upload proxy грешка:', err);
    res.status(500).json({ error: 'Upload proxy error' });
  }
});

app.all('/api/airtable/:table/:id', async (req, res) => {
  const table = decodeURIComponent(req.params.table);
  const id = req.params.id;
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}/${id}`;

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Proxy грешка:', err);
    res.status(500).json({ error: 'Proxy error' });
  }
});

app.all('/api/airtable/:table', async (req, res) => {
  const table = decodeURIComponent(req.params.table);
  const qs = new URLSearchParams(req.query).toString();
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}${qs ? `?${qs}` : ''}`;

  try {
    const body = ['POST', 'PATCH', 'PUT'].includes(req.method)
      ? JSON.stringify(req.body)
      : undefined;

    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${PAT}`,
        'Content-Type': 'application/json',
      },
      body,
    });

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

export default async function handler(req, res) {
  const { table, id } = req.query;
  const PAT = process.env.AIRTABLE_PAT;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!PAT || !BASE_ID) {
    return res.status(500).json({ error: 'Missing Airtable credentials' });
  }

  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}/${id}`;

  try {
    const body = ['POST', 'PATCH', 'PUT'].includes(req.method)
      ? JSON.stringify(req.body)
      : undefined;

    const response = await fetch(url, {
      method: req.method,
      headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
      body,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Proxy грешка:', err);
    res.status(500).json({ error: 'Proxy error' });
  }
}

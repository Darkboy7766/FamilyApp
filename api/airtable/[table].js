export default async function handler(req, res) {
  const { table, ...query } = req.query;
  const PAT = process.env.AIRTABLE_PAT;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!PAT || !BASE_ID) {
    return res.status(500).json({ error: 'Missing Airtable credentials' });
  }

  const qs = new URLSearchParams(query).toString();
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}${qs ? `?${qs}` : ''}`;

  try {
    const body = ['POST', 'PATCH', 'PUT'].includes(req.method)
      ? JSON.stringify(req.body)
      : undefined;

    const response = await fetch(url, {
      method: req.method,
      headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
      body,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Proxy грешка:', err);
    res.status(500).json({ error: 'Proxy error' });
  }
}

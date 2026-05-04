export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  const { recordId } = req.query;
  const PAT = process.env.AIRTABLE_PAT;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!PAT || !BASE_ID) {
    return res.status(500).json({ error: 'Missing Airtable credentials' });
  }

  const contentType = req.headers['content-type'];
  const url = `https://content.airtable.com/v0/${BASE_ID}/${recordId}/${encodeURIComponent('Снимка')}/uploadAttachment`;

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': contentType },
      body,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Upload proxy грешка:', err);
    res.status(500).json({ error: 'Upload proxy error' });
  }
}

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  const TOKEN = process.env.BASEROW_TOKEN;

  if (!TOKEN) {
    return res.status(500).json({ error: 'Missing BASEROW_TOKEN' });
  }

  const contentType = req.headers['content-type'];

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);

    const response = await fetch('https://api.baserow.io/api/user-files/upload-file/', {
      method: 'POST',
      headers: { 'Authorization': `Token ${TOKEN}`, 'Content-Type': contentType },
      body,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Upload proxy грешка:', err);
    res.status(500).json({ error: 'Upload proxy error' });
  }
}

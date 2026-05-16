const TABLE_IDS = {
  people:   process.env.BASEROW_TABLE_PEOPLE,
  events:   process.env.BASEROW_TABLE_EVENTS,
  routines: process.env.BASEROW_TABLE_ROUTINES,
  tasks:    process.env.BASEROW_TABLE_TASKS,
  expenses: process.env.BASEROW_TABLE_EXPENSES,
};

export default async function handler(req, res) {
  const { table, ...query } = req.query;
  const TOKEN = process.env.BASEROW_TOKEN;
  const tableId = TABLE_IDS[table];

  if (!TOKEN || !tableId) {
    return res.status(500).json({ error: 'Missing Baserow credentials or unknown table' });
  }

  const qs = new URLSearchParams(query).toString();
  const url = `https://api.baserow.io/api/database/rows/table/${tableId}/?user_field_names=true${qs ? `&${qs}` : ''}`;

  try {
    const body = ['POST', 'PATCH', 'PUT'].includes(req.method) ? JSON.stringify(req.body) : undefined;
    const response = await fetch(url, {
      method: req.method,
      headers: { 'Authorization': `Token ${TOKEN}`, 'Content-Type': 'application/json' },
      body,
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Baserow proxy грешка:', err);
    res.status(500).json({ error: 'Proxy error' });
  }
}

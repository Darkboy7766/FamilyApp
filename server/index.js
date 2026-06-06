import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';
import { Resend } from 'resend';
import cron from 'node-cron';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../.env') });

const clean = (v) => v?.trim().replace(/^["'`]+|["'`]+$/g, '');
const TOKEN = clean(process.env.BASEROW_TOKEN);
const TABLE_IDS = {
  families: clean(process.env.BASEROW_TABLE_FAMILIES),
  people:   clean(process.env.BASEROW_TABLE_PEOPLE),
  events:   clean(process.env.BASEROW_TABLE_EVENTS),
  routines: clean(process.env.BASEROW_TABLE_ROUTINES),
  tasks:    clean(process.env.BASEROW_TABLE_TASKS),
  expenses: clean(process.env.BASEROW_TABLE_EXPENSES),
};
const requiredTables = ['people', 'events', 'routines', 'tasks', 'expenses'];
if (!TOKEN || requiredTables.some(t => !TABLE_IDS[t])) {
  console.error('Грешка: Липсват BASEROW_TOKEN или BASEROW_TABLE_* в .env файла.');
  process.exit(1);
}

const BASEROW = 'https://api.baserow.io';
const authHeader = () => ({ 'Authorization': `Token ${TOKEN}`, 'Content-Type': 'application/json' });

// ── Resend ──
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Family CRM <onboarding@resend.dev>';

// ── Baserow helpers (server-side, direct fetch) ──
async function baserowFetchAll(tableId) {
  const rows = [];
  let page = 1;
  while (true) {
    const res = await fetch(
      `${BASEROW}/api/database/rows/table/${tableId}/?user_field_names=true&page=${page}&size=200`,
      { headers: authHeader() }
    );
    if (!res.ok) break;
    const data = await res.json();
    rows.push(...data.results);
    if (!data.next) break;
    page++;
  }
  return rows;
}

function mmdd(dateStr) {
  try {
    const d = new Date(dateStr);
    return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch { return ''; }
}

function yyyymmdd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('bg-BG', { day: 'numeric', month: 'long' });
  } catch { return dateStr; }
}

// ── Email HTML builder ──
function buildEmailHTML({ name, birthdayRows = [], eventRows, taskRows, routineRows }) {
  const section = (title, icon, items) => items.length === 0 ? '' : `
    <h3 style="margin:24px 0 8px;color:#0f172a;font-size:1rem;">${icon} ${title}</h3>
    <ul style="margin:0;padding-left:20px;color:#334155;line-height:1.8;">
      ${items.map(i => `<li>${i}</li>`).join('')}
    </ul>`;

  const birthdaysHtml = section('Рождени дни', '🎂', birthdayRows);
  const eventsHtml    = section('Предстоящи събития', '📅', eventRows);
  const tasksHtml     = section('Задачи за днес', '✅', taskRows);
  const routinesHtml  = section('Рутини за днес', '🔔', routineRows);

  if (!birthdaysHtml && !eventsHtml && !tasksHtml && !routinesHtml) return null;

  return `<!DOCTYPE html>
<html lang="bg">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f1f5f9;font-family:system-ui,sans-serif;">
  <div style="max-width:480px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
    <div style="background:#0ea5e9;padding:24px 28px;">
      <p style="margin:0;color:#e0f2fe;font-size:.8rem;font-weight:600;letter-spacing:.05em;text-transform:uppercase;">Family CRM</p>
      <h1 style="margin:4px 0 0;color:#fff;font-size:1.4rem;">Здравей, ${name}!</h1>
    </div>
    <div style="padding:24px 28px;">
      <p style="margin:0 0 8px;color:#64748b;font-size:.9rem;">Ето напомнянията ти за днес, <strong>${new Date().toLocaleDateString('bg-BG', { weekday:'long', day:'numeric', month:'long' })}</strong>:</p>
      ${birthdaysHtml}${eventsHtml}${tasksHtml}${routinesHtml}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 16px;">
      <p style="margin:0;color:#94a3b8;font-size:.78rem;">Това е автоматично съобщение от Family CRM.</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Core reminder logic ──
async function sendDailyReminders() {
  if (!resend) {
    console.log('[Resend] Пропуснато — няма RESEND_API_KEY.');
    return { skipped: 'no_api_key' };
  }

  const [peopleRows, eventRows, taskRows, routineRows] = await Promise.all([
    baserowFetchAll(TABLE_IDS.people),
    baserowFetchAll(TABLE_IDS.events),
    baserowFetchAll(TABLE_IDS.tasks),
    baserowFetchAll(TABLE_IDS.routines),
  ]);

  const people = peopleRows
    .filter(r => r.Email)
    .map(r => ({ id: String(r.id), name: r.Name || '', email: r.Email }));

  console.log(`[Resend] Хора общо: ${peopleRows.length}, с имейл: ${people.length}`);
  if (people.length === 0) {
    return { peopleTotal: peopleRows.length, peopleWithEmail: 0, sent: 0, skipped: 'no_emails_in_db' };
  }

  const today    = new Date();
  const todayStr = yyyymmdd(today);

  const upcomingEvents = eventRows.filter(e => {
    if (!e.Date) return false;
    const evMMdd = mmdd(e.Date);
    for (let i = 0; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      if (mmdd(yyyymmdd(d)) === evMMdd) return true;
    }
    return false;
  });

  // Рождени дни от BirthDate полето в People — показват се на ВСИЧКИ
  const upcomingBirthdays = [];
  for (const r of peopleRows) {
    if (!r.BirthDate) continue;
    const bMMdd = mmdd(r.BirthDate);
    for (let i = 0; i <= 2; i++) {          // днес (0) + следващите 2 дни
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      if (mmdd(yyyymmdd(d)) === bMMdd) {
        upcomingBirthdays.push({ name: r.Name || 'Непознат', daysUntil: i });
        break;
      }
    }
  }
  console.log(`[Reminders] Предстоящи рождени дни: ${upcomingBirthdays.length}`);

  const dueTasks = taskRows.filter(t => !t.Done && t.DueDate === todayStr);

  let sent = 0;
  let noContent = 0;

  for (const person of people) {
    // Рождени дни — еднакви за всички получатели
    const birthdayRows = upcomingBirthdays.map(b => {
      const when = b.daysUntil === 0 ? 'днес' : b.daysUntil === 1 ? 'утре' : `след ${b.daysUntil} дни`;
      return `🎂 <strong>${b.name}</strong> има рожден ден <strong>${when}</strong>!`;
    });

    const myEvents = upcomingEvents.filter(e => {
      const ids = (e.People || []).map(p => String(p.id));
      return ids.length === 0 || ids.includes(person.id);
    });
    const myTasks = dueTasks.filter(t => {
      const ids = (t.People || []).map(p => String(p.id));
      return ids.length === 0 || ids.includes(person.id);
    });
    const myRoutines = routineRows.filter(r => {
      const ids = (r.People || []).map(p => String(p.id));
      return ids.includes(person.id);
    });

    console.log(`[Resend] ${person.name}: ${birthdayRows.length} рожден(и) ден(я), ${myEvents.length} събитие(я), ${myTasks.length} задача(и), ${myRoutines.length} рутина(и)`);

    const html = buildEmailHTML({
      name: person.name,
      birthdayRows,
      eventRows:   myEvents.map(e => `<strong>${e.Name}</strong> — ${formatDate(e.Date)}`),
      taskRows:    myTasks.map(t => t.Title || ''),
      routineRows: myRoutines.map(r => `${r.Medication || ''} в ${r.Time || ''}`),
    });

    if (!html) { noContent++; continue; }

    try {
      const { error } = await resend.emails.send({
        from:    EMAIL_FROM,
        to:      person.email,
        subject: `Family CRM — Напомняния за ${today.toLocaleDateString('bg-BG', { day: 'numeric', month: 'long' })}`,
        html,
      });
      if (error) { console.error(`[Resend] Грешка за ${person.email}:`, error); }
      else        { console.log(`[Resend] Изпратено до ${person.email}`); sent++; }
    } catch (err) {
      console.error(`[Resend] Изключение за ${person.email}:`, err);
    }
  }

  return { peopleTotal: peopleRows.length, peopleWithEmail: people.length, sent, skippedNoContent: noContent };
}

// ── Daily cron — всеки ден в 08:00 ──
cron.schedule('0 8 * * *', () => {
  console.log('[Cron] Изпращане на дневни напомняния...');
  sendDailyReminders().catch(console.error);
}, { timezone: 'Europe/Sofia' });

// ── Express ──
const app = express();
app.use(express.json());

// Vercel Cron Job — извиква се автоматично всеки ден в 08:00 Sofia (05:00 UTC)
app.get('/api/cron/daily-reminders', async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const result = await sendDailyReminders();
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// Manual trigger with diagnostics
app.post('/api/send-reminders', async (_req, res) => {
  if (!resend) return res.status(503).json({ error: 'RESEND_API_KEY не е конфигуриран.' });
  try {
    const result = await sendDailyReminders();
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// Simple test — sends one email directly to given address
app.post('/api/test-email', async (req, res) => {
  if (!resend) return res.status(503).json({ error: 'RESEND_API_KEY не е конфигуриран.' });
  const to = req.body?.to;
  if (!to) return res.status(400).json({ error: 'Подай { "to": "email@example.com" } в тялото.' });
  try {
    const { data, error } = await resend.emails.send({
      from:    EMAIL_FROM,
      to,
      subject: 'Family CRM — тестов имейл',
      html:    '<h2 style="font-family:sans-serif;color:#0ea5e9;">👥 Family CRM</h2><p>Тестовият имейл работи!</p>',
    });
    if (error) return res.status(400).json({ error });
    res.json({ ok: true, id: data?.id });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Photo upload → Baserow user files
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
    console.error('Proxy грешка за', req.params.table, '→ tableId:', TABLE_IDS[req.params.table], '→', err.message);
    res.status(500).json({ error: 'Proxy error', detail: err.message });
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
    const text = await response.text();
    if (!response.ok) {
      console.error(`Baserow ${req.params.table} HTTP ${response.status}:`, text.substring(0, 300));
    }
    const data = text ? JSON.parse(text) : {};
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Proxy грешка за', req.params.table, '→ tableId:', TABLE_IDS[req.params.table], '→', err.message);
    res.status(500).json({ error: 'Proxy error', detail: err.message });
  }
});

const distPath = join(__dirname, '../dist');
app.use(express.static(distPath));
app.use((_req, res, next) => {
  const indexPath = join(distPath, 'index.html');
  res.sendFile(indexPath, err => { if (err) next(); });
});

export default app;

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`API прокси работи на http://localhost:${PORT}`);
    if (resend) {
      console.log(`[Resend] Активен — дневни напомняния в 08:00 (Sofia)`);
    } else {
      console.log(`[Resend] Неактивен — добави RESEND_API_KEY в .env`);
    }
  });
}

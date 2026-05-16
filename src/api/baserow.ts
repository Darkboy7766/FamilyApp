import type { Person, EventRecord, Routine, Task, Expense, FamilyRole } from '../types';

const BASE = '/api/baserow';
const headers = { 'Content-Type': 'application/json' };

async function fetchAllRows(table: string): Promise<any[]> {
  const results: any[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${BASE}/${table}?page=${page}&size=200`, { headers });
    if (!res.ok) throw new Error(`Грешка при извличане на ${table}`);
    const data = await res.json();
    results.push(...data.results);
    if (!data.next) break;
    page++;
  }
  return results;
}

function toIds(row: any, field: string): string[] {
  return (row[field] || []).map((x: any) => String(x.id));
}

function fromIds(ids: string[]): number[] {
  return ids.map(id => Number(id));
}

export const baserowApi = {
  fetchPeople: async (): Promise<Person[]> => {
    try {
      const rows = await fetchAllRows('people');
      return rows.map((r: any) => ({
        id: String(r.id),
        name: r.Name || '',
        phone: r.Phone || '',
        role: (r.Role?.value as FamilyRole) || undefined,
        pin: r.PIN || '',
        photoUrl: Array.isArray(r.Photo) && r.Photo.length > 0 ? r.Photo[0].url : '',
      }));
    } catch (e) { console.error(e); return []; }
  },

  fetchEvents: async (): Promise<EventRecord[]> => {
    try {
      const rows = await fetchAllRows('events');
      return rows.map((r: any) => ({
        id: String(r.id),
        type: r.Name || '',
        date: r.Date || '',
        personIds: toIds(r, 'People'),
      }));
    } catch (e) { console.error(e); return []; }
  },

  fetchRoutines: async (): Promise<Routine[]> => {
    try {
      const rows = await fetchAllRows('routines');
      return rows.map((r: any) => ({
        id: String(r.id),
        medication: r.Medication || '',
        time: r.Time || '',
        personIds: toIds(r, 'People'),
      }));
    } catch (e) { console.error(e); return []; }
  },

  fetchTasks: async (): Promise<Task[]> => {
    try {
      const rows = await fetchAllRows('tasks');
      return rows.map((r: any) => ({
        id: String(r.id),
        title: r.Title || '',
        done: r.Done ?? false,
        dueDate: r.DueDate || undefined,
        personIds: toIds(r, 'People'),
      }));
    } catch (e) { console.error(e); return []; }
  },

  fetchExpenses: async (): Promise<Expense[]> => {
    try {
      const rows = await fetchAllRows('expenses');
      return rows.map((r: any) => ({
        id: String(r.id),
        amount: Number(r.Amount) || 0,
        category: r.Category?.value || 'Друго',
        date: r.Date || '',
        paidById: Array.isArray(r.PaidBy) && r.PaidBy.length > 0 ? String(r.PaidBy[0].id) : undefined,
      }));
    } catch (e) { console.error(e); return []; }
  },

  createPerson: async (data: Partial<Person>): Promise<Person | null> => {
    try {
      const body: any = {};
      if (data.name) body.Name = data.name;
      if (data.phone) body.Phone = data.phone;
      if (data.role) body.Role = data.role;
      if (data.pin) body.PIN = data.pin;
      const res = await fetch(`${BASE}/people`, { method: 'POST', headers, body: JSON.stringify(body) });
      if (!res.ok) { console.error(await res.json()); return null; }
      const r = await res.json();
      return { id: String(r.id), name: r.Name || data.name || '', phone: r.Phone || data.phone || '', photoUrl: '', role: r.Role?.value || data.role };
    } catch (e) { console.error(e); return null; }
  },

  createEvent: async (data: Partial<EventRecord>): Promise<EventRecord | null> => {
    try {
      const body: any = {};
      if (data.type) body.Name = data.type;
      if (data.date) body.Date = data.date;
      if (data.personIds?.length) body.People = fromIds(data.personIds);
      const res = await fetch(`${BASE}/events`, { method: 'POST', headers, body: JSON.stringify(body) });
      if (!res.ok) { console.error(await res.json()); return null; }
      const r = await res.json();
      return { id: String(r.id), type: r.Name || data.type || '', date: r.Date || data.date || '', personIds: toIds(r, 'People') };
    } catch (e) { console.error(e); return null; }
  },

  createRoutine: async (data: Partial<Routine>): Promise<Routine | null> => {
    try {
      const body: any = {};
      if (data.medication) body.Medication = data.medication;
      if (data.time) body.Time = data.time;
      if (data.personIds?.length) body.People = fromIds(data.personIds);
      const res = await fetch(`${BASE}/routines`, { method: 'POST', headers, body: JSON.stringify(body) });
      if (!res.ok) { console.error(await res.json()); return null; }
      const r = await res.json();
      return { id: String(r.id), medication: r.Medication || data.medication || '', time: r.Time || data.time || '', personIds: toIds(r, 'People') };
    } catch (e) { console.error(e); return null; }
  },

  createTask: async (data: Partial<Task>): Promise<Task | null> => {
    try {
      const body: any = {};
      if (data.title) body.Title = data.title;
      if (data.dueDate) body.DueDate = data.dueDate;
      if (data.personIds?.length) body.People = fromIds(data.personIds);
      const res = await fetch(`${BASE}/tasks`, { method: 'POST', headers, body: JSON.stringify(body) });
      if (!res.ok) { console.error(await res.json()); return null; }
      const r = await res.json();
      return { id: String(r.id), title: r.Title || data.title || '', done: false, dueDate: r.DueDate || data.dueDate, personIds: toIds(r, 'People') };
    } catch (e) { console.error(e); return null; }
  },

  createExpense: async (data: Partial<Expense>): Promise<Expense | null> => {
    try {
      const body: any = {};
      // Label is the primary (text) field Baserow requires — we derive it from the data
      body.Label = `${data.date || ''} ${data.category || ''}`.trim();
      if (data.amount !== undefined) body.Amount = data.amount;
      if (data.category) body.Category = data.category;
      if (data.date) body.Date = data.date;
      if (data.paidById) body.PaidBy = [Number(data.paidById)];
      const res = await fetch(`${BASE}/expenses`, { method: 'POST', headers, body: JSON.stringify(body) });
      if (!res.ok) { console.error(await res.json()); return null; }
      const r = await res.json();
      return {
        id: String(r.id),
        amount: Number(r.Amount ?? data.amount) || 0,
        category: r.Category?.value || data.category || 'Друго',
        date: r.Date || data.date || '',
        paidById: Array.isArray(r.PaidBy) && r.PaidBy.length > 0 ? String(r.PaidBy[0].id) : data.paidById,
      };
    } catch (e) { console.error(e); return null; }
  },

  updatePerson: async (id: string, data: Partial<Person>): Promise<boolean> => {
    try {
      const body: any = {};
      if (data.name !== undefined) body.Name = data.name;
      if (data.phone !== undefined) body.Phone = data.phone;
      if (data.role !== undefined) body.Role = data.role;
      if (data.pin !== undefined) body.PIN = data.pin;
      const res = await fetch(`${BASE}/people/${id}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
      if (!res.ok) console.error(await res.json());
      return res.ok;
    } catch (e) { console.error(e); return false; }
  },

  updateEvent: async (id: string, data: Partial<EventRecord>): Promise<boolean> => {
    try {
      const body: any = {};
      if (data.type !== undefined) body.Name = data.type;
      if (data.date !== undefined) body.Date = data.date;
      if (data.personIds !== undefined) body.People = fromIds(data.personIds);
      const res = await fetch(`${BASE}/events/${id}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
      if (!res.ok) console.error(await res.json());
      return res.ok;
    } catch (e) { console.error(e); return false; }
  },

  updateRoutine: async (id: string, data: Partial<Routine>): Promise<boolean> => {
    try {
      const body: any = {};
      if (data.medication !== undefined) body.Medication = data.medication;
      if (data.time !== undefined) body.Time = data.time;
      if (data.personIds !== undefined) body.People = fromIds(data.personIds);
      const res = await fetch(`${BASE}/routines/${id}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
      if (!res.ok) console.error(await res.json());
      return res.ok;
    } catch (e) { console.error(e); return false; }
  },

  updateTask: async (id: string, data: Partial<Task>): Promise<boolean> => {
    try {
      const body: any = {};
      if (data.title !== undefined) body.Title = data.title;
      if (data.done !== undefined) body.Done = data.done;
      if (data.dueDate !== undefined) body.DueDate = data.dueDate;
      if (data.personIds !== undefined) body.People = fromIds(data.personIds);
      const res = await fetch(`${BASE}/tasks/${id}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
      if (!res.ok) console.error(await res.json());
      return res.ok;
    } catch (e) { console.error(e); return false; }
  },

  updateExpense: async (id: string, data: Partial<Expense>): Promise<boolean> => {
    try {
      const body: any = {};
      if (data.amount !== undefined) body.Amount = data.amount;
      if (data.category !== undefined) body.Category = data.category;
      if (data.date !== undefined) body.Date = data.date;
      if (data.paidById !== undefined) body.PaidBy = data.paidById ? [Number(data.paidById)] : [];
      const res = await fetch(`${BASE}/expenses/${id}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
      if (!res.ok) console.error(await res.json());
      return res.ok;
    } catch (e) { console.error(e); return false; }
  },

  deletePerson:  async (id: string) => { try { return (await fetch(`${BASE}/people/${id}`,  { method: 'DELETE', headers })).ok; } catch { return false; } },
  deleteEvent:   async (id: string) => { try { return (await fetch(`${BASE}/events/${id}`,   { method: 'DELETE', headers })).ok; } catch { return false; } },
  deleteRoutine: async (id: string) => { try { return (await fetch(`${BASE}/routines/${id}`, { method: 'DELETE', headers })).ok; } catch { return false; } },
  deleteTask:    async (id: string) => { try { return (await fetch(`${BASE}/tasks/${id}`,    { method: 'DELETE', headers })).ok; } catch { return false; } },
  deleteExpense: async (id: string) => { try { return (await fetch(`${BASE}/expenses/${id}`, { method: 'DELETE', headers })).ok; } catch { return false; } },

  uploadPersonPhoto: async (personId: string, file: File): Promise<string | null> => {
    try {
      const form = new FormData();
      form.append('file', file, file.name);
      const uploadRes = await fetch(`/api/upload-photo/${personId}`, { method: 'POST', body: form });
      if (!uploadRes.ok) { console.error(await uploadRes.json()); return null; }
      const fileObj = await uploadRes.json();

      const patchRes = await fetch(`${BASE}/people/${personId}`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ Photo: [{ name: fileObj.name }] }),
      });
      if (!patchRes.ok) { console.error(await patchRes.json()); return null; }
      return fileObj.url ?? null;
    } catch (e) { console.error(e); return null; }
  },
};

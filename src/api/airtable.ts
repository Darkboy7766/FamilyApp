import type { Person, EventRecord, Routine, Task, FamilyRole } from '../types';

const getUrl = (tableName: string) => `/api/airtable/${encodeURIComponent(tableName)}`;

const headers = {
  'Content-Type': 'application/json',
};

const cleanFields = (fields: Record<string, unknown>): Record<string, unknown> => {
  const cleaned: Record<string, unknown> = {};
  for (const key in fields) {
    const val = fields[key];
    if (val !== undefined && val !== null && val !== '' && !(Array.isArray(val) && val.length === 0)) {
      cleaned[key] = val;
    }
  }
  return cleaned;
};

async function fetchAllRecords(tableName: string): Promise<any[]> {
  const records: any[] = [];
  let offset: string | undefined;
  do {
    const qs = offset ? `?offset=${encodeURIComponent(offset)}` : '';
    const res = await fetch(`${getUrl(tableName)}${qs}`, { headers });
    if (!res.ok) throw new Error(`Грешка при извличане на ${tableName}`);
    const data = await res.json();
    records.push(...data.records);
    offset = data.offset;
  } while (offset);
  return records;
}

export const airtableApi = {
  fetchPeople: async (): Promise<Person[]> => {
    try {
      const records = await fetchAllRecords('Хора');
      return records.map((r: any) => {
        const photoArr = r.fields['Снимка'];
        return {
          id: r.id,
          name: r.fields['Име'] || '',
          photoUrl: photoArr && photoArr.length > 0 ? photoArr[0].url : '',
          phone: r.fields['Телефон'] || '',
          role: (r.fields['Роля'] as FamilyRole) || undefined,
        };
      });
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  fetchEvents: async (): Promise<EventRecord[]> => {
    try {
      const records = await fetchAllRecords('Важни дати');
      return records.map((r: any) => ({
        id: r.id,
        type: r.fields['Иìе на събитието'] || r.fields['Тип събитие'] || '',
        date: r.fields['Дата на раждане/събитие'] || '',
        personIds: r.fields['Човек'] || [],
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  fetchRoutines: async (): Promise<Routine[]> => {
    try {
      const records = await fetchAllRecords('Здраве и Рутина');
      return records.map((r: any) => ({
        id: r.id,
        medication: r.fields['Иìе на лекарство/диета'] || '',
        time: r.fields['Час за напомняне'] || '',
        personIds: r.fields['Човек'] || [],
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  createPerson: async (data: Partial<Person>): Promise<Person | null> => {
    try {
      const res = await fetch(getUrl('Хора'), {
        method: 'POST', headers,
        body: JSON.stringify({ records: [{ fields: cleanFields({ 'Иìе': data.name, 'Телефон': data.phone, 'Роля': data.role }) }], typecast: true }),
      });
      if (!res.ok) { console.error(await res.json()); return null; }
      const r = (await res.json()).records[0];
      return { id: r.id, name: r.fields['Иìе'] || data.name || '', phone: r.fields['Телефон'] || data.phone || '', photoUrl: '', role: r.fields['Роля'] || data.role || undefined };
    } catch (e) { console.error(e); return null; }
  },

  createEvent: async (data: Partial<EventRecord>): Promise<EventRecord | null> => {
    try {
      const res = await fetch(getUrl('Важни дати'), {
        method: 'POST', headers,
        body: JSON.stringify({ records: [{ fields: cleanFields({ 'Тип събитие': data.type, 'Дата на раждане/събитие': data.date, 'Човек': data.personIds }) }], typecast: true }),
      });
      if (!res.ok) { console.error(await res.json()); return null; }
      const r = (await res.json()).records[0];
      return { id: r.id, type: r.fields['Тип събитие'] || data.type || '', date: r.fields['Дата на раждане/събитие'] || data.date || '', personIds: r.fields['Човек'] || data.personIds || [] };
    } catch (e) { console.error(e); return null; }
  },

  updatePerson: async (id: string, data: Partial<Person>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/airtable/${encodeURIComponent('Хора')}/${id}`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ fields: cleanFields({ 'Иìе': data.name, 'Телефон': data.phone, 'Роля': data.role }) }),
      });
      if (!res.ok) console.error(await res.json());
      return res.ok;
    } catch (e) { console.error(e); return false; }
  },

  updateEvent: async (id: string, data: Partial<EventRecord>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/airtable/${encodeURIComponent('Важни дати')}/${id}`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ fields: cleanFields({ 'Тип събитие': data.type, 'Дата на раждане/събитие': data.date, 'Човек': data.personIds }) }),
      });
      if (!res.ok) console.error(await res.json());
      return res.ok;
    } catch (e) { console.error(e); return false; }
  },

  updateRoutine: async (id: string, data: Partial<Routine>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/airtable/${encodeURIComponent('Здраве и Рутина')}/${id}`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ fields: cleanFields({ 'Иìе на лекарство/диета': data.medication, 'Час за напомняне': data.time, 'Човек': data.personIds }) }),
      });
      if (!res.ok) console.error(await res.json());
      return res.ok;
    } catch (e) { console.error(e); return false; }
  },

  deletePerson: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/airtable/${encodeURIComponent('Хора')}/${id}`, { method: 'DELETE', headers });
      return res.ok;
    } catch (e) { console.error(e); return false; }
  },

  deleteEvent: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/airtable/${encodeURIComponent('Важни дати')}/${id}`, { method: 'DELETE', headers });
      return res.ok;
    } catch (e) { console.error(e); return false; }
  },

  deleteRoutine: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/airtable/${encodeURIComponent('Здраве и Рутина')}/${id}`, { method: 'DELETE', headers });
      return res.ok;
    } catch (e) { console.error(e); return false; }
  },

  fetchTasks: async (): Promise<Task[]> => {
    try {
      const records = await fetchAllRecords('Задачи');
      return records.map((r: any) => ({
        id: r.id,
        title: r.fields['Заглавие'] || '',
        done: r.fields['Изпълнено'] ?? false,
        dueDate: r.fields['Краен срок'] || undefined,
        personIds: r.fields['Човек'] || [],
      }));
    } catch (e) { console.error(e); return []; }
  },

  createTask: async (data: Partial<Task>): Promise<Task | null> => {
    try {
      const res = await fetch(getUrl('Задачи'), {
        method: 'POST', headers,
        body: JSON.stringify({ records: [{ fields: cleanFields({ 'Заглавие': data.title, 'Краен срок': data.dueDate, 'Човек': data.personIds }) }], typecast: true }),
      });
      if (!res.ok) { console.error(await res.json()); return null; }
      const r = (await res.json()).records[0];
      return { id: r.id, title: r.fields['Заглавие'] || data.title || '', done: false, dueDate: r.fields['Краен срок'] || data.dueDate, personIds: r.fields['Човек'] || data.personIds || [] };
    } catch (e) { console.error(e); return null; }
  },

  updateTask: async (id: string, data: Partial<Task>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/airtable/${encodeURIComponent('Задачи')}/${id}`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ fields: cleanFields({ 'Заглавие': data.title, 'Изпълнено': data.done, 'Краен срок': data.dueDate, 'Човек': data.personIds }) }),
      });
      if (!res.ok) console.error(await res.json());
      return res.ok;
    } catch (e) { console.error(e); return false; }
  },

  deleteTask: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/airtable/${encodeURIComponent('Задачи')}/${id}`, { method: 'DELETE', headers });
      return res.ok;
    } catch (e) { console.error(e); return false; }
  },

  createRoutine: async (data: Partial<Routine>): Promise<Routine | null> => {
    try {
      const res = await fetch(getUrl('Здраве и Рутина'), {
        method: 'POST', headers,
        body: JSON.stringify({ records: [{ fields: cleanFields({ 'Иìе на лекарство/диета': data.medication, 'Час за напомняне': data.time, 'Човек': data.personIds }) }], typecast: true }),
      });
      if (!res.ok) { console.error(await res.json()); return null; }
      const r = (await res.json()).records[0];
      return { id: r.id, medication: r.fields['Иìе на лекарство/диета'] || data.medication || '', time: r.fields['Час за напомняне'] || data.time || '', personIds: r.fields['Човек'] || data.personIds || [] };
    } catch (e) { console.error(e); return null; }
  },
};

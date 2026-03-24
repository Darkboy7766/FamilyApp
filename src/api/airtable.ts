import type { Person, EventRecord, Routine } from '../types';

// Use Vite environment variables for the Airtable credentials
const PAT = import.meta.env.VITE_AIRTABLE_PAT || 'YOUR_AIRTABLE_PAT_HERE';
const BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID || 'YOUR_BASE_ID_HERE';

const headers = {
  'Authorization': `Bearer ${PAT}`,
  'Content-Type': 'application/json'
};

const getUrl = (tableName: string) => `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tableName)}`;

const cleanFields = (fields: any) => {
  const cleaned: any = {};
  for (const key in fields) {
    if (fields[key] !== undefined && fields[key] !== null && fields[key] !== '' && !(Array.isArray(fields[key]) && fields[key].length === 0)) {
      cleaned[key] = fields[key];
    }
  }
  return cleaned;
};

export const airtableApi = {
  fetchPeople: async (): Promise<Person[]> => {
    try {
      const res = await fetch(getUrl('Хора'), { headers });
      if (!res.ok) throw new Error('Потребителско име/Токен са невалидни');
      const data = await res.json();
      return data.records.map((r: any) => {
        const photoArr = r.fields['Снимка'];
        return {
          id: r.id,
          name: r.fields['Име'] || '',
          photoUrl: photoArr && photoArr.length > 0 ? photoArr[0].url : '',
          phone: r.fields['Телефон'] || ''
        };
      });
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  fetchEvents: async (): Promise<EventRecord[]> => {
    try {
      const res = await fetch(getUrl('Важни дати'), { headers });
      if (!res.ok) throw new Error('Грешка при извличане');
      const data = await res.json();
      return data.records.map((r: any) => ({
        id: r.id,
        type: r.fields['Име на събитието'] || r.fields['Тип събитие'] || '',
        date: r.fields['Дата на раждане/събитие'] || '',
        personIds: r.fields['Човек'] || []
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  fetchRoutines: async (): Promise<Routine[]> => {
    try {
      const res = await fetch(getUrl('Здраве и Рутина'), { headers });
      if (!res.ok) throw new Error('Грешка при извличане');
      const data = await res.json();
      return data.records.map((r: any) => ({
        id: r.id,
        medication: r.fields['Име на лекарство/диета'] || '',
        time: r.fields['Час за напомняне'] || '',
        personIds: r.fields['Човек'] || []
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  createPerson: async (data: Partial<Person>): Promise<boolean> => {
    try {
      const res = await fetch(getUrl('Хора'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ records: [{ fields: cleanFields({ 'Име': data.name }) }], typecast: true })
      });
      if (!res.ok) console.error(await res.json());
      return res.ok;
    } catch (e) { console.error(e); return false; }
  },

  createEvent: async (data: Partial<EventRecord>): Promise<boolean> => {
    try {
      const res = await fetch(getUrl('Важни дати'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ records: [{ fields: cleanFields({ 'Тип събитие': data.type, 'Дата на раждане/събитие': data.date, 'Човек': data.personIds }) }], typecast: true })
      });
      if (!res.ok) console.error(await res.json());
      return res.ok;
    } catch (e) { console.error(e); return false; }
  },

  createRoutine: async (data: Partial<Routine>): Promise<boolean> => {
    try {
      const res = await fetch(getUrl('Здраве и Рутина'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ records: [{ fields: cleanFields({ 'Име на лекарство/диета': data.medication, 'Час за напомняне': data.time, 'Човек': data.personIds }) }], typecast: true })
      });
      if (!res.ok) console.error(await res.json());
      return res.ok;
    } catch (e) { console.error(e); return false; }
  }
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Person, EventRecord, Routine, Task } from '../types';
import { airtableApi } from '../api/airtable';

interface DataContextType {
  people: Person[];
  events: EventRecord[];
  routines: Routine[];
  tasks: Task[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  addPerson: (data: Partial<Person>) => Promise<boolean>;
  addEvent: (data: Partial<EventRecord>) => Promise<boolean>;
  addRoutine: (data: Partial<Routine>) => Promise<boolean>;
  addTask: (data: Partial<Task>) => Promise<boolean>;
  updatePerson: (id: string, data: Partial<Person>) => Promise<boolean>;
  updateEvent: (id: string, data: Partial<EventRecord>) => Promise<boolean>;
  updateRoutine: (id: string, data: Partial<Routine>) => Promise<boolean>;
  updateTask: (id: string, data: Partial<Task>) => Promise<boolean>;
  deletePerson: (id: string) => Promise<boolean>;
  deleteEvent: (id: string) => Promise<boolean>;
  deleteRoutine: (id: string) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [people, setPeople]     = useState<Person[]>([]);
  const [events, setEvents]     = useState<EventRecord[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [tasks, setTasks]       = useState<Task[]>([]);
  const [loading, setLoading]   = useState<boolean>(true);
  const [error, setError]       = useState<string | null>(null);

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedPeople, fetchedEvents, fetchedRoutines, fetchedTasks] = await Promise.all([
        airtableApi.fetchPeople(),
        airtableApi.fetchEvents(),
        airtableApi.fetchRoutines(),
        airtableApi.fetchTasks(),
      ]);
      setPeople(fetchedPeople);
      setEvents(fetchedEvents);
      setRoutines(fetchedRoutines);
      setTasks(fetchedTasks);
    } catch (err: any) {
      setError(err.message || 'Грешка при зареждане');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshData(); }, []);

  // ── Create ──
  const addPerson = async (data: Partial<Person>) => {
    const r = await airtableApi.createPerson(data);
    if (r) setPeople(prev => [...prev, r]);
    return !!r;
  };
  const addEvent = async (data: Partial<EventRecord>) => {
    const r = await airtableApi.createEvent(data);
    if (r) setEvents(prev => [...prev, r]);
    return !!r;
  };
  const addRoutine = async (data: Partial<Routine>) => {
    const r = await airtableApi.createRoutine(data);
    if (r) setRoutines(prev => [...prev, r]);
    return !!r;
  };
  const addTask = async (data: Partial<Task>) => {
    const r = await airtableApi.createTask(data);
    if (r) setTasks(prev => [...prev, r]);
    return !!r;
  };

  // ── Update ──
  const updatePerson = async (id: string, data: Partial<Person>) => {
    const ok = await airtableApi.updatePerson(id, data);
    if (ok) setPeople(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    return ok;
  };
  const updateEvent = async (id: string, data: Partial<EventRecord>) => {
    const ok = await airtableApi.updateEvent(id, data);
    if (ok) setEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    return ok;
  };
  const updateRoutine = async (id: string, data: Partial<Routine>) => {
    const ok = await airtableApi.updateRoutine(id, data);
    if (ok) setRoutines(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    return ok;
  };
  const updateTask = async (id: string, data: Partial<Task>) => {
    const ok = await airtableApi.updateTask(id, data);
    if (ok) setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    return ok;
  };

  // ── Delete ──
  const deletePerson = async (id: string) => {
    const ok = await airtableApi.deletePerson(id);
    if (ok) setPeople(prev => prev.filter(p => p.id !== id));
    return ok;
  };
  const deleteEvent = async (id: string) => {
    const ok = await airtableApi.deleteEvent(id);
    if (ok) setEvents(prev => prev.filter(e => e.id !== id));
    return ok;
  };
  const deleteRoutine = async (id: string) => {
    const ok = await airtableApi.deleteRoutine(id);
    if (ok) setRoutines(prev => prev.filter(r => r.id !== id));
    return ok;
  };
  const deleteTask = async (id: string) => {
    const ok = await airtableApi.deleteTask(id);
    if (ok) setTasks(prev => prev.filter(t => t.id !== id));
    return ok;
  };

  return (
    <DataContext.Provider value={{
      people, events, routines, tasks, loading, error, refreshData,
      addPerson, addEvent, addRoutine, addTask,
      updatePerson, updateEvent, updateRoutine, updateTask,
      deletePerson, deleteEvent, deleteRoutine, deleteTask,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
};

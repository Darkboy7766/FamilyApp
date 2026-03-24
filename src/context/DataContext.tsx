import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Person, EventRecord, Routine } from '../types';
import { airtableApi } from '../api/airtable';

interface DataContextType {
  people: Person[];
  events: EventRecord[];
  routines: Routine[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  addPerson: (data: Partial<Person>) => Promise<boolean>;
  addEvent: (data: Partial<EventRecord>) => Promise<boolean>;
  addRoutine: (data: Partial<Routine>) => Promise<boolean>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedPeople, fetchedEvents, fetchedRoutines] = await Promise.all([
        airtableApi.fetchPeople(),
        airtableApi.fetchEvents(),
        airtableApi.fetchRoutines()
      ]);
      setPeople(fetchedPeople);
      setEvents(fetchedEvents);
      setRoutines(fetchedRoutines);
    } catch (err: any) {
      setError(err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addPerson = async (data: Partial<Person>) => {
    const success = await airtableApi.createPerson(data);
    if (success) await refreshData();
    return success;
  };

  const addEvent = async (data: Partial<EventRecord>) => {
    const success = await airtableApi.createEvent(data);
    if (success) await refreshData();
    return success;
  };

  const addRoutine = async (data: Partial<Routine>) => {
    const success = await airtableApi.createRoutine(data);
    if (success) await refreshData();
    return success;
  };

  return (
    <DataContext.Provider value={{ people, events, routines, loading, error, refreshData, addPerson, addEvent, addRoutine }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

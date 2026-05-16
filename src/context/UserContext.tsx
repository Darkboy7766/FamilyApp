import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Person } from '../types';
import { useData } from './DataContext';

const STORAGE_KEY = 'familycrm_user_id';

interface UserContextType {
  currentUser: Person | null;
  login: (personId: string, pin: string) => boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { people } = useData();
  const [currentUserId, setCurrentUserId] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );

  const currentUser = people.find(p => p.id === currentUserId) ?? null;

  // Keep currentUser in sync if name/photo changes
  useEffect(() => {
    if (currentUserId && people.length > 0 && !people.find(p => p.id === currentUserId)) {
      setCurrentUserId(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [people, currentUserId]);

  const login = (personId: string, pin: string): boolean => {
    const person = people.find(p => p.id === personId);
    if (!person) return false;
    const expectedPin = person.pin ?? '';
    if (expectedPin !== '' && expectedPin !== pin) return false;
    setCurrentUserId(personId);
    localStorage.setItem(STORAGE_KEY, personId);
    return true;
  };

  const logout = () => {
    setCurrentUserId(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <UserContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
};

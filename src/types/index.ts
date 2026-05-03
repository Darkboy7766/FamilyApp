export type FamilyRole = 'Майка' | 'Баща' | 'Дете' | 'Баба' | 'Дядо' | 'Брат' | 'Сестра';

export interface Person {
  id: string;
  name: string;
  photoUrl?: string;
  phone?: string;
  role?: FamilyRole;
}

export interface EventRecord {
  id: string;
  type: string;
  date: string;       // YYYY-MM-DD or full ISO
  personIds: string[];
}

export interface Routine {
  id: string;
  medication: string;
  time: string;       // HH:mm
  personIds: string[];
}

export interface Task {
  id: string;
  title: string;
  done: boolean;
  dueDate?: string;   // YYYY-MM-DD
  personIds?: string[];
}

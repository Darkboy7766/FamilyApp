export interface Family {
  id: string;
  name: string;
  color: string;
}

export const FAMILY_COLORS: Record<string, { bg: string; text: string }> = {
  blue:   { bg: '#dbeafe', text: '#1d4ed8' },
  green:  { bg: '#dcfce7', text: '#16a34a' },
  purple: { bg: '#f3e8ff', text: '#9333ea' },
  orange: { bg: '#ffedd5', text: '#ea580c' },
  pink:   { bg: '#fce7f3', text: '#be185d' },
  red:    { bg: '#fee2e2', text: '#dc2626' },
  teal:   { bg: '#ccfbf1', text: '#0d9488' },
  yellow: { bg: '#fef9c3', text: '#ca8a04' },
};

export const PALETTE_KEYS = Object.keys(FAMILY_COLORS);

export interface Person {
  id: string;
  name: string;
  photoUrl?: string;
  phone?: string;
  email?: string;
  familyIds?: string[];
  pin?: string;
  birthDate?: string;  // YYYY-MM-DD
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

export const EXPENSE_CATEGORIES = ['Храна', 'Сметки', 'Здраве', 'Транспорт', 'Развлечение', 'Друго'] as const;
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;       // YYYY-MM-DD
  paidById?: string;  // Person id
}

export interface Person {
  id: string;
  name: string;
  photoUrl?: string;
  phone?: string;
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

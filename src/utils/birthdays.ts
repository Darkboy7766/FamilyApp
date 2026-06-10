import { addDays, isWithinInterval, startOfDay } from 'date-fns';
import type { Person } from '../types';

export interface UpcomingBirthday {
  person: Person;
  nextDate: Date;
  daysLeft: number;
}

// Returns birthdays falling within [now, now + daysAhead], using MM-DD match
// (the birth year is ignored, recurring every year).
export function getUpcomingBirthdays(people: Person[], now: Date, daysAhead: number): UpcomingBirthday[] {
  const today = startOfDay(now);
  const windowEnd = addDays(today, daysAhead);
  const result: UpcomingBirthday[] = [];

  for (const person of people) {
    if (!person.birthDate) continue;
    const [, month, day] = person.birthDate.split('-').map(Number);
    if (!month || !day) continue;

    let next = startOfDay(new Date(today.getFullYear(), month - 1, day));
    if (next < today) {
      next = startOfDay(new Date(today.getFullYear() + 1, month - 1, day));
    }

    if (isWithinInterval(next, { start: today, end: windowEnd })) {
      const daysLeft = Math.round((next.getTime() - today.getTime()) / 86400000);
      result.push({ person, nextDate: next, daysLeft });
    }
  }

  return result.sort((a, b) => a.daysLeft - b.daysLeft);
}

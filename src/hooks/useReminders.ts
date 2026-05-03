import { useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { addDays, format, parseISO } from 'date-fns';

export const useReminders = () => {
  const { events, routines, people } = useData();
  const { addToast } = useToast();

  // Stable refs so the interval always sees latest data without re-starting
  const eventsRef = useRef(events);
  const routinesRef = useRef(routines);
  const peopleRef = useRef(people);
  useEffect(() => { eventsRef.current = events; }, [events]);
  useEffect(() => { routinesRef.current = routines; }, [routines]);
  useEffect(() => { peopleRef.current = people; }, [people]);

  const notifiedRoutines = useRef<Set<string>>(new Set());
  const notifiedEvents = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentHHMM = format(now, 'HH:mm');
      const targetMMdd = format(addDays(now, 3), 'MM-dd');

      routinesRef.current.forEach(routine => {
        if (routine.time !== currentHHMM) return;
        const key = `${routine.id}-${currentHHMM}-${format(now, 'yyyy-MM-dd')}`;
        if (notifiedRoutines.current.has(key)) return;
        const person = peopleRef.current.find(p => routine.personIds?.includes(p.id));
        addToast(`Време за: ${routine.medication} (${person?.name ?? 'Някой'})`, 'warning');
        notifiedRoutines.current.add(key);
      });

      eventsRef.current.forEach(event => {
        if (!event.date) return;
        try {
          const eventMMdd = format(parseISO(event.date), 'MM-dd');
          if (eventMMdd !== targetMMdd) return;
          const key = `${event.id}-${targetMMdd}`;
          if (notifiedEvents.current.has(key)) return;
          const person = peopleRef.current.find(p => event.personIds?.includes(p.id));
          addToast(`Предстоящо на ${format(parseISO(event.date), 'dd.MM')}: ${event.type} за ${person?.name ?? 'Някой'}!`, 'info');
          notifiedEvents.current.add(key);
        } catch { /* невалидна дата */ }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60_000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — intentionally stable, uses refs
};

import { useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { addDays, format, parseISO } from 'date-fns';

export const useReminders = () => {
  const { events, routines, people } = useData();
  const { addToast } = useToast();
  
  // Keep track of notified items to avoid spamming
  const notifiedRoutines = useRef<Set<string>>(new Set());
  const notifiedEvents = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Run immediately on first mount, then every minute
    const checkReminders = () => {
      const now = new Date();
      const currentHHMM = format(now, 'HH:mm');
      const dateIn3Days = addDays(now, 3);
      const targetMMdd = format(dateIn3Days, 'MM-dd');
      
      // Check Routines
      routines.forEach(routine => {
        if (routine.time === currentHHMM) {
          const key = `${routine.id}-${currentHHMM}`;
          if (!notifiedRoutines.current.has(key)) {
            const person = people.find(p => routine.personIds?.includes(p.id));
            const personName = person ? person.name : 'Някой';
            addToast(`Време за: ${routine.medication} (${personName})`, 'warning');
            notifiedRoutines.current.add(key);
          }
        }
      });

      // Check Events (3 days before, matching month and day)
      events.forEach(event => {
        if (event.date) {
          try {
            const eventDate = parseISO(event.date);
            const eventMMdd = format(eventDate, 'MM-dd');
            if (eventMMdd === targetMMdd) {
              const key = `${event.id}-${targetMMdd}`;
              if (!notifiedEvents.current.has(key)) {
                const person = people.find(p => event.personIds?.includes(p.id));
                const personName = person ? person.name : 'Някой';
                addToast(`Предстоящо на ${format(eventDate, 'dd.MM')}: ${event.type} за ${personName}!`, 'info');
                notifiedEvents.current.add(key);
              }
            }
          } catch (e) {
            // ignore invalid dates
          }
        }
      });
    };

    checkReminders(); // check immediately
    const interval = setInterval(checkReminders, 60000);

    return () => clearInterval(interval);
  }, [events, routines, people, addToast]);
};

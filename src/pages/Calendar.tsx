import React from 'react';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import type { EventRecord } from '../types';
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isToday,
  addMonths, subMonths, parseISO, format, getDay,
} from 'date-fns';
import { bg } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

const EVENT_COLORS = [
  { bg: '#fce7f3', text: '#be185d' },
  { bg: '#dbeafe', text: '#1d4ed8' },
  { bg: '#d1fae5', text: '#065f46' },
  { bg: '#ede9fe', text: '#6d28d9' },
  { bg: '#fef9c3', text: '#a16207' },
  { bg: '#fee2e2', text: '#b91c1c' },
];

function colorFor(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffff;
  return EVENT_COLORS[h % EVENT_COLORS.length];
}

export const Calendar: React.FC = () => {
  const { events, people, loading } = useData();
  const [viewDate, setViewDate] = React.useState(() => new Date());

  if (loading) return (
    <div className="animate-fade-in" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
      Зареждане...
    </div>
  );

  const monthStart = startOfMonth(viewDate);
  const monthEnd   = endOfMonth(viewDate);
  // Week starts on Monday (weekStartsOn: 1)
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd    = endOfWeek(monthEnd,   { weekStartsOn: 1 });
  const days       = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const getPersonName = (id: string) => people.find(p => p.id === id)?.name ?? '';

  // Map: "MM-DD" → events
  const eventsByMonthDay: Record<string, EventRecord[]> = {};
  for (const e of events) {
    if (!e.date) continue;
    try {
      const d = parseISO(e.date);
      const key = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      (eventsByMonthDay[key] ??= []).push(e);
    } catch { /* skip */ }
  }

  const eventsForDay = (day: Date): EventRecord[] => {
    const key = `${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    return eventsByMonthDay[key] ?? [];
  };

  const monthLabel = format(viewDate, 'MMMM yyyy', { locale: bg });

  // Upcoming events in this month for the sidebar list
  const thisMonthEvents = events.filter(e => {
    if (!e.date) return false;
    try {
      const d = parseISO(e.date);
      return d.getMonth() === viewDate.getMonth();
    } catch { return false; }
  }).sort((a, b) => {
    const da = parseISO(a.date!).getDate();
    const db = parseISO(b.date!).getDate();
    return da - db;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '1rem' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--card-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CalendarIcon size={26} color="#3b82f6" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600 }}>Календар</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, textTransform: 'capitalize' }}>{monthLabel}</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setViewDate(d => subMonths(d, 1))} style={navBtn} title="Предишен месец">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setViewDate(new Date())} style={{ ...navBtn, fontSize: '0.78rem', fontWeight: 700, padding: '6px 12px', width: 'auto' }} title="Днес">
            Днес
          </button>
          <button onClick={() => setViewDate(d => addMonths(d, 1))} style={navBtn} title="Следващ месец">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* ── Calendar grid ── */}
      <Card variant="white">
        {/* Weekday headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
          {WEEKDAYS.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', padding: '4px 0' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
          {days.map(day => {
            const dayEvents = eventsForDay(day);
            const inMonth   = isSameMonth(day, viewDate);
            const today     = isToday(day);
            const isSun     = getDay(day) === 0;

            return (
              <div
                key={day.toISOString()}
                style={{
                  minHeight: 60,
                  padding: '4px',
                  borderRadius: '10px',
                  background: today ? 'var(--accent-color)' : inMonth ? '#f8fafc' : 'transparent',
                  opacity: inMonth ? 1 : 0.35,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: today ? 800 : 600,
                  color: today ? '#fff' : isSun ? '#ef4444' : 'var(--text-primary)',
                  lineHeight: 1,
                  marginBottom: '2px',
                }}>
                  {format(day, 'd')}
                </span>

                {dayEvents.slice(0, 2).map(e => {
                  const col = colorFor(e.type);
                  return (
                    <div
                      key={e.id}
                      title={`${e.type}${e.personIds?.length ? ' — ' + e.personIds.map(getPersonName).join(', ') : ''}`}
                      style={{
                        background: today ? 'rgba(255,255,255,0.25)' : col.bg,
                        color: today ? '#fff' : col.text,
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        padding: '1px 4px',
                        borderRadius: '4px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.4,
                      }}
                    >
                      {e.type}
                    </div>
                  );
                })}

                {dayEvents.length > 2 && (
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, color: today ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)', paddingLeft: '2px' }}>
                    +{dayEvents.length - 2}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Events list for this month ── */}
      {thisMonthEvents.length > 0 && (
        <Card variant="white" title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarIcon size={18} color="var(--accent-color)" />
            <span style={{ textTransform: 'capitalize' }}>{format(viewDate, 'MMMM', { locale: bg })} — всички събития</span>
          </div>
        }>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {thisMonthEvents.map(e => {
              const col = colorFor(e.type);
              const day = parseISO(e.date!).getDate();
              const names = e.personIds?.map(getPersonName).filter(Boolean).join(', ');
              return (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 1rem', background: '#f8fafc', borderRadius: '12px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: col.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: '0.9rem', color: col.text }}>
                    {day}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.type}</div>
                    {names && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{names}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

    </div>
  );
};

const navBtn: React.CSSProperties = {
  background: '#f1f5f9',
  border: 'none',
  borderRadius: '10px',
  width: 36,
  height: 36,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: 'var(--text-primary)',
  flexShrink: 0,
};

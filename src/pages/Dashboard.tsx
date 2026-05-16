import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useUser } from '../context/UserContext';
import { Card } from '../components/ui/Card';
import type { EventRecord, Routine, Task } from '../types';
import { format, parseISO, addDays, isWithinInterval, startOfDay, isToday, isPast } from 'date-fns';
import { bg } from 'date-fns/locale';
import {
  Calendar, HeartPulse, Coffee, Trash2, Pencil,
  User, CheckSquare, Users, ArrowRight,
} from 'lucide-react';
import { CreateEntityModal } from '../components/CreateEntityModal';
import type { EditData } from '../components/CreateEntityModal';

export const Dashboard: React.FC = () => {
  const { events, routines, tasks, people, loading, updateTask, deleteEvent, deleteRoutine } = useData();
  const { addToast } = useToast();
  const { currentUser } = useUser();
  const [editData, setEditData] = React.useState<EditData | undefined>();

  const now = new Date();
  const todayLabel = format(now, 'EEEE, d MMMM', { locale: bg });

  if (loading) return (
    <div className="animate-fade-in" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
      Зареждане...
    </div>
  );

  // ── Data derivations ──
  const windowEnd = addDays(now, 30);

  const upcomingEvents = events.filter((e: EventRecord) => {
    if (!e.date) return false;
    try {
      const d = parseISO(e.date);
      const thisYear = new Date(now.getFullYear(), d.getMonth(), d.getDate());
      return isWithinInterval(startOfDay(thisYear), { start: startOfDay(now), end: windowEnd });
    } catch { return false; }
  }).sort((a, b) => {
    const ma = parseISO(a.date!).getMonth() * 31 + parseISO(a.date!).getDate();
    const mb = parseISO(b.date!).getMonth() * 31 + parseISO(b.date!).getDate();
    return ma - mb;
  });

  // My tasks + shared (no person). Tasks for others are hidden.
  const visibleTasks = tasks.filter((t: Task) =>
    !t.personIds?.length || t.personIds.includes(currentUser!.id)
  );

  const todayTasks = visibleTasks.filter(
    (t: Task) => !t.done && t.dueDate && isToday(parseISO(t.dueDate))
  );
  const overdueTasks = visibleTasks.filter(
    (t: Task) => !t.done && t.dueDate && isPast(startOfDay(parseISO(t.dueDate))) && !isToday(parseISO(t.dueDate))
  );
  const pendingCount = visibleTasks.filter((t: Task) => !t.done).length;

  const todayRoutines = [...routines].sort((a: Routine, b: Routine) =>
    (a.time || '').localeCompare(b.time || '')
  );

  const getPersonNames = (ids?: string[]) => {
    if (!ids || ids.length === 0) return '';
    return ids.map(id => people.find(p => p.id === id)?.name ?? 'Някой').join(', ');
  };

  // ── Sub-components ──
  const StatCard: React.FC<{ to: string; color: string; icon: React.ReactNode; value: number | string; label: string }> =
    ({ to, color, icon, value, label }) => (
      <Link to={to} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', background: color, borderRadius: '20px', flex: 1, minWidth: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>{label}</div>
      </Link>
    );

  return (
    <>
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '1rem' }}>

        {/* ── Greeting ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--card-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={26} color="#f43f5e" />
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{todayLabel}</div>
          </div>
        </div>

        {/* ── Quick stats ── */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <StatCard to="/tasks" color="var(--card-blue)" icon={<CheckSquare size={18} color="#3b82f6" />} value={pendingCount} label="чакащи задачи" />
          <StatCard to="/" color="var(--card-green)" icon={<Calendar size={18} color="#059669" />} value={upcomingEvents.length} label="предстоящи" />
          <StatCard to="/contacts" color="var(--card-pink)" icon={<Users size={18} color="#f43f5e" />} value={people.length} label="души" />
        </div>

        {/* ── Today's focus ── */}
        {(todayTasks.length > 0 || overdueTasks.length > 0 || todayRoutines.length > 0) && (
          <Card variant="white" title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div className="flex-center" style={{ gap: '0.5rem', justifyContent: 'flex-start' }}>
                <CheckSquare size={18} color="var(--accent-color)" />
                Днес
              </div>
              <Link to="/tasks" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                Всички <ArrowRight size={13} />
              </Link>
            </div>
          }>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {overdueTasks.map((t: Task) => (
                <TodayTaskRow key={t.id} task={t} overdue names={getPersonNames(t.personIds)} onToggle={() => updateTask(t.id, { done: true })} />
              ))}
              {todayTasks.map((t: Task) => (
                <TodayTaskRow key={t.id} task={t} names={getPersonNames(t.personIds)} onToggle={() => updateTask(t.id, { done: true })} />
              ))}
              {todayRoutines.map((r: Routine) => (
                <div key={r.id} className="flex-between" style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <HeartPulse size={15} color="var(--accent-color)" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{r.medication}</div>
                      {getPersonNames(r.personIds) && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{getPersonNames(r.personIds)}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ background: 'var(--card-green)', padding: '3px 10px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, color: '#059669' }}>{r.time}</span>
                    <button onClick={() => setEditData({ tab: 'routine', id: r.id, medication: r.medication, time: r.time, routinePersonId: r.personIds?.[0] ?? '' })} style={iconBtn}><Pencil size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── Upcoming events ── */}
        <Card variant="white" title={
          <div className="flex-center" style={{ gap: '0.5rem', justifyContent: 'flex-start' }}>
            <Calendar size={18} color="var(--accent-color)" />
            Предстоящи Събития
          </div>
        }>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {upcomingEvents.length === 0
              ? <p style={{ margin: 0, fontSize: '0.9rem' }}>Няма събития в следващите 30 дни.</p>
              : upcomingEvents.map((e: EventRecord) => {
                const thisYear = new Date(now.getFullYear(), parseISO(e.date!).getMonth(), parseISO(e.date!).getDate());
                const daysLeft = Math.round((thisYear.getTime() - startOfDay(now).getTime()) / 86400000);
                return (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '14px' }}>
                    <div style={{ background: 'var(--card-green)', width: 38, height: 38, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Coffee size={18} color="#059669" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.type}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {getPersonNames(e.personIds)}
                        {getPersonNames(e.personIds) ? ' • ' : ''}
                        {daysLeft === 0 ? 'Днес!' : daysLeft === 1 ? 'Утре' : `след ${daysLeft} дни`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                      <button onClick={() => setEditData({ tab: 'event', id: e.id, eventType: e.type, eventDate: e.date ?? '', eventPersonId: e.personIds?.[0] ?? '' })} style={iconBtn} title="Редактирай"><Pencil size={14} /></button>
                      <button onClick={async () => { if (!window.confirm(`Изтрий "${e.type}"?`)) return; const ok = await deleteEvent(e.id); if (!ok) addToast('Грешка.', 'error'); }} style={{ ...iconBtn, color: 'var(--danger-color)' }} title="Изтрий"><Trash2 size={14} /></button>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </Card>

        {/* ── All routines ── */}
        {routines.length > 0 && (
          <Card variant="white" title={
            <div className="flex-center" style={{ gap: '0.5rem', justifyContent: 'flex-start' }}>
              <HeartPulse size={18} color="var(--accent-color)" />
              Лекарства и Рутини
            </div>
          }>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {todayRoutines.map((r: Routine) => (
                <div key={r.id} className="flex-between" style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '14px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{r.medication}</div>
                    {getPersonNames(r.personIds) && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{getPersonNames(r.personIds)}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ background: '#fff', padding: '4px 12px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-color)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>{r.time}</span>
                    <button onClick={() => setEditData({ tab: 'routine', id: r.id, medication: r.medication, time: r.time, routinePersonId: r.personIds?.[0] ?? '' })} style={iconBtn}><Pencil size={14} /></button>
                    <button onClick={async () => { if (!window.confirm(`Изтрий "${r.medication}"?`)) return; const ok = await deleteRoutine(r.id); if (!ok) addToast('Грешка.', 'error'); }} style={{ ...iconBtn, color: 'var(--danger-color)' }}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

      </div>

      <CreateEntityModal isOpen={!!editData} onClose={() => setEditData(undefined)} editData={editData} />
    </>
  );
};

const iconBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: 'var(--text-secondary)', display: 'flex', padding: '5px', borderRadius: '7px',
};

const TodayTaskRow: React.FC<{ task: Task; overdue?: boolean; names?: string; onToggle: () => void }> = ({ task, overdue, names, onToggle }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem 1rem', background: overdue ? '#fff5f5' : '#f8fafc', borderRadius: '14px', border: overdue ? '1px solid #fecaca' : '1px solid transparent' }}>
    <button
      onClick={onToggle}
      style={{ width: 24, height: 24, borderRadius: '7px', border: `2px solid ${overdue ? 'var(--danger-color)' : 'var(--panel-border)'}`, background: 'transparent', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, transition: 'var(--transition)' }}
    />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: overdue ? 'var(--danger-color)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {overdue ? '⚠ ' : ''}{task.title}
      </div>
      {names && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{names}</div>}
    </div>
    <Link to="/tasks" style={{ ...iconBtn, color: 'var(--text-secondary)', textDecoration: 'none' }}>
      <ArrowRight size={14} />
    </Link>
  </div>
);

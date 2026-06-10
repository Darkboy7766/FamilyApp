import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import type { Task } from '../types';
import { Trash2, Pencil, CheckSquare, ClipboardList } from 'lucide-react';
import { format, parseISO, isToday, isPast, isFuture, startOfDay } from 'date-fns';
import { bg } from 'date-fns/locale';
import { CreateEntityModal } from '../components/CreateEntityModal';
import type { EditData } from '../components/CreateEntityModal';

export const Tasks: React.FC = () => {
  const { tasks, people, loading, updateTask, deleteTask } = useData();
  const { addToast } = useToast();
  const [editData, setEditData] = useState<EditData | undefined>();
  const [showDone, setShowDone] = useState(false);

  if (loading) return <div className="animate-fade-in" style={{ padding: '2rem', textAlign: 'center' }}>Зареждане...</div>;

  const visibleTasks = tasks;

  const getPersonName = (ids?: string[]) => {
    if (!ids || ids.length === 0) return null;
    return ids.map(id => people.find(p => p.id === id)?.name ?? 'Някой').join(', ');
  };

  const handleToggle = async (task: Task) => {
    const ok = await updateTask(task.id, { done: !task.done });
    if (!ok) addToast('Грешка при обновяване.', 'error');
  };

  const handleDelete = async (task: Task) => {
    if (!window.confirm(`Изтрий „${task.title}"?`)) return;
    const ok = await deleteTask(task.id);
    if (!ok) addToast('Грешка при изтриване.', 'error');
  };

  const undone = visibleTasks.filter(t => !t.done);
  const done   = visibleTasks.filter(t => t.done);

  const today    = undone.filter(t => t.dueDate && isToday(parseISO(t.dueDate)));
  const overdue  = undone.filter(t => t.dueDate && isPast(startOfDay(parseISO(t.dueDate))) && !isToday(parseISO(t.dueDate)));
  const upcoming = undone.filter(t => t.dueDate && isFuture(startOfDay(parseISO(t.dueDate))) && !isToday(parseISO(t.dueDate)));
  const noDate   = undone.filter(t => !t.dueDate);

  const doneCount = done.length;
  const totalCount = visibleTasks.length;

  const TaskItem: React.FC<{ task: Task }> = ({ task }) => {
    const isOverdue = task.dueDate && isPast(startOfDay(parseISO(task.dueDate))) && !isToday(parseISO(task.dueDate));
    const personName = getPersonName(task.personIds);

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', background: task.done ? 'transparent' : 'var(--panel-bg)', borderRadius: '16px', border: '1px solid var(--panel-border)', marginBottom: '0.5rem', transition: 'var(--transition)', opacity: task.done ? 0.55 : 1 }}>
        {/* Checkbox — large touch target */}
        <button
          onClick={() => handleToggle(task)}
          style={{ width: 28, height: 28, borderRadius: '8px', border: `2px solid ${task.done ? 'var(--accent-color)' : 'var(--panel-border)'}`, background: task.done ? 'var(--accent-color)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'var(--transition)', padding: 0 }}
          title={task.done ? 'Маркирай като незавършена' : 'Маркирай като завършена'}
        >
          {task.done && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </button>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: task.done ? 'line-through' : 'none', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {task.title}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2px', flexWrap: 'wrap' }}>
            {personName && <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{personName}</span>}
            {task.dueDate && (
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: isOverdue ? 'var(--danger-color)' : 'var(--text-secondary)' }}>
                {isOverdue ? '⚠ ' : ''}{format(parseISO(task.dueDate), 'd MMM', { locale: bg })}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {!task.done && (
          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
            <button onClick={() => setEditData({ tab: 'task', id: task.id, title: task.title, dueDate: task.dueDate ?? '', taskPersonId: task.personIds?.[0] ?? '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: '6px', borderRadius: '8px' }} title="Редактирай"><Pencil size={15} /></button>
            <button onClick={() => handleDelete(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)', display: 'flex', padding: '6px', borderRadius: '8px' }} title="Изтрий"><Trash2 size={15} /></button>
          </div>
        )}
        {task.done && (
          <button onClick={() => handleDelete(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)', display: 'flex', padding: '6px', borderRadius: '8px', flexShrink: 0 }} title="Изтрий"><Trash2 size={15} /></button>
        )}
      </div>
    );
  };

  const Section: React.FC<{ title: string; items: Task[]; color?: string }> = ({ title, items, color }) => {
    if (items.length === 0) return null;
    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: color ?? 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.625rem' }}>{title}</div>
        {items.map(t => <TaskItem key={t.id} task={t} />)}
      </div>
    );
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '14px', background: 'var(--card-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckSquare size={22} color="#3b82f6" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Задачи</h2>
            {totalCount > 0 && <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '1px' }}>{doneCount} от {totalCount} изпълнени</div>}
          </div>
        </div>
        {totalCount > 0 && (
          <div style={{ height: 6, width: 80, background: 'var(--panel-border)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${totalCount ? (doneCount / totalCount) * 100 : 0}%`, background: 'var(--accent-color)', borderRadius: 3, transition: 'width 0.4s' }} />
          </div>
        )}
      </div>

      {/* Empty state */}
      {visibleTasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
          <ClipboardList size={48} color="var(--panel-border)" style={{ margin: '0 auto 1rem' }} />
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Няма задачи</p>
          <p style={{ fontSize: '0.85rem', margin: 0 }}>
            Натисни + за да добавиш.{' '}
            <br />
          </p>
        </div>
      )}

      {/* Task groups */}
      {visibleTasks.length > 0 && (
        <div>
          <Section title="Просрочени" items={overdue} color="var(--danger-color)" />
          <Section title="Днес" items={today} color="var(--warning-color)" />
          <Section title="Предстоящи" items={upcoming} />
          <Section title="Без краен срок" items={noDate} />

          {/* Done section */}
          {doneCount > 0 && (
            <div>
              <button onClick={() => setShowDone(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 0 0.625rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {showDone ? '▾' : '▸'} Изпълнени ({doneCount})
              </button>
              {showDone && done.map(t => <TaskItem key={t.id} task={t} />)}
            </div>
          )}
        </div>
      )}

      <CreateEntityModal
        isOpen={!!editData}
        onClose={() => setEditData(undefined)}
        editData={editData}
      />
    </div>
  );
};

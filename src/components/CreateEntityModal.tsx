import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import type { FamilyRole } from '../types';

export type EditData =
  | { tab: 'person';  id: string; name: string; phone: string; role?: FamilyRole }
  | { tab: 'event';   id: string; eventType: string; eventDate: string; eventPersonId: string }
  | { tab: 'routine'; id: string; medication: string; time: string; routinePersonId: string }
  | { tab: 'task';    id: string; title: string; dueDate: string; taskPersonId: string };

const ROLES: FamilyRole[] = ['Майка', 'Баща', 'Дете', 'Баба', 'Дядо', 'Брат', 'Сестра'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editData?: EditData;
}

export const CreateEntityModal: React.FC<Props> = ({ isOpen, onClose, editData }) => {
  const isEdit = !!editData;
  const { people, addPerson, addEvent, addRoutine, addTask, updatePerson, updateEvent, updateRoutine, updateTask } = useData();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [tab, setTab]               = useState<'person' | 'event' | 'routine' | 'task'>('person');
  const [name, setName]             = useState('');
  const [phone, setPhone]           = useState('');
  const [role, setRole]             = useState<FamilyRole | ''>('');
  const [eventType, setEventType]   = useState('🎂 Рожден ден');
  const [eventDate, setEventDate]   = useState('');
  const [eventPerson, setEventPerson]     = useState('');
  const [medication, setMedication] = useState('');
  const [time, setTime]             = useState('');
  const [routinePerson, setRoutinePerson] = useState('');
  const [taskTitle, setTaskTitle]   = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPerson, setTaskPerson] = useState('');

  // Sync form with editData whenever the modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (editData) {
      setTab(editData.tab);
      if (editData.tab === 'person') {
        setName(editData.name);
        setPhone(editData.phone);
        setRole(editData.role ?? '');
      } else if (editData.tab === 'event') {
        setEventType(editData.eventType);
        setEventDate(editData.eventDate);
        setEventPerson(editData.eventPersonId);
      } else if (editData.tab === 'routine') {
        setMedication(editData.medication);
        setTime(editData.time);
        setRoutinePerson(editData.routinePersonId);
      } else if (editData.tab === 'task') {
        setTaskTitle(editData.title);
        setTaskDueDate(editData.dueDate);
        setTaskPerson(editData.taskPersonId);
      }
    } else {
      setTab('person');
      setName(''); setPhone(''); setRole('');
      setEventType('🎂 Рожден ден'); setEventDate(''); setEventPerson('');
      setMedication(''); setTime(''); setRoutinePerson('');
      setTaskTitle(''); setTaskDueDate(''); setTaskPerson('');
    }
  }, [isOpen, editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let success = false;

    if (tab === 'person') {
      success = isEdit
        ? await updatePerson(editData!.id, { name, phone, role: role || undefined })
        : await addPerson({ name, phone, role: role || undefined });
    } else if (tab === 'event') {
      const payload = { type: eventType, date: eventDate, personIds: eventPerson ? [eventPerson] : [] };
      success = isEdit
        ? await updateEvent(editData!.id, payload)
        : await addEvent(payload);
    } else if (tab === 'routine') {
      const payload = { medication, time, personIds: routinePerson ? [routinePerson] : [] };
      success = isEdit
        ? await updateRoutine(editData!.id, payload)
        : await addRoutine(payload);
    } else {
      const payload = { title: taskTitle, dueDate: taskDueDate || undefined, personIds: taskPerson ? [taskPerson] : [] };
      success = isEdit
        ? await updateTask(editData!.id, payload)
        : await addTask(payload);
    }

    setLoading(false);
    if (success) {
      addToast(isEdit ? 'Промените са запазени!' : 'Успешно добавено!', 'success');
      onClose();
    } else {
      addToast('Грешка при запис. Проверете връзката с Airtable.', 'error');
    }
  };

  const selectStyle: React.CSSProperties = {
    background: 'var(--bg-color)',
    border: '1px solid var(--panel-border)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    outline: 'none',
    width: '100%',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Редактиране' : 'Добавяне на нов запис'}>
      {/* Tab switcher — hidden in edit mode since tab is fixed */}
      {!isEdit && (
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-color)', padding: '6px', borderRadius: '14px' }}>
          {(['person', 'event', 'routine', 'task'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{ flex: 1, padding: '10px', border: 'none', background: tab === t ? 'var(--accent-color)' : 'transparent', color: tab === t ? '#fff' : 'var(--text-secondary)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, transition: 'var(--transition)' }}
            >
              {t === 'person' ? 'Човек' : t === 'event' ? 'Събитие' : t === 'routine' ? 'Рутина' : 'Задача'}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {tab === 'person' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input label="Иìе" value={name} onChange={e => setName(e.target.value)} required placeholder="Пр: Иван Иванов" />
            <Input label="Телефон" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0888..." />
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>Семейна роля</label>
              <select style={selectStyle} value={role} onChange={e => setRole(e.target.value as FamilyRole | '')}>
                <option value="">-- Без роля --</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        )}

        {tab === 'event' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input label="Тип събитие" value={eventType} onChange={e => setEventType(e.target.value)} required placeholder="Рожден ден, Годишнина..." />
            <Input label="Дата" type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} required />
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>Свързан човек</label>
              <select style={selectStyle} value={eventPerson} onChange={e => setEventPerson(e.target.value)} required>
                <option value="">-- Избери човек --</option>
                {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {tab === 'routine' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input label="Лекарство или Диета" value={medication} onChange={e => setMedication(e.target.value)} required placeholder="Пр: Прием на Аспирин" />
            <Input label="Час (HH:mm)" type="time" value={time} onChange={e => setTime(e.target.value)} required />
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>Свързан човек</label>
              <select style={selectStyle} value={routinePerson} onChange={e => setRoutinePerson(e.target.value)} required>
                <option value="">-- Избери човек --</option>
                {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {tab === 'task' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input label="Задача" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required placeholder="Пр: Купи лекарства" />
            <Input label="Краен срок (незадължително)" type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} />
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>За кого (незадължително)</label>
              <select style={selectStyle} value={taskPerson} onChange={e => setTaskPerson(e.target.value)}>
                <option value="">-- Всички --</option>
                {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
        )}

        <div style={{ marginTop: '0.5rem' }}>
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Записване...' : isEdit ? 'Запази промените' : 'Запази'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

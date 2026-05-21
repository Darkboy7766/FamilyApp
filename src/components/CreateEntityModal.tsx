import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useUser } from '../context/UserContext';
import type { ExpenseCategory } from '../types';
import { EXPENSE_CATEGORIES, FAMILY_COLORS } from '../types';

export type EditData =
  | { tab: 'person';  id: string; name: string; phone: string; email?: string; familyIds?: string[]; birthDate?: string }
  | { tab: 'event';   id: string; eventType: string; eventDate: string; eventPersonIds: string[] }
  | { tab: 'routine'; id: string; medication: string; time: string; routinePersonId: string }
  | { tab: 'task';    id: string; title: string; dueDate: string; taskPersonId: string }
  | { tab: 'expense'; id: string; amount: number; category: string; date: string; paidById: string };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editData?: EditData;
}

export const CreateEntityModal: React.FC<Props> = ({ isOpen, onClose, editData }) => {
  const isEdit = !!editData;
  const { families, people, addPerson, addEvent, addRoutine, addTask, addExpense, updatePerson, updateEvent, updateRoutine, updateTask, updateExpense } = useData();
  const { addToast } = useToast();
  const { currentUser } = useUser();
  const [loading, setLoading] = useState(false);

  const [tab, setTab]               = useState<'person' | 'event' | 'routine' | 'task' | 'expense'>('person');
  const [name, setName]             = useState('');
  const [phone, setPhone]           = useState('');
  const [email, setEmail]           = useState('');
  const [selectedFamilyIds, setSelectedFamilyIds] = useState<string[]>([]);
  const [pin, setPin]               = useState('');
  const [birthDate, setBirthDate]   = useState('');
  const [eventType, setEventType]   = useState('🎂 Рожден ден');
  const [eventDate, setEventDate]   = useState('');
  const [eventPersonIds, setEventPersonIds] = useState<string[]>([]);
  const [medication, setMedication] = useState('');
  const [time, setTime]             = useState('');
  const [routinePerson, setRoutinePerson] = useState('');
  const [taskTitle, setTaskTitle]   = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPerson, setTaskPerson] = useState('');
  const [expenseAmount, setExpenseAmount]     = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>(EXPENSE_CATEGORIES[0]);
  const [expenseDate, setExpenseDate]         = useState('');
  const [expensePaidBy, setExpensePaidBy]     = useState('');

  // Sync form with editData whenever the modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (editData) {
      setTab(editData.tab);
      if (editData.tab === 'person') {
        setName(editData.name);
        setPhone(editData.phone);
        setEmail(editData.email ?? '');
        setSelectedFamilyIds(editData.familyIds ?? []);
        setBirthDate(editData.birthDate ?? '');
        setPin('');
      } else if (editData.tab === 'event') {
        setEventType(editData.eventType);
        setEventDate(editData.eventDate);
        setEventPersonIds(editData.eventPersonIds);
      } else if (editData.tab === 'routine') {
        setMedication(editData.medication);
        setTime(editData.time);
        setRoutinePerson(editData.routinePersonId);
      } else if (editData.tab === 'task') {
        setTaskTitle(editData.title);
        setTaskDueDate(editData.dueDate);
        setTaskPerson(editData.taskPersonId);
      } else if (editData.tab === 'expense') {
        setExpenseAmount(String(editData.amount));
        setExpenseCategory(editData.category as typeof EXPENSE_CATEGORIES[number]);
        setExpenseDate(editData.date);
        setExpensePaidBy(editData.paidById);
      }
    } else {
      setTab('person');
      setName(''); setPhone(''); setEmail(''); setSelectedFamilyIds([]); setPin(''); setBirthDate('');
      setEventType('🎂 Рожден ден'); setEventDate(''); setEventPersonIds([]);
      setMedication(''); setTime(''); setRoutinePerson('');
      setTaskTitle(''); setTaskDueDate(''); setTaskPerson(currentUser?.id ?? '');
      setExpenseAmount(''); setExpenseCategory(EXPENSE_CATEGORIES[0]); setExpenseDate(''); setExpensePaidBy(currentUser?.id ?? '');
    }
  }, [isOpen, editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let success = false;

    if (tab === 'person') {
      success = isEdit
        ? await updatePerson(editData!.id, { name, phone, email: email || undefined, familyIds: selectedFamilyIds, pin: pin || undefined, birthDate: birthDate || undefined })
        : await addPerson({ name, phone, email: email || undefined, familyIds: selectedFamilyIds, pin: pin || undefined, birthDate: birthDate || undefined });
    } else if (tab === 'event') {
      const payload = { type: eventType, date: eventDate, personIds: eventPersonIds };
      success = isEdit
        ? await updateEvent(editData!.id, payload)
        : await addEvent(payload);
    } else if (tab === 'routine') {
      const payload = { medication, time, personIds: routinePerson ? [routinePerson] : [] };
      success = isEdit
        ? await updateRoutine(editData!.id, payload)
        : await addRoutine(payload);
    } else if (tab === 'task') {
      const payload = { title: taskTitle, dueDate: taskDueDate || undefined, personIds: taskPerson ? [taskPerson] : [] };
      success = isEdit
        ? await updateTask(editData!.id, payload)
        : await addTask(payload);
    } else {
      const payload = { amount: parseFloat(expenseAmount) || 0, category: expenseCategory, date: expenseDate, paidById: expensePaidBy || undefined };
      success = isEdit
        ? await updateExpense(editData!.id, payload)
        : await addExpense(payload);
    }

    setLoading(false);
    if (success) {
      addToast(isEdit ? 'Промените са запазени!' : 'Успешно добавено!', 'success');
      onClose();
    } else {
      addToast('Грешка при запис. Проверете връзката с Baserow.', 'error');
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
        <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-color)', padding: '6px', borderRadius: '14px', flexWrap: 'wrap' }}>
          {(['person', 'event', 'routine', 'task', 'expense'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{ flex: 1, minWidth: 0, padding: '8px 4px', border: 'none', background: tab === t ? 'var(--accent-color)' : 'transparent', color: tab === t ? '#fff' : 'var(--text-secondary)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', transition: 'var(--transition)' }}
            >
              {t === 'person' ? 'Човек' : t === 'event' ? 'Събитие' : t === 'routine' ? 'Рутина' : t === 'task' ? 'Задача' : 'Разход'}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {tab === 'person' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input label="Име" value={name} onChange={e => setName(e.target.value)} required placeholder="Пр: Мики Маус" />
            <Input label="Телефон" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0888..." />
            <Input label="Имейл (за известия)" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="miki@example.com" />
            <Input label="Дата на раждане" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>Семейство</label>
              {families.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Няма семейства — добави от Контакти.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {families.map(f => {
                    const active = selectedFamilyIds.includes(f.id);
                    const c = FAMILY_COLORS[f.color] ?? FAMILY_COLORS.blue;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFamilyIds(active ? selectedFamilyIds.filter(id => id !== f.id) : [...selectedFamilyIds, f.id])}
                        style={{ padding: '6px 14px', borderRadius: '20px', border: `1.5px solid ${active ? c.text : 'var(--panel-border)'}`, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'var(--transition)', background: active ? c.bg : 'transparent', color: active ? c.text : 'var(--text-primary)' }}
                      >
                        {f.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <Input
              label={isEdit ? 'Нов PIN (4 цифри, остави празно за без промяна)' : 'PIN (4 цифри, незадължително)'}
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
            />
          </div>
        )}

        {tab === 'event' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input label="Тип събитие" value={eventType} onChange={e => setEventType(e.target.value)} required placeholder="Рожден ден, Годишнина..." />
            <Input label="Дата" type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} required />
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>Свързани хора</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEventPersonIds(eventPersonIds.length === people.length ? [] : people.map(p => p.id))}
                  style={{ padding: '6px 14px', borderRadius: '20px', border: '1.5px solid', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, transition: 'var(--transition)', borderColor: eventPersonIds.length === people.length ? 'var(--accent-color)' : 'var(--panel-border)', background: eventPersonIds.length === people.length ? 'var(--accent-color)' : 'transparent', color: eventPersonIds.length === people.length ? '#fff' : 'var(--text-secondary)' }}
                >
                  Всички
                </button>
                {people.map(p => {
                  const active = eventPersonIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setEventPersonIds(active ? eventPersonIds.filter(id => id !== p.id) : [...eventPersonIds, p.id])}
                      style={{ padding: '6px 14px', borderRadius: '20px', border: '1.5px solid', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'var(--transition)', borderColor: active ? 'var(--accent-color)' : 'var(--panel-border)', background: active ? 'var(--accent-color)' : 'transparent', color: active ? '#fff' : 'var(--text-primary)' }}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
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
            <Input label="Задача" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required placeholder="Пр: Купи сладолед" />
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

        {tab === 'expense' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input label="Сума (€)" type="number" inputMode="decimal" min="0" step="0.01" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} required placeholder="Пр: 25.50" />
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>Категория</label>
              <select style={selectStyle} value={expenseCategory} onChange={e => setExpenseCategory(e.target.value as typeof EXPENSE_CATEGORIES[number])}>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Input label="Дата" type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} required />
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>Платил (незадължително)</label>
              <select style={selectStyle} value={expensePaidBy} onChange={e => setExpensePaidBy(e.target.value)}>
                <option value="">-- Не е посочено --</option>
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

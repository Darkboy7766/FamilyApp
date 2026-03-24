import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';

export const CreateEntityModal: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'person' | 'event' | 'routine'>('person');
  const { people, addPerson, addEvent, addRoutine } = useData();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  // States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [eventType, setEventType] = useState('🎂 Рожден ден');
  const [eventDate, setEventDate] = useState('');
  const [eventPerson, setEventPerson] = useState('');
  
  const [medication, setMedication] = useState('');
  const [time, setTime] = useState('');
  const [routinePerson, setRoutinePerson] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let success = false;
    
    if (tab === 'person') {
      success = await addPerson({ name, phone });
      if (success) { setName(''); setPhone(''); }
    } else if (tab === 'event') {
      success = await addEvent({ type: eventType, date: eventDate, personIds: eventPerson ? [eventPerson] : [] });
      if (success) { setEventType('🎂 Рожден ден'); setEventDate(''); setEventPerson(''); }
    } else {
      success = await addRoutine({ medication, time, personIds: routinePerson ? [routinePerson] : [] });
      if (success) { setMedication(''); setTime(''); setRoutinePerson(''); }
    }

    setLoading(false);
    if (success) {
      addToast('Успешно добавено!', 'success');
      onClose();
    } else {
      addToast('Грешка при запис. Проверете връзката с Airtable.', 'error');
    }
  };

  const selectStyle = {
    background: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--panel-border)',
    borderRadius: '8px', padding: '10px 14px', color: 'var(--text-primary)',
    fontSize: '0.95rem', outline: 'none', width: '100%', marginBottom: '1rem'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Добавяне на нов запис">
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '14px' }}>
        <button type="button" onClick={() => setTab('person')} style={{ flex: 1, padding: '10px', border: 'none', background: tab === 'person' ? 'var(--accent-color)' : 'transparent', color: tab === 'person' ? '#fff' : 'var(--text-secondary)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, transition: 'var(--transition)' }}>Човек</button>
        <button type="button" onClick={() => setTab('event')} style={{ flex: 1, padding: '10px', border: 'none', background: tab === 'event' ? 'var(--accent-color)' : 'transparent', color: tab === 'event' ? '#fff' : 'var(--text-secondary)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, transition: 'var(--transition)' }}>Събитие</button>
        <button type="button" onClick={() => setTab('routine')} style={{ flex: 1, padding: '10px', border: 'none', background: tab === 'routine' ? 'var(--accent-color)' : 'transparent', color: tab === 'routine' ? '#fff' : 'var(--text-secondary)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, transition: 'var(--transition)' }}>Рутина</button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {tab === 'person' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input label="Име" value={name} onChange={e => setName(e.target.value)} required placeholder="Пр: Иван Иванов" />
            <Input label="Телефон" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0888..." />
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

        <div style={{ marginTop: '1rem' }}>
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Записване...' : 'Запази'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

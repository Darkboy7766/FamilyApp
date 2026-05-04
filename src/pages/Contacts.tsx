import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { User, Trash2, Pencil, Search, Camera } from 'lucide-react';
import type { Person, EventRecord, Routine, FamilyRole } from '../types';
import { CreateEntityModal } from '../components/CreateEntityModal';
import type { EditData } from '../components/CreateEntityModal';
import { airtableApi } from '../api/airtable';

const ROLE_COLORS: Record<FamilyRole, { bg: string; color: string }> = {
  'Майка':  { bg: '#fce7f3', color: '#be185d' },
  'Баща':   { bg: '#dbeafe', color: '#1d4ed8' },
  'Дете':   { bg: '#d1fae5', color: '#065f46' },
  'Баба':   { bg: '#fef3c7', color: '#92400e' },
  'Дядо':   { bg: '#ede9fe', color: '#5b21b6' },
  'Брат':   { bg: '#e0f2fe', color: '#0369a1' },
  'Сестра': { bg: '#fdf4ff', color: '#a21caf' },
};

export const Contacts: React.FC = () => {
  const { people, loading, deletePerson, refreshData } = useData();
  const { addToast } = useToast();
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [editData, setEditData] = useState<EditData | undefined>();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetId = useRef<string | null>(null);

  const triggerUpload = (personId: string) => {
    uploadTargetId.current = personId;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const personId = uploadTargetId.current;
    e.target.value = '';
    if (!file || !personId) return;
    setUploadingId(personId);
    const url = await airtableApi.uploadPersonPhoto(personId, file);
    if (url) {
      await refreshData();
      addToast('Снимката е качена!', 'success');
    } else {
      addToast('Грешка при качване на снимка.', 'error');
    }
    setUploadingId(null);
    uploadTargetId.current = null;
  };

  if (loading) return <div className="animate-fade-in" style={{ padding: '2rem', textAlign: 'center' }}>Зареждане на данни...</div>;

  const filtered = query.trim()
    ? people.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.phone && p.phone.includes(query))
      )
    : people;

  const handleDeletePerson = async (person: Person) => {
    if (!window.confirm(`Изтрий ${person.name}? Свързаните събития и рутини ще останат в базата.`)) return;
    if (selectedPerson === person.id) setSelectedPerson(null);
    const ok = await deletePerson(person.id);
    if (!ok) addToast('Грешка при изтриване.', 'error');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ position: 'relative', maxWidth: '400px' }}>
        <Search size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Търси по име или телефон..."
          style={{ width: '100%', padding: '10px 14px 10px 42px', borderRadius: '16px', border: '1px solid var(--panel-border)', background: 'var(--panel-bg)', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {filtered.map((person: Person) => (
          <Card key={person.id} style={{ cursor: 'pointer', transition: 'transform 0.2s', transform: selectedPerson === person.id ? 'scale(1.02)' : 'none', border: selectedPerson === person.id ? '1px solid var(--accent-color)' : '' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div onClick={() => setSelectedPerson(person.id === selectedPerson ? null : person.id)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {uploadingId === person.id
                      ? <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid var(--accent-color)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                      : person.photoUrl
                        ? <img src={person.photoUrl} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <User size={28} color="var(--text-secondary)" />
                    }
                  </div>
                  <button
                    onClick={ev => { ev.stopPropagation(); triggerUpload(person.id); }}
                    title="Качи снимка"
                    style={{ position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: '50%', background: 'var(--accent-color)', border: '2px solid var(--panel-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Camera size={11} color="#fff" />
                  </button>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{person.name || 'Безименен'}</h3>
                    {person.role && (
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', background: ROLE_COLORS[person.role].bg, color: ROLE_COLORS[person.role].color }}>
                        {person.role}
                      </span>
                    )}
                  </div>
                  {person.phone && <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{person.phone}</p>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <button
                  onClick={() => setEditData({ tab: 'person', id: person.id, name: person.name, phone: person.phone ?? '', role: person.role })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: '8px', borderRadius: '8px' }}
                  title="Редактирай"
                >
                  <Pencil size={17} />
                </button>
                <button
                  onClick={() => handleDeletePerson(person)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)', display: 'flex', padding: '8px', borderRadius: '8px' }}
                  title="Изтрий"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {people.length === 0 && <p>Няма добавени хора.</p>}
        {people.length > 0 && filtered.length === 0 && <p>Няма резултати за „{query}".</p>}
      </div>

      {selectedPerson && (
        <PersonDetail personId={selectedPerson} onEdit={setEditData} />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <CreateEntityModal
        isOpen={!!editData}
        onClose={() => setEditData(undefined)}
        editData={editData}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const PersonDetail: React.FC<{ personId: string; onEdit: (d: EditData) => void }> = ({ personId, onEdit }) => {
  const { events, routines, people, deleteEvent, deleteRoutine } = useData();
  const { addToast } = useToast();
  const person = people.find((p: Person) => p.id === personId);
  const personEvents = events.filter((e: EventRecord) => e.personIds?.includes(personId));
  const personRoutines = routines.filter((r: Routine) => r.personIds?.includes(personId));

  if (!person) return null;

  const handleDeleteEvent = async (e: EventRecord) => {
    if (!window.confirm(`Изтрий "${e.type}"?`)) return;
    const ok = await deleteEvent(e.id);
    if (!ok) addToast('Грешка при изтриване.', 'error');
  };

  const handleDeleteRoutine = async (r: Routine) => {
    if (!window.confirm(`Изтрий "${r.medication}"?`)) return;
    const ok = await deleteRoutine(r.id);
    if (!ok) addToast('Грешка при изтриване.', 'error');
  };

  return (
    <Card className="animate-fade-in" style={{ marginTop: '1rem', borderTop: '4px solid var(--accent-color)' }} title={`Детайлен профил: ${person.name}`}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>

        <div>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Свързани Събития</h4>
          {personEvents.length === 0 ? <p style={{ fontSize: '0.9rem' }}>Няма събития.</p> : personEvents.map((e: EventRecord) => (
            <div key={e.id} className="flex-between" style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '12px', marginBottom: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#1e293b' }}>{e.type}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{e.date}</div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={() => onEdit({ tab: 'event', id: e.id, eventType: e.type, eventDate: e.date ?? '', eventPersonId: e.personIds?.[0] ?? '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: '4px' }} title="Редактирай"><Pencil size={14} /></button>
                <button onClick={() => handleDeleteEvent(e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)', display: 'flex', padding: '4px' }} title="Изтрий"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Рутини и Лекарства</h4>
          {personRoutines.length === 0 ? <p style={{ fontSize: '0.9rem' }}>Няма рутини.</p> : personRoutines.map((r: Routine) => (
            <div key={r.id} className="flex-between" style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '12px', marginBottom: '0.5rem' }}>
              <div style={{ fontWeight: 700, color: '#1e293b' }}>{r.medication}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ color: 'var(--accent-color)', fontWeight: 700, fontSize: '0.85rem' }}>{r.time}</div>
                <button onClick={() => onEdit({ tab: 'routine', id: r.id, medication: r.medication, time: r.time, routinePersonId: r.personIds?.[0] ?? '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: '4px' }} title="Редактирай"><Pencil size={14} /></button>
                <button onClick={() => handleDeleteRoutine(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)', display: 'flex', padding: '4px' }} title="Изтрий"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </Card>
  );
};

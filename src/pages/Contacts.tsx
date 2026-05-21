import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { User, Trash2, Pencil, Search, Camera } from 'lucide-react';
import type { Person, EventRecord, Routine, Family } from '../types';
import { FAMILY_COLORS, PALETTE_KEYS } from '../types';
import { CreateEntityModal } from '../components/CreateEntityModal';
import type { EditData } from '../components/CreateEntityModal';
import { baserowApi as airtableApi } from '../api/baserow';

export const Contacts: React.FC = () => {
  const { families, people, loading, addFamily, deleteFamily, deletePerson, refreshData } = useData();
  const { addToast } = useToast();
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [familyFilter, setFamilyFilter] = useState<string | null>(null);
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

  const byQuery = query.trim()
    ? people.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.phone && p.phone.includes(query))
      )
    : people;

  const filtered = familyFilter
    ? byQuery.filter(p => p.familyIds?.includes(familyFilter))
    : byQuery;

  const handleDeletePerson = async (person: Person) => {
    if (!window.confirm(`Изтрий ${person.name}? Свързаните събития и рутини ще останат в базата.`)) return;
    if (selectedPerson === person.id) setSelectedPerson(null);
    const ok = await deletePerson(person.id);
    if (!ok) addToast('Грешка при изтриване.', 'error');
  };

  const handleDeleteFamily = async (id: string) => {
    const ok = await deleteFamily(id);
    if (!ok) addToast('Грешка при изтриване на семейство.', 'error');
    if (familyFilter === id) setFamilyFilter(null);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <FamiliesPanel
        families={families}
        activeFamily={familyFilter}
        onFilter={setFamilyFilter}
        onAdd={addFamily}
        onDelete={handleDeleteFamily}
      />

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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{person.name || 'Безименен'}</h3>
                    {families.filter(f => person.familyIds?.includes(f.id)).map(f => {
                      const c = FAMILY_COLORS[f.color] ?? FAMILY_COLORS.blue;
                      return (
                        <span key={f.id} style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', background: c.bg, color: c.text, whiteSpace: 'nowrap' }}>
                          {f.name}
                        </span>
                      );
                    })}
                  </div>
                  {person.phone && <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{person.phone}</p>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <button
                  onClick={() => setEditData({ tab: 'person', id: person.id, name: person.name, phone: person.phone ?? '', email: person.email ?? '', familyIds: person.familyIds, birthDate: person.birthDate ?? '' })}
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

const FamiliesPanel: React.FC<{
  families: Family[];
  activeFamily: string | null;
  onFilter: (id: string | null) => void;
  onAdd: (data: Pick<Family, 'name' | 'color'>) => Promise<boolean>;
  onDelete: (id: string) => Promise<void>;
}> = ({ families, activeFamily, onFilter, onAdd, onDelete }) => {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('blue');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await onAdd({ name: newName.trim(), color: newColor });
    setSaving(false);
    setNewName('');
    setNewColor('blue');
    setAdding(false);
  };

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 }}>Семейства:</span>

        <button
          type="button"
          onClick={() => onFilter(null)}
          style={{ padding: '5px 14px', borderRadius: '20px', border: '1.5px solid', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, transition: 'var(--transition)', borderColor: activeFamily === null ? 'var(--accent-color)' : 'var(--panel-border)', background: activeFamily === null ? 'var(--accent-color)' : 'transparent', color: activeFamily === null ? '#fff' : 'var(--text-secondary)' }}
        >
          Всички
        </button>

        {families.map(f => {
          const c = FAMILY_COLORS[f.color] ?? FAMILY_COLORS.blue;
          const isActive = activeFamily === f.id;
          return (
            <div key={f.id} style={{ display: 'flex', alignItems: 'stretch' }}>
              <button
                type="button"
                onClick={() => onFilter(isActive ? null : f.id)}
                style={{ padding: '5px 12px', borderRadius: '20px 0 0 20px', border: '1.5px solid', borderRight: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, transition: 'var(--transition)', borderColor: isActive ? c.text : 'var(--panel-border)', background: isActive ? c.bg : 'transparent', color: isActive ? c.text : 'var(--text-primary)' }}
              >
                {f.name}
              </button>
              <button
                type="button"
                onClick={() => window.confirm(`Изтрий семейство „${f.name}"?`) && onDelete(f.id)}
                title="Изтрий семейство"
                style={{ padding: '5px 9px', borderRadius: '0 20px 20px 0', border: '1.5px solid', borderLeft: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, background: 'transparent', color: 'var(--text-secondary)', borderColor: isActive ? c.text : 'var(--panel-border)', transition: 'var(--transition)', lineHeight: 1 }}
              >
                ×
              </button>
            </div>
          );
        })}

        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            style={{ padding: '5px 12px', borderRadius: '20px', border: '1.5px dashed var(--panel-border)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: 'transparent', color: 'var(--text-secondary)', transition: 'var(--transition)' }}
          >
            + Добави
          </button>
        )}
      </div>

      {adding && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--panel-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Например: Иванови, Петрови..."
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--panel-border)', background: 'var(--panel-bg)', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Цвят:</span>
            {PALETTE_KEYS.map(key => {
              const c = FAMILY_COLORS[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNewColor(key)}
                  title={key}
                  style={{ width: 26, height: 26, borderRadius: '50%', background: c.bg, border: newColor === key ? `3px solid ${c.text}` : '2px solid transparent', outline: newColor === key ? `2px solid ${c.text}` : 'none', outlineOffset: '2px', cursor: 'pointer', flexShrink: 0, transition: 'outline 0.15s' }}
                />
              );
            })}
          </div>
          {newColor && (
            <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '20px', background: FAMILY_COLORS[newColor].bg, color: FAMILY_COLORS[newColor].text, fontSize: '0.82rem', fontWeight: 700, alignSelf: 'flex-start' }}>
              {newName || 'Преглед'}
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newName.trim() || saving}
              style={{ padding: '7px 18px', borderRadius: '8px', background: 'var(--accent-color)', color: '#fff', border: 'none', cursor: newName.trim() && !saving ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '0.85rem', opacity: !newName.trim() || saving ? 0.6 : 1 }}
            >
              {saving ? 'Записва...' : 'Запази'}
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setNewName(''); setNewColor('blue'); }}
              style={{ padding: '7px 16px', borderRadius: '8px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--panel-border)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
            >
              Отказ
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};

const PersonDetail: React.FC<{ personId: string; onEdit: (d: EditData) => void }> = ({ personId, onEdit }) => {
  const { families, events, routines, people, updatePerson, deleteEvent, deleteRoutine } = useData();
  const { addToast } = useToast();
  const [savingFamily, setSavingFamily] = useState<string | null>(null);
  const person = people.find((p: Person) => p.id === personId);
  const personEvents = events.filter((e: EventRecord) => e.personIds?.includes(personId));
  const personRoutines = routines.filter((r: Routine) => r.personIds?.includes(personId));

  if (!person) return null;

  const toggleFamily = async (familyId: string) => {
    const current = person.familyIds ?? [];
    const next = current.includes(familyId)
      ? current.filter(id => id !== familyId)
      : [...current, familyId];
    setSavingFamily(familyId);
    await updatePerson(person.id, { familyIds: next });
    setSavingFamily(null);
  };

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

      {/* Family membership */}
      <div style={{ marginTop: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--panel-border)' }}>
        <h4 style={{ color: 'var(--text-primary)', margin: '0 0 0.75rem' }}>Семейства</h4>
        {families.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Няма създадени семейства.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {families.map(f => {
              const active = person.familyIds?.includes(f.id) ?? false;
              const c = FAMILY_COLORS[f.color] ?? FAMILY_COLORS.blue;
              const loading = savingFamily === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => !loading && toggleFamily(f.id)}
                  disabled={loading}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    border: `1.5px solid ${active ? c.text : 'var(--panel-border)'}`,
                    background: active ? c.bg : 'transparent',
                    color: active ? c.text : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: loading ? 'wait' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    transition: 'var(--transition)',
                  }}
                >
                  {loading ? '...' : (active ? `✓ ${f.name}` : f.name)}
                </button>
              );
            })}
          </div>
        )}
      </div>

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
                <button onClick={() => onEdit({ tab: 'event', id: e.id, eventType: e.type, eventDate: e.date ?? '', eventPersonIds: e.personIds ?? [] })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: '4px' }} title="Редактирай"><Pencil size={14} /></button>
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

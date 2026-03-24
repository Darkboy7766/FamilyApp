import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import { User } from 'lucide-react';
import type { Person, EventRecord, Routine } from '../types';

export const Contacts: React.FC = () => {
  const { people, loading } = useData();
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

  if (loading) return <div className="animate-fade-in" style={{ padding: '2rem', textAlign: 'center' }}>Зареждане на данни...</div>;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {people.map((person: Person) => (
          <Card key={person.id} style={{ cursor: 'pointer', transition: 'transform 0.2s', transform: selectedPerson === person.id ? 'scale(1.02)' : 'none', border: selectedPerson === person.id ? '1px solid var(--accent-color)' : '' }}>
            <div onClick={() => setSelectedPerson(person.id === selectedPerson ? null : person.id)} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {person.photoUrl ? <img src={person.photoUrl} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={28} color="var(--text-secondary)" />}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{person.name || 'Безименен'}</h3>
                {person.phone && <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{person.phone}</p>}
              </div>
            </div>
          </Card>
        ))}
        {people.length === 0 && <p>Няма добавени хора.</p>}
      </div>
      
      {/* Detailed Profile inline or separate but keeping it simple for now */}
      {selectedPerson && (
        <PersonDetail personId={selectedPerson} />
      )}
    </div>
  );
};

const PersonDetail: React.FC<{ personId: string }> = ({ personId }) => {
  const { events, routines, people } = useData();
  const person = people.find((p: Person) => p.id === personId);
  const personEvents = events.filter((e: EventRecord) => e.personIds?.includes(personId));
  const personRoutines = routines.filter((r: Routine) => r.personIds?.includes(personId));

  if (!person) return null;

  return (
    <Card className="animate-fade-in" style={{ marginTop: '1rem', borderTop: '4px solid var(--accent-color)' }} title={`Детайлен профил: ${person.name}`}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
        
        <div>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Свързани Събития</h4>
          {personEvents.length === 0 ? <p style={{ fontSize: '0.9rem' }}>Няма събития.</p> : personEvents.map((e: EventRecord) => (
            <div key={e.id} style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '12px', marginBottom: '0.5rem' }}>
              <div style={{ fontWeight: 700, color: '#1e293b' }}>{e.type}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{e.date}</div>
            </div>
          ))}
        </div>

        <div>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Рутини и Лекарства</h4>
          {personRoutines.length === 0 ? <p style={{ fontSize: '0.9rem' }}>Няма рутини.</p> : personRoutines.map((r: Routine) => (
            <div key={r.id} className="flex-between" style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '12px', marginBottom: '0.5rem' }}>
              <div style={{ fontWeight: 700, color: '#1e293b' }}>{r.medication}</div>
              <div style={{ color: 'var(--accent-color)', fontWeight: 700, fontSize: '0.85rem' }}>{r.time}</div>
            </div>
          ))}
        </div>

      </div>
    </Card>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { Users, User } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import type { Person } from '../types';

const PIN_LENGTH = 4;

export const UserGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { people, loading } = useData();
  const { currentUser, login } = useUser();
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-login if selected person has no PIN
  useEffect(() => {
    if (!selectedPerson) return;
    if ((selectedPerson.pin ?? '') === '') {
      login(selectedPerson.id, '');
    }
  }, [selectedPerson]);

  useEffect(() => {
    if (selectedPerson && (selectedPerson.pin ?? '') !== '') {
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
  }, [selectedPerson]);

  if (currentUser) return <>{children}</>;

  // ── Loading ──
  if (loading) return (
    <div style={screen}>
      <Users size={32} color="#0ea5e9" />
      <span style={appTitle}>Family CRM</span>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Зареждане...</div>
    </div>
  );

  // ── Step 2: PIN entry ──
  if (selectedPerson && (selectedPerson.pin ?? '') !== '') {
    const handleChange = (index: number, value: string) => {
      if (!/^\d?$/.test(value)) return;
      const next = [...digits];
      next[index] = value;
      setDigits(next);

      if (value && index < PIN_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      if (next.every(d => d !== '')) {
        const ok = login(selectedPerson.id, next.join(''));
        if (!ok) {
          setShake(true);
          setTimeout(() => {
            setShake(false);
            setDigits(Array(PIN_LENGTH).fill(''));
            inputRefs.current[0]?.focus();
          }, 600);
        }
      }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    };

    return (
      <div style={screen}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Users size={28} color="#0ea5e9" />
          <span style={appTitle}>Family CRM</span>
        </div>

        <div className="glass-panel" style={card}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--panel-border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {selectedPerson.photoUrl
              ? <img src={selectedPerson.photoUrl} alt={selectedPerson.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <User size={32} color="var(--text-secondary)" />
            }
          </div>

          <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            {selectedPerson.name}
          </p>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>
            Въведи PIN
          </p>

          <div style={{ display: 'flex', gap: '0.75rem' }} className={shake ? 'pin-shake' : ''}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digits[i]}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                style={{
                  width: 52, height: 60, textAlign: 'center',
                  fontSize: '1.6rem', fontWeight: 700,
                  border: `2px solid ${shake ? '#f43f5e' : 'var(--panel-border, #e2e8f0)'}`,
                  borderRadius: '14px', background: 'var(--card-bg, #fff)',
                  color: '#1e293b', outline: 'none', transition: 'border-color 0.2s',
                }}
              />
            ))}
          </div>

          {shake && (
            <p style={{ margin: 0, color: '#f43f5e', fontSize: '0.85rem', fontWeight: 600 }}>
              Грешен PIN
            </p>
          )}

          <button
            onClick={() => { setSelectedPerson(null); setDigits(Array(PIN_LENGTH).fill('')); }}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, padding: '4px 0' }}
          >
            ← Назад
          </button>
        </div>
      </div>
    );
  }

  // ── Step 1: Choose person ──
  return (
    <div style={screen}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <Users size={28} color="#0ea5e9" />
        <span style={appTitle}>Family CRM</span>
      </div>

      <div className="glass-panel" style={{ ...card, maxWidth: 480 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
          Кой си ти?
        </p>

        {people.length === 0 ? (
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Няма добавени хора в системата.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.75rem', width: '100%' }}>
            {people.map(person => (
              <button
                key={person.id}
                onClick={() => setSelectedPerson(person)}
                style={{
                  background: '#f8fafc',
                  border: '2px solid transparent',
                  borderRadius: '16px',
                  padding: '1rem 0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent-color)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'; }}
              >
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--panel-border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {person.photoUrl
                    ? <img src={person.photoUrl} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <User size={24} color="var(--text-secondary)" />
                  }
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', lineHeight: 1.3 }}>
                  {person.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const screen: React.CSSProperties = {
  minHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg-gradient, linear-gradient(135deg, #f0f4ff 0%, #fce4ec 100%))',
  gap: '1.25rem',
  padding: '1.5rem',
};

const appTitle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 800,
  color: '#1e293b',
};

const card: React.CSSProperties = {
  padding: '2rem',
  borderRadius: '24px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1.25rem',
  width: '100%',
};

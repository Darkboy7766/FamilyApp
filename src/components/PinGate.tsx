import React, { useState, useEffect, useRef } from 'react';
import { HeartPulse } from 'lucide-react';

const SESSION_KEY = 'familycrm_unlocked';
const CORRECT_PIN = import.meta.env.VITE_APP_PIN ?? '1234';
const PIN_LENGTH = CORRECT_PIN.length;

interface Props {
  children: React.ReactNode;
}

export function PinGate({ children }: Props) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!unlocked) setTimeout(() => inputRefs.current[0]?.focus(), 50);
  }, [unlocked]);

  if (unlocked) return <>{children}</>;

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);

    if (value && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (next.every(d => d !== '') && next.join('') !== '') {
      const entered = next.join('');
      if (entered === CORRECT_PIN) {
        sessionStorage.setItem(SESSION_KEY, '1');
        setUnlocked(true);
      } else {
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
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-gradient, linear-gradient(135deg, #f0f4ff 0%, #fce4ec 100%))',
      gap: '2rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <HeartPulse size={32} color="#f43f5e" />
        <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b' }}>Family CRM</span>
      </div>

      <div
        className="glass-panel"
        style={{
          padding: '2rem 2.5rem',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          minWidth: '260px',
        }}
      >
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.95rem' }}>
          Въведи PIN
        </p>

        <div
          style={{ display: 'flex', gap: '0.75rem' }}
          className={shake ? 'pin-shake' : ''}
        >
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
                width: '52px',
                height: '60px',
                textAlign: 'center',
                fontSize: '1.6rem',
                fontWeight: 700,
                border: `2px solid ${shake ? '#f43f5e' : 'var(--panel-border, #e2e8f0)'}`,
                borderRadius: '14px',
                background: 'var(--card-bg, #fff)',
                color: '#1e293b',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
          ))}
        </div>

        {shake && (
          <p style={{ margin: 0, color: '#f43f5e', fontSize: '0.85rem', fontWeight: 600 }}>
            Грешен PIN
          </p>
        )}
      </div>
    </div>
  );
}

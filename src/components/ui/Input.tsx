import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, style, ...props }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
      {label && <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</label>}
      <input
        style={{
          background: 'rgba(0, 0, 0, 0.2)',
          border: '1px solid var(--panel-border)',
          borderRadius: '8px',
          padding: '10px 14px',
          color: 'var(--text-primary)',
          fontSize: '0.95rem',
          outline: 'none',
          transition: 'var(--transition)',
          width: '100%',
          ...style
        }}
        onFocus={(e) => { e.target.style.borderColor = 'var(--accent-color)'; }}
        onBlur={(e) => { e.target.style.borderColor = 'var(--panel-border)'; }}
        {...props}
      />
    </div>
  );
};

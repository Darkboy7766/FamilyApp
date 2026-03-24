import React from 'react';
import type { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  title?: ReactNode;
  className?: string;
  style?: CSSProperties;
  variant?: 'pink' | 'blue' | 'yellow' | 'green' | 'white';
}

export const Card: React.FC<CardProps> = ({ children, title, className = '', style, variant = 'white' }) => {
  const getBackground = () => {
    switch(variant) {
      case 'pink': return 'var(--card-pink)';
      case 'blue': return 'var(--card-blue)';
      case 'yellow': return 'var(--card-yellow)';
      case 'green': return 'var(--card-green)';
      default: return 'var(--panel-bg)';
    }
  };

  return (
    <div className={`glass-panel ${className}`} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: getBackground(), border: variant === 'white' ? '1px solid var(--panel-border)' : 'none', ...style }}>
      {title && <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{title}</h3>}
      {children}
    </div>
  );
};

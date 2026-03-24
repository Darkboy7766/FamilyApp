import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', fullWidth, style, ...props }) => {
  const baseStyle: React.CSSProperties = {
    padding: '12px 24px',
    borderRadius: '9999px', /* Full rounded pill */
    fontWeight: 700,
    fontSize: '0.95rem',
    cursor: 'pointer',
    border: 'none',
    transition: 'var(--transition)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: fullWidth ? '100%' : 'auto',
    ...style
  };

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary': return { background: 'var(--text-primary)', color: '#fff', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)' };
      case 'secondary': return { background: 'rgba(0, 0, 0, 0.05)', color: 'var(--text-primary)' };
      case 'danger': return { background: 'var(--danger-color)', color: '#fff' };
      case 'ghost': return { background: 'transparent', color: 'var(--text-primary)' };
      default: return {};
    }
  };

  return (
    <button style={{ ...baseStyle, ...getVariantStyles() }} {...props}>
      {children}
    </button>
  );
};

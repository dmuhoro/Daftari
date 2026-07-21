import type { ReactNode, MouseEventHandler } from 'react';

interface CardProps {
  variant?: 'default' | 'subtle';
  padding?: 'p-3' | 'p-4' | 'p-5' | 'p-6' | 'p-8' | 'none';
  overflow?: boolean;
  className?: string;
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

export default function Card({
  variant = 'default',
  padding = 'p-4',
  overflow = false,
  className = '',
  children,
  onClick,
}: CardProps) {
  const base = 'bg-white dark:bg-stone-900 rounded-2xl border border-border dark:border-stone-700';
  const shadow = variant === 'default' ? 'shadow-card' : 'shadow-sm';
  const overflowClass = overflow ? 'overflow-hidden' : '';
  const pad = padding === 'none' ? '' : padding;
  const interactive = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${base} ${pad} ${shadow} ${overflowClass} ${interactive} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

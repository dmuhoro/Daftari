import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  accent?: 'green' | 'amber' | 'blue' | 'orange' | 'primary';
  variant?: 'default' | 'inline';
  icon?: boolean;
}

const accentRing: Record<string, string> = {
  green: 'focus:ring-green-600',
  amber: 'focus:ring-amber-500',
  blue: 'focus:ring-blue-500',
  orange: 'focus:ring-orange-500',
  primary: 'focus:ring-primary-600',
};

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField({
  accent = 'green',
  variant = 'default',
  icon = false,
  className = '',
  ...props
}, ref) {
  if (variant === 'inline') {
    return (
      <input
        ref={ref}
        className={`w-full rounded-xl border border-border dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-3 text-sm text-ink focus:outline-none focus:ring-2 ${accentRing[accent]} ${className}`}
        {...props}
      />
    );
  }

  const base = 'w-full rounded-xl border border-border dark:border-stone-700 bg-background dark:bg-stone-950 text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:border-transparent';
  const padding = icon ? 'pl-10 pr-4 py-3' : 'px-4 py-3';

  return (
    <input
      ref={ref}
      className={`${base} ${padding} ${accentRing[accent]} ${className}`}
      {...props}
    />
  );
});

export default TextField

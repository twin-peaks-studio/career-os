import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'google' | 'indeed' | 'linkedin' | 'new-today' | 'remote';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-[var(--color-primary-100)] text-[var(--color-primary-700)]': variant === 'default',
          'badge-google': variant === 'google',
          'badge-indeed': variant === 'indeed',
          'badge-linkedin': variant === 'linkedin',
          'badge-new-today': variant === 'new-today',
          'bg-[var(--color-primary-50)] text-[var(--color-primary-700)]': variant === 'remote',
        },
        className
      )}
    >
      {children}
    </span>
  );
}

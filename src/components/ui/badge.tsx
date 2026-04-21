import * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';

const styles: Record<BadgeVariant, React.CSSProperties> = {
  default:     { background: 'rgba(0,255,87,0.12)',   color: '#00DD4C', border: '1px solid rgba(0,255,87,0.22)' },
  secondary:   { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.1)' },
  destructive: { background: 'rgba(239,68,68,0.12)',  color: '#f87171', border: '1px solid rgba(239,68,68,0.22)' },
  outline:     { background: 'transparent',            color: 'rgba(255,255,255,0.5)',   border: '1px solid rgba(255,255,255,0.14)' },
  success:     { background: 'rgba(0,255,87,0.12)',   color: '#00DD4C', border: '1px solid rgba(0,255,87,0.22)' },
  warning:     { background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.22)' },
  info:        { background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.22)' },
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

function Badge({ className, variant = 'default', style, ...props }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center rounded-[4px] px-2 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap', className)}
      style={{ ...styles[variant], ...style }}
      {...props}
    />
  );
}

export { Badge };

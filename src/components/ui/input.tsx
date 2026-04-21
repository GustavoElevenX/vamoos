import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-8 w-full rounded-[6px] px-3 text-[13px] transition-all duration-150',
        'placeholder:select-none',
        'disabled:cursor-not-allowed disabled:opacity-40',
        'outline-none',
        className
      )}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--border)',
        color: 'var(--text-primary)',
      }}
      onFocus={e => {
        e.currentTarget.style.borderColor = 'rgba(0,255,87,0.35)';
        e.currentTarget.style.background = 'rgba(255,255,255,0.055)';
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,255,87,0.07)';
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        e.currentTarget.style.boxShadow = '';
      }}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export { Input };

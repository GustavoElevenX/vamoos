import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[6px]',
    'text-[13px] font-medium transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,255,87,0.4)] focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0a0a]',
    'disabled:pointer-events-none disabled:opacity-40',
    'cursor-pointer select-none',
  ].join(' '),
  {
    variants: {
      variant: {
        default:
          'bg-[#00FF57] text-[#0a0a0a] font-semibold hover:bg-[#00D44A] active:scale-[0.98] shadow-[0_1px_3px_rgba(0,0,0,0.4)]',
        destructive:
          'bg-[#ef4444]/90 text-white hover:bg-[#dc2626]',
        outline:
          'border border-[rgba(255,255,255,0.1)] bg-transparent text-[rgba(245,245,245,0.8)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#f5f5f5]',
        secondary:
          'bg-[rgba(255,255,255,0.06)] text-[rgba(245,245,245,0.8)] hover:bg-[rgba(255,255,255,0.09)] hover:text-[#f5f5f5]',
        ghost:
          'bg-transparent text-[rgba(245,245,245,0.55)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#f5f5f5]',
        link:
          'text-[#00FF57] underline-offset-4 hover:underline p-0 h-auto',
        success:
          'bg-[#22c55e]/90 text-white hover:bg-[#16a34a]',
        warning:
          'bg-[#f59e0b]/90 text-white hover:bg-[#d97706]',
      },
      size: {
        default: 'h-8 px-3.5 py-0',
        sm:      'h-7 rounded-[5px] px-3 text-[12px]',
        lg:      'h-9 px-5 text-[13.5px]',
        icon:    'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

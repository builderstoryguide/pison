import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot as SlotPrimitive } from 'radix-ui';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  asChild?: boolean;
  dotClassName?: string;
  disabled?: boolean;
}

export interface BadgeButtonProps
  extends React.ButtonHTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeButtonVariants> {
  asChild?: boolean;
}

export type BadgeDotProps = React.HTMLAttributes<HTMLSpanElement>;

const badgeVariants = cva(
  'inline-flex items-center justify-center border border-transparent font-medium focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 [&_svg]:-ms-px [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        success:
          'bg-[var(--color-success-accent)] text-[var(--color-success-foreground)]',
        warning:
          'bg-[var(--color-warning-accent)] text-[var(--color-warning-foreground)]',
        info: 'bg-[var(--color-info-accent)] text-[var(--color-info-foreground)]',
        outline: 'bg-transparent border border-border text-secondary-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
      },
      appearance: {
        default: '',
        light: '',
        outline: '',
        ghost: 'border-transparent bg-transparent',
      },
      disabled: {
        true: 'opacity-50 pointer-events-none',
      },
      size: {
        lg: 'rounded-md px-[0.5rem] h-7 min-w-7 gap-1.5 text-xs [&_svg]:size-3.5',
        md: 'rounded-md px-[0.45rem] h-6 min-w-6 gap-1.5 text-xs [&_svg]:size-3.5 ',
        sm: 'rounded-sm px-[0.325rem] h-5 min-w-5 gap-1 text-[0.6875rem] leading-[0.75rem] [&_svg]:size-3',
        xs: 'rounded-sm px-[0.25rem] h-4 min-w-4 gap-1 text-[0.625rem] leading-[0.5rem] [&_svg]:size-3',
      },
      shape: {
        default: '',
        circle: 'rounded-full',
      },
    },
    compoundVariants: [
      /* Light */
      {
        variant: 'primary',
        appearance: 'light',
        className:
          'text-[var(--color-primary-accent)] bg-[var(--color-primary-soft)] dark:bg-[var(--color-primary-soft)] dark:text-[var(--color-primary-accent)]',
      },
      {
        variant: 'secondary',
        appearance: 'light',
        className: 'bg-secondary dark:bg-secondary/50 text-secondary-foreground',
      },
      {
        variant: 'success',
        appearance: 'light',
        className:
          'text-[var(--color-success-accent)] bg-[var(--color-success-soft)] dark:bg-[var(--color-success-soft)] dark:text-[var(--color-success-accent)]',
      },
      {
        variant: 'warning',
        appearance: 'light',
        className:
          'text-[var(--color-warning-accent)] bg-[var(--color-warning-soft)] dark:bg-[var(--color-warning-soft)] dark:text-[var(--color-warning-accent)]',
      },
      {
        variant: 'info',
        appearance: 'light',
        className:
          'text-[var(--color-info-accent)] bg-[var(--color-info-soft)] dark:bg-[var(--color-info-soft)] dark:text-[var(--color-info-accent)]',
      },
      {
        variant: 'destructive',
        appearance: 'light',
        className:
          'text-[var(--color-destructive-accent)] bg-[var(--color-destructive-soft)] dark:bg-[var(--color-destructive-soft)] dark:text-[var(--color-destructive-accent)]',
      },
      /* Outline */
      {
        variant: 'primary',
        appearance: 'outline',
        className:
          'text-[var(--color-primary-accent)] border-[var(--color-primary-alpha)] bg-[var(--color-primary-soft)] dark:bg-[var(--color-primary-soft)] dark:border-[var(--color-primary-alpha)] dark:text-[var(--color-primary-accent)]',
      },
      {
        variant: 'success',
        appearance: 'outline',
        className:
          'text-[var(--color-success-accent)] border-[var(--color-success-alpha)] bg-[var(--color-success-soft)] dark:bg-[var(--color-success-soft)] dark:border-[var(--color-success-alpha)] dark:text-[var(--color-success-accent)]',
      },
      {
        variant: 'warning',
        appearance: 'outline',
        className:
          'text-[var(--color-warning-accent)] border-[var(--color-warning-alpha)] bg-[var(--color-warning-soft)] dark:bg-[var(--color-warning-soft)] dark:border-[var(--color-warning-alpha)] dark:text-[var(--color-warning-accent)]',
      },
      {
        variant: 'info',
        appearance: 'outline',
        className:
          'text-[var(--color-info-accent)] border-[var(--color-info-alpha)] bg-[var(--color-info-soft)] dark:bg-[var(--color-info-soft)] dark:border-[var(--color-info-alpha)] dark:text-[var(--color-info-accent)]',
      },
      {
        variant: 'destructive',
        appearance: 'outline',
        className:
          'text-[var(--color-destructive-accent)] border-[var(--color-destructive-alpha)] bg-[var(--color-destructive-soft)] dark:bg-[var(--color-destructive-soft)] dark:border-[var(--color-destructive-alpha)] dark:text-[var(--color-destructive-accent)]',
      },
      /* Ghost */
      {
        variant: 'primary',
        appearance: 'ghost',
        className: 'text-primary',
      },
      {
        variant: 'secondary',
        appearance: 'ghost',
        className: 'text-secondary-foreground',
      },
      {
        variant: 'success',
        appearance: 'ghost',
        className: 'text-[var(--color-success-accent)]',
      },
      {
        variant: 'warning',
        appearance: 'ghost',
        className: 'text-[var(--color-warning-accent)]',
      },
      {
        variant: 'info',
        appearance: 'ghost',
        className: 'text-[var(--color-info-accent)]',
      },
      {
        variant: 'destructive',
        appearance: 'ghost',
        className: 'text-destructive',
      },

      { size: 'lg', appearance: 'ghost', className: 'px-0' },
      { size: 'md', appearance: 'ghost', className: 'px-0' },
      { size: 'sm', appearance: 'ghost', className: 'px-0' },
      { size: 'xs', appearance: 'ghost', className: 'px-0' },
    ],
    defaultVariants: {
      variant: 'primary',
      appearance: 'default',
      size: 'md',
    },
  },
);

const badgeButtonVariants = cva(
  'cursor-pointer transition-all inline-flex items-center justify-center leading-none size-3.5 [&>svg]:opacity-100! [&>svg]:size-3.5! p-0 rounded-md -me-0.5 opacity-60 hover:opacity-100',
  {
    variants: {
      variant: {
        default: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant,
  size,
  appearance,
  shape,
  asChild = false,
  disabled,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? SlotPrimitive.Slot : 'span';

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, appearance, shape, disabled }), className)}
      {...props}
    />
  );
}

function BadgeButton({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof badgeButtonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? SlotPrimitive.Slot : 'span';
  return (
    <Comp
      data-slot="badge-button"
      className={cn(badgeButtonVariants({ variant, className }))}
      role="button"
      {...props}
    />
  );
}

function BadgeDot({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="badge-dot"
      className={cn('size-1.5 rounded-full bg-[currentColor] opacity-75', className)}
      {...props}
    />
  );
}

export { Badge, BadgeButton, BadgeDot, badgeVariants };

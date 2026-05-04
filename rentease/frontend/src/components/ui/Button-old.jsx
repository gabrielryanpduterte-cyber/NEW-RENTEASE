import { cn } from '../../lib/utils';

export function Button({ 
  className, 
  variant = 'primary', 
  children, 
  ...props 
}) {
  const variants = {
    primary: 'button-primary',
    secondary: 'button-secondary',
    light: 'button-light',
    icon: 'icon-button',
  };

  return (
    <button
      className={cn(variants[variant] || variants.primary, className)}
      {...props}
    >
      {children}
    </button>
  );
}

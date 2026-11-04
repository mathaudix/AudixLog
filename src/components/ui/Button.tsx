import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'soft' | 'danger-ghost' | 'link';
type Size = 'sm' | 'md' | 'lg';
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconOnly?: boolean;
  children: ReactNode;
}
const variants: Record<Variant, string> = {
  primary: 'ui-button-primary', secondary: 'ui-button-secondary', danger: 'ui-button-danger',
  ghost: 'ui-button-ghost', soft: 'ui-button-soft', 'danger-ghost': 'ui-button-danger-ghost', link: 'ui-button-link',
};
const sizes: Record<Size, string> = { sm: 'ui-button-sm', md: 'ui-button-md', lg: 'ui-button-lg' };
export function Button({ variant = 'secondary', size = 'md', loading = false, iconOnly = false, className = '', children, disabled, ...props }: Props) {
  return <button {...props} disabled={disabled || loading} aria-busy={loading || undefined} className={`ui-button ${variants[variant]} ${sizes[size]} ${iconOnly ? 'ui-button-icon' : ''} ${className}`}>
    {loading ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true"/> : children}
  </button>;
}

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
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
  soft: 'btn-soft',
  'danger-ghost': 'btn-danger-ghost',
  link: 'btn-link',
};
const sizes: Record<Size, string> = { sm: 'btn-sm', md: '', lg: 'btn-lg' };
export function Button({ variant = 'secondary', size = 'md', loading = false, iconOnly = false, className = '', children, disabled, ...props }: Props) {
  const iconClass = iconOnly ? (size === 'sm' ? 'btn-icon-sm' : 'btn-icon') : '';
  return <button {...props} disabled={disabled || loading} aria-busy={loading || undefined} className={`btn ${variants[variant]} ${sizes[size]} ${iconClass} ${className}`}>
    {loading ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true"/> : children}
  </button>;
}

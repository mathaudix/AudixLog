import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FieldProps { label?: string; hint?: string; error?: string; icon?: ReactNode; className?: string }
type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldProps;
type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & FieldProps;
type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps;

function FieldFrame({ label, hint, error, children, className = '' }: FieldProps & { children: ReactNode }) {
  return (
    <label className={`form-field ${className}`}>
      {label && <span className="form-label">{label}</span>}
      {children}
      {error ? <span className="form-error">{error}</span> : hint ? <span className="form-hint">{hint}</span> : null}
    </label>
  );
}

export function Input({ label, hint, error, icon, className = '', ...props }: InputProps) {
  return (
    <FieldFrame label={label} hint={hint} error={error}>
      <span className={`form-input-wrap ${icon ? 'has-icon' : ''}`}>
        {icon && <span className="form-input-icon">{icon}</span>}
        <input
          {...props}
          aria-invalid={Boolean(error) || props['aria-invalid']}
          className={`form-input ${className}`}
        />
      </span>
    </FieldFrame>
  );
}

export function Select({ label, hint, error, className = '', children, ...props }: SelectProps) {
  return (
    <FieldFrame label={label} hint={hint} error={error}>
      <select
        {...props}
        aria-invalid={Boolean(error) || props['aria-invalid']}
        className={`form-input ${className}`}
      >
        {children}
      </select>
    </FieldFrame>
  );
}

export function Textarea({ label, hint, error, className = '', ...props }: TextareaProps) {
  return (
    <FieldFrame label={label} hint={hint} error={error}>
      <textarea
        {...props}
        aria-invalid={Boolean(error) || props['aria-invalid']}
        className={`form-input form-textarea ${className}`}
      />
    </FieldFrame>
  );
}
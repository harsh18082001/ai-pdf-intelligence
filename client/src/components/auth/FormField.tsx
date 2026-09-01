import type { ReactNode } from 'react';
import { Input } from '@/components/ui/input';

interface FormFieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  children?: ReactNode;
}

export function FormField({
  label,
  type,
  value,
  onChange,
  autoComplete,
  required = true,
  children,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
      />
      {children}
    </div>
  );
}

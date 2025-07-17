
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ValidationError } from '@/components/common/ValidationError';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea' | 'select';
  value: any;
  onChange: (value: any) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: { value: string | number; label: string }[];
  min?: number;
  max?: number;
  step?: string;
  rows?: number;
  className?: string;
}

export const FormField = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  options = [],
  min,
  max,
  step,
  rows = 3,
  className
}: FormFieldProps) => {
  const hasError = !!error;

  const renderInput = () => {
    const baseProps = {
      id,
      value: value || '',
      disabled,
      placeholder,
      className: cn(hasError && 'border-red-500 focus:border-red-500', className),
      'aria-invalid': hasError,
      'aria-describedby': hasError ? `${id}-error` : undefined,
      autoComplete: (props as any)?.autoComplete,
    };

    switch (type) {
      case 'textarea':
        return (
          <Textarea
            {...baseProps}
            rows={rows}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case 'select':
        return (
          <Select
            value={value?.toString() || ''}
            onValueChange={onChange}
            disabled={disabled}
          >
            <SelectTrigger className={cn(hasError && 'border-red-500', className)}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'number':
        return (
          <Input
            {...baseProps}
            type="number"
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          />
        );

      default:
        return (
          <Input
            {...baseProps}
            type={type}
            onChange={(e) => onChange(e.target.value)}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={cn(required && "after:content-['*'] after:text-red-500 after:ml-1")}>
        {label}
      </Label>
      {renderInput()}
      <ValidationError message={error} id={`${id}-error`} />
    </div>
  );
};

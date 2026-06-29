import { useState, forwardRef } from 'react';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface TimePickerTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  placeholder: string;
  hasValue: boolean;
}

const TimePickerTrigger = forwardRef<HTMLButtonElement, TimePickerTriggerProps>(
  function TimePickerTrigger({ label, placeholder, hasValue, className, ...rest }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        {...rest}
        className={cn(
          'flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs',
          'hover:bg-accent/50 transition-colors cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          !hasValue && 'text-muted-foreground',
          className,
        )}
      >
        <Clock size={15} className="text-muted-foreground shrink-0" />
        <span className="truncate">{hasValue ? label : placeholder}</span>
      </button>
    );
  },
);

interface TimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TimePicker({
  value,
  onChange,
  placeholder = 'Select time',
  disabled,
  className,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);

  const parseTime = (v?: string) => {
    if (!v) return { h: 12, m: 0, period: 'AM' as const };
    const [hh, mm] = v.split(':').map(Number);
    const period = hh >= 12 ? 'PM' as const : 'AM' as const;
    const h = hh % 12 || 12;
    return { h, m: mm ?? 0, period };
  };

  const { h, m, period } = parseTime(value);

  const formatLabel = () => {
    if (!value) return '';
    return `${h}:${String(m).padStart(2, '0')} ${period}`;
  };

  const emit = (hour: number, minute: number, p: 'AM' | 'PM') => {
    let h24 = hour % 12;
    if (p === 'PM') h24 += 12;
    onChange?.(`${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  };

  const incHour = () => {
    const next = h >= 12 ? 1 : h + 1;
    emit(next, m, period);
  };
  const decHour = () => {
    const next = h <= 1 ? 12 : h - 1;
    emit(next, m, period);
  };
  const incMin = () => {
    const next = (m + 1) % 60;
    emit(h, next, period);
  };
  const decMin = () => {
    const next = (m - 1 + 60) % 60;
    emit(h, next, period);
  };
  const togglePeriod = () => {
    const next = period === 'AM' ? 'PM' : 'AM';
    emit(h, m, next);
  };

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <TimePickerTrigger
          label={formatLabel()}
          placeholder={placeholder}
          hasValue={!!value}
          disabled={disabled}
          className={className}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="flex items-center gap-3 select-none">
          {/* Hour */}
          <div className="flex flex-col items-center gap-1">
            <button type="button" onClick={incHour} className="h-7 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors cursor-pointer">
              <ChevronUp size={14} />
            </button>
            <span className="text-2xl font-semibold tabular-nums w-8 text-center">{String(h).padStart(2, '0')}</span>
            <button type="button" onClick={decHour} className="h-7 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors cursor-pointer">
              <ChevronDown size={14} />
            </button>
          </div>

          <span className="text-2xl font-semibold text-muted-foreground pb-0.5">:</span>

          {/* Minute */}
          <div className="flex flex-col items-center gap-1">
            <button type="button" onClick={incMin} className="h-7 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors cursor-pointer">
              <ChevronUp size={14} />
            </button>
            <span className="text-2xl font-semibold tabular-nums w-8 text-center">{String(m).padStart(2, '0')}</span>
            <button type="button" onClick={decMin} className="h-7 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors cursor-pointer">
              <ChevronDown size={14} />
            </button>
          </div>

          {/* AM/PM */}
          <div className="flex flex-col gap-1 ml-1">
            <button
              type="button"
              onClick={() => { if (period !== 'AM') togglePeriod(); }}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer',
                period === 'AM' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent',
              )}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => { if (period !== 'PM') togglePeriod(); }}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer',
                period === 'PM' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent',
              )}
            >
              PM
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

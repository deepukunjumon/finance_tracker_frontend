import { useState, forwardRef } from 'react';
import {
  format, parse, isValid, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, addYears, subYears, isSameDay, isSameMonth, getDay,
} from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/* ── Shared constants ── */
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ── Build calendar grid (6 rows × 7 cols) ── */
function buildCalendarDays(year: number, month: number): Date[] {
  const first = startOfMonth(new Date(year, month));
  const last  = endOfMonth(first);
  const start = startOfWeek(first, { weekStartsOn: 0 });
  const end   = endOfWeek(last,   { weekStartsOn: 0 });
  const days: Date[] = [];
  let cur = start;
  while (cur <= end) {
    days.push(cur);
    cur = addDays(cur, 1);
  }
  return days;
}

/* ── Internal: Trigger button (forwardRef so Radix asChild works) ── */
const PickerTrigger = forwardRef<
  HTMLButtonElement,
  { label?: string; placeholder: string; hasValue: boolean; clearable?: boolean; onClear?: () => void; className?: string; [k: string]: unknown }
>(function PickerTrigger({ label, placeholder, hasValue, clearable, onClear, className, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      {...rest}
      className={cn(
        'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs',
        'hover:bg-accent/50 transition-colors cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50',
        !hasValue && 'text-muted-foreground',
        className,
      )}
    >
      <span className="flex items-center gap-2 min-w-0">
        <CalendarDays size={15} className="text-muted-foreground shrink-0" />
        <span className="truncate">{hasValue ? label : placeholder}</span>
      </span>
      {clearable && hasValue && (
        <X
          size={14}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-1"
          onClick={(e) => { e.stopPropagation(); onClear?.(); }}
        />
      )}
    </button>
  );
});

/* ── Internal: Calendar panel (day picker with month/year nav) ── */
type CalView = 'days' | 'months' | 'years';

function CalendarPanel({
  selected,
  onSelect,
}: {
  selected?: Date;
  onSelect: (d: Date) => void;
}) {
  const today = new Date();
  const [view, setView] = useState<CalView>('days');
  const [cursor, setCursor] = useState<Date>(selected ?? today);
  const [yearPage, setYearPage] = useState(() => Math.floor((selected ?? today).getFullYear() / 12) * 12);

  const year  = cursor.getFullYear();
  const month = cursor.getMonth();

  /* ── Days view ── */
  if (view === 'days') {
    const days = buildCalendarDays(year, month);
    return (
      <div className="w-64 p-3 select-none">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setCursor(subMonths(cursor, 1))}
            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => setView('months')}
            className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer px-2 py-0.5 rounded hover:bg-accent"
          >
            {MONTH_NAMES[month]} {year}
          </button>
          <button
            type="button"
            onClick={() => setCursor(addMonths(cursor, 1))}
            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map((d) => (
            <div key={d} className="h-8 flex items-center justify-center text-[11px] font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {days.map((d, i) => {
            const isToday    = isSameDay(d, today);
            const isSel      = selected ? isSameDay(d, selected) : false;
            const isThisMonth = isSameMonth(d, cursor);
            return (
              <button
                key={i}
                type="button"
                onClick={() => onSelect(d)}
                className={cn(
                  'h-8 w-full flex items-center justify-center rounded-md text-sm transition-colors cursor-pointer',
                  !isThisMonth && 'text-muted-foreground/40',
                  isThisMonth && !isSel && !isToday && 'hover:bg-accent hover:text-accent-foreground',
                  isToday && !isSel && 'bg-accent text-accent-foreground font-semibold',
                  isSel && 'bg-primary text-primary-foreground font-semibold hover:bg-primary/90',
                )}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── Months view ── */
  if (view === 'months') {
    return (
      <div className="w-56 p-3 select-none">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setCursor(subYears(cursor, 1))}
            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => { setYearPage(Math.floor(year / 12) * 12); setView('years'); }}
            className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer px-2 py-0.5 rounded hover:bg-accent"
          >
            {year}
          </button>
          <button
            type="button"
            onClick={() => setCursor(addYears(cursor, 1))}
            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {MONTH_SHORT.map((m, i) => (
            <button
              key={m}
              type="button"
              onClick={() => { setCursor(new Date(year, i, 1)); setView('days'); }}
              className={cn(
                'rounded-md py-2 text-xs font-medium transition-colors cursor-pointer',
                i === month
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground text-foreground',
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ── Years view (12-year page) ── */
  const years = Array.from({ length: 12 }, (_, i) => yearPage + i);
  return (
    <div className="w-56 p-3 select-none">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setYearPage((y) => y - 12)}
          className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-sm font-semibold">{yearPage} – {yearPage + 11}</span>
        <button
          type="button"
          onClick={() => setYearPage((y) => y + 12)}
          className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1">
        {years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => { setCursor(new Date(y, month, 1)); setView('months'); }}
            className={cn(
              'rounded-md py-2 text-xs font-medium transition-colors cursor-pointer',
              y === year
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent hover:text-accent-foreground text-foreground',
            )}
          >
            {y}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   DatePicker  — value/onChange use "yyyy-MM-dd" string
   ──────────────────────────────────────────────────────────── */
interface DatePickerProps {
  value?:       string;
  onChange?:    (value: string) => void;
  placeholder?: string;
  disabled?:    boolean;
  clearable?:   boolean;
  className?:   string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  disabled,
  clearable = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const parsed  = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
  const isOk    = parsed && isValid(parsed);
  const label   = isOk ? format(parsed!, 'd MMM yyyy') : undefined;

  const handleSelect = (d: Date) => {
    onChange?.(format(d, 'yyyy-MM-dd'));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <PickerTrigger
          label={label}
          placeholder={placeholder}
          hasValue={!!isOk}
          clearable={clearable}
          onClear={() => onChange?.('')}
          disabled={disabled}
          className={className}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarPanel selected={isOk ? parsed : undefined} onSelect={handleSelect} />
      </PopoverContent>
    </Popover>
  );
}

/* ────────────────────────────────────────────────────────────
   DateRangePicker  — two DatePickers side-by-side
   ──────────────────────────────────────────────────────────── */
interface DateRangePickerProps {
  startDate?:        string;
  endDate?:          string;
  onStartChange?:    (v: string) => void;
  onEndChange?:      (v: string) => void;
  startPlaceholder?: string;
  endPlaceholder?:   string;
  className?:        string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  startPlaceholder = 'From',
  endPlaceholder   = 'To',
  className,
}: DateRangePickerProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <DatePicker
        value={startDate}
        onChange={onStartChange}
        placeholder={startPlaceholder}
        clearable
      />
      <span className="text-muted-foreground text-xs shrink-0">–</span>
      <DatePicker
        value={endDate}
        onChange={onEndChange}
        placeholder={endPlaceholder}
        clearable
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   MonthPicker  — value/onChange use "yyyy-MM" string
   ──────────────────────────────────────────────────────────── */
interface MonthPickerProps {
  value?:       string;
  onChange?:    (value: string) => void;
  placeholder?: string;
  disabled?:    boolean;
  clearable?:   boolean;
  className?:   string;
}

export function MonthPicker({
  value,
  onChange,
  placeholder = 'Select month',
  disabled,
  clearable = false,
  className,
}: MonthPickerProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    if (value) {
      const y = parseInt(value.split('-')[0], 10);
      return isNaN(y) ? new Date().getFullYear() : y;
    }
    return new Date().getFullYear();
  });
  const [yearMode, setYearMode] = useState(false);
  const [yearPage, setYearPage] = useState(() => Math.floor(viewYear / 12) * 12);

  const [selYear, selMonthStr] = value ? value.split('-') : [null, null];
  const selMonth = selMonthStr ? parseInt(selMonthStr, 10) : null;
  const label = (selYear && selMonth) ? `${MONTH_SHORT[selMonth - 1]} ${selYear}` : undefined;

  const select = (y: number, m: number) => {
    onChange?.(`${y}-${String(m).padStart(2, '0')}`);
    setOpen(false);
  };

  const years = Array.from({ length: 12 }, (_, i) => yearPage + i);

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <PickerTrigger
          label={label}
          placeholder={placeholder}
          hasValue={!!label}
          clearable={clearable}
          onClear={() => onChange?.('')}
          disabled={disabled}
          className={className}
        />
      </PopoverTrigger>

      <PopoverContent className="w-56 p-3" align="start">
        {!yearMode ? (
          <>
            {/* Year nav */}
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={() => setViewYear((y) => y - 1)}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors cursor-pointer">
                <ChevronLeft size={14} />
              </button>
              <button type="button" onClick={() => { setYearPage(Math.floor(viewYear / 12) * 12); setYearMode(true); }}
                className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer px-2 py-0.5 rounded hover:bg-accent">
                {viewYear}
              </button>
              <button type="button" onClick={() => setViewYear((y) => y + 1)}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors cursor-pointer">
                <ChevronRight size={14} />
              </button>
            </div>
            {/* Month grid */}
            <div className="grid grid-cols-3 gap-1">
              {MONTH_SHORT.map((m, i) => {
                const isSel = selYear === String(viewYear) && selMonth === i + 1;
                return (
                  <button key={m} type="button" onClick={() => select(viewYear, i + 1)}
                    className={cn(
                      'rounded-md py-2 text-xs font-medium transition-colors cursor-pointer',
                      isSel ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground text-foreground',
                    )}>
                    {m}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {/* Year page nav */}
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={() => setYearPage((y) => y - 12)}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors cursor-pointer">
                <ChevronLeft size={14} />
              </button>
              <span className="text-sm font-semibold">{yearPage} – {yearPage + 11}</span>
              <button type="button" onClick={() => setYearPage((y) => y + 12)}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors cursor-pointer">
                <ChevronRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {years.map((y) => (
                <button key={y} type="button" onClick={() => { setViewYear(y); setYearMode(false); }}
                  className={cn(
                    'rounded-md py-2 text-xs font-medium transition-colors cursor-pointer',
                    y === viewYear ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground text-foreground',
                  )}>
                  {y}
                </button>
              ))}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

import { useState, forwardRef } from 'react';
import {
  format, parse, isValid, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, addYears, subYears, isSameDay, isSameMonth, isAfter, startOfDay,
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
  maxDate,
}: {
  selected?: Date;
  onSelect: (d: Date) => void;
  maxDate?: Date;
}) {
  const today = new Date();
  const [view, setView] = useState<CalView>('days');
  const [cursor, setCursor] = useState<Date>(selected ?? today);
  const [yearPage, setYearPage] = useState(() => Math.floor((selected ?? today).getFullYear() / 12) * 12);

  const year  = cursor.getFullYear();
  const month = cursor.getMonth();

  const maxDay = maxDate ? startOfDay(maxDate) : undefined;
  const isDayDisabled = (d: Date) => maxDay ? isAfter(startOfDay(d), maxDay) : false;
  const isMonthDisabled = (y: number, m: number) => maxDay ? new Date(y, m, 1) > endOfMonth(maxDay) : false;
  const isYearDisabled = (y: number) => maxDay ? y > maxDay.getFullYear() : false;
  const canGoNextMonth = !maxDay || new Date(year, month + 1, 1) <= endOfMonth(maxDay);
  const canGoNextYear = !maxDay || year + 1 <= maxDay.getFullYear();

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
            onClick={() => canGoNextMonth && setCursor(addMonths(cursor, 1))}
            disabled={!canGoNextMonth}
            className={cn(
              'h-7 w-7 rounded-md flex items-center justify-center transition-colors',
              canGoNextMonth ? 'text-muted-foreground hover:bg-accent cursor-pointer' : 'text-muted-foreground/30 cursor-not-allowed',
            )}
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
            const isToday     = isSameDay(d, today);
            const isSel       = selected ? isSameDay(d, selected) : false;
            const isThisMonth = isSameMonth(d, cursor);
            const disabled    = isDayDisabled(d);
            return (
              <button
                key={i}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && onSelect(d)}
                className={cn(
                  'h-8 w-full flex items-center justify-center rounded-md text-sm transition-colors',
                  disabled && 'text-muted-foreground/25 cursor-not-allowed',
                  !disabled && !isThisMonth && 'text-muted-foreground/40 cursor-pointer',
                  !disabled && isThisMonth && !isSel && !isToday && 'hover:bg-accent hover:text-accent-foreground cursor-pointer',
                  !disabled && isToday && !isSel && 'bg-accent text-accent-foreground font-semibold cursor-pointer',
                  isSel && 'bg-primary text-primary-foreground font-semibold hover:bg-primary/90 cursor-pointer',
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
            onClick={() => canGoNextYear && setCursor(addYears(cursor, 1))}
            disabled={!canGoNextYear}
            className={cn(
              'h-7 w-7 rounded-md flex items-center justify-center transition-colors',
              canGoNextYear ? 'text-muted-foreground hover:bg-accent cursor-pointer' : 'text-muted-foreground/30 cursor-not-allowed',
            )}
          >
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {MONTH_SHORT.map((m, i) => {
            const disabled = isMonthDisabled(year, i);
            return (
              <button
                key={m}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && (() => { setCursor(new Date(year, i, 1)); setView('days'); })()}
                className={cn(
                  'rounded-md py-2 text-xs font-medium transition-colors',
                  disabled && 'text-muted-foreground/25 cursor-not-allowed',
                  !disabled && i === month
                    ? 'bg-primary text-primary-foreground cursor-pointer'
                    : !disabled ? 'hover:bg-accent hover:text-accent-foreground text-foreground cursor-pointer' : '',
                )}
              >
                {m}
              </button>
            );
          })}
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
        {years.map((y) => {
          const disabled = isYearDisabled(y);
          return (
            <button
              key={y}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && (() => { setCursor(new Date(y, month, 1)); setView('months'); })()}
              className={cn(
                'rounded-md py-2 text-xs font-medium transition-colors',
                disabled && 'text-muted-foreground/25 cursor-not-allowed',
                !disabled && y === year
                  ? 'bg-primary text-primary-foreground cursor-pointer'
                  : !disabled ? 'hover:bg-accent hover:text-accent-foreground text-foreground cursor-pointer' : '',
              )}
            >
              {y}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   DatePicker  — value/onChange use "yyyy-MM-dd" string
   ──────────────────────────────────────────────────────────── */
interface DatePickerProps {
  value?:         string;
  onChange?:      (value: string) => void;
  placeholder?:   string;
  disabled?:      boolean;
  clearable?:     boolean;
  disableFuture?: boolean;
  maxDate?:       Date;
  className?:     string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  disabled,
  clearable = false,
  disableFuture = false,
  maxDate,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const parsed  = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
  const isOk    = parsed && isValid(parsed);
  const label   = isOk ? format(parsed!, 'd MMM yyyy') : undefined;

  const resolvedMax = maxDate ?? (disableFuture ? new Date() : undefined);

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
        <CalendarPanel selected={isOk ? parsed : undefined} onSelect={handleSelect} maxDate={resolvedMax} />
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
  disableFuture?:    boolean;
  className?:        string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  startPlaceholder = 'From',
  endPlaceholder   = 'To',
  disableFuture    = false,
  className,
}: DateRangePickerProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <DatePicker
        value={startDate}
        onChange={onStartChange}
        placeholder={startPlaceholder}
        disableFuture={disableFuture}
        clearable
      />
      <span className="text-muted-foreground text-xs shrink-0">–</span>
      <DatePicker
        value={endDate}
        onChange={onEndChange}
        placeholder={endPlaceholder}
        disableFuture={disableFuture}
        clearable
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   MonthPicker  — value/onChange use "yyyy-MM" string
   ──────────────────────────────────────────────────────────── */
interface MonthPickerProps {
  value?:         string;
  onChange?:      (value: string) => void;
  placeholder?:   string;
  disabled?:      boolean;
  clearable?:     boolean;
  disableFuture?: boolean;
  className?:     string;
}

export function MonthPicker({
  value,
  onChange,
  placeholder = 'Select month',
  disabled,
  clearable = false,
  disableFuture = false,
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

  const now = new Date();
  const maxYear  = now.getFullYear();
  const maxMonth = now.getMonth();

  const [selYear, selMonthStr] = value ? value.split('-') : [null, null];
  const selMonth = selMonthStr ? parseInt(selMonthStr, 10) : null;
  const label = (selYear && selMonth) ? `${MONTH_SHORT[selMonth - 1]} ${selYear}` : undefined;

  const isMonthDisabledFn = (y: number, m: number) => disableFuture && (y > maxYear || (y === maxYear && m > maxMonth));
  const isYearDisabledFn  = (y: number) => disableFuture && y > maxYear;
  const canNextYear       = !disableFuture || viewYear < maxYear;

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
              <button type="button"
                disabled={!canNextYear}
                onClick={() => canNextYear && setViewYear((y) => y + 1)}
                className={cn(
                  'h-7 w-7 rounded-md flex items-center justify-center transition-colors',
                  canNextYear ? 'text-muted-foreground hover:bg-accent cursor-pointer' : 'text-muted-foreground/30 cursor-not-allowed',
                )}>
                <ChevronRight size={14} />
              </button>
            </div>
            {/* Month grid */}
            <div className="grid grid-cols-3 gap-1">
              {MONTH_SHORT.map((m, i) => {
                const isSel = selYear === String(viewYear) && selMonth === i + 1;
                const disabled = isMonthDisabledFn(viewYear, i);
                return (
                  <button key={m} type="button" disabled={disabled}
                    onClick={() => !disabled && select(viewYear, i + 1)}
                    className={cn(
                      'rounded-md py-2 text-xs font-medium transition-colors',
                      disabled && 'text-muted-foreground/25 cursor-not-allowed',
                      !disabled && isSel ? 'bg-primary text-primary-foreground cursor-pointer'
                        : !disabled ? 'hover:bg-accent hover:text-accent-foreground text-foreground cursor-pointer' : '',
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
              {years.map((y) => {
                const disabled = isYearDisabledFn(y);
                return (
                  <button key={y} type="button" disabled={disabled}
                    onClick={() => !disabled && (() => { setViewYear(y); setYearMode(false); })()}
                    className={cn(
                      'rounded-md py-2 text-xs font-medium transition-colors',
                      disabled && 'text-muted-foreground/25 cursor-not-allowed',
                      !disabled && y === viewYear ? 'bg-primary text-primary-foreground cursor-pointer'
                        : !disabled ? 'hover:bg-accent hover:text-accent-foreground text-foreground cursor-pointer' : '',
                    )}>
                    {y}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

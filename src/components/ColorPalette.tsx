import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ACCOUNT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
  '#3b82f6', '#64748b',
];

interface ColorPaletteProps {
  value?:    string;
  onChange:  (color: string) => void;
  className?: string;
}

export function ColorPalette({ value, onChange, className }: ColorPaletteProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {ACCOUNT_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className="w-7 h-7 rounded-full flex items-center justify-center ring-offset-background transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
          style={{ backgroundColor: color }}
          title={color}
        >
          {value === color && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </button>
      ))}
    </div>
  );
}

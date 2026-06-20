import { useState } from 'react';
import { Plus } from 'lucide-react';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';
import type { Transaction } from '@/types';

interface FABProps {
  onCreated?: (tx: Transaction) => void;
}

export function FAB({ onCreated }: FABProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-20 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
        aria-label="Add transaction"
      >
        <Plus className="w-6 h-6" />
      </button>

      <AddTransactionDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={onCreated}
      />
    </>
  );
}

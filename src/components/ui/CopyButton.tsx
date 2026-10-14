import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { copyText } from '../../utils/clipboard';
import { useApp } from '../../context/AppContext';
import { cn } from '../../utils/cn';

interface Props {
  text: string | (() => string);
  label?: string;
  successMessage?: string;
  className?: string;
  variant?: 'ghost' | 'secondary' | 'code';
  size?: 'sm' | 'md';
}

export function CopyButton({ text, label = 'העתקה', successMessage = 'הועתק ללוח', className, variant = 'ghost', size = 'sm' }: Props) {
  const { toast } = useApp();
  const [done, setDone] = useState(false);

  const onClick = async () => {
    const value = typeof text === 'function' ? text() : text;
    const ok = await copyText(value);
    if (ok) {
      setDone(true);
      toast(successMessage);
      setTimeout(() => setDone(false), 1600);
    } else {
      toast('ההעתקה נכשלה – הדפדפן חסם גישה ללוח', 'error');
    }
  };

  const Icon = done ? Check : Copy;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'btn',
        size === 'sm' ? 'btn-sm' : '',
        variant === 'ghost' && 'btn-ghost',
        variant === 'secondary' && 'btn-secondary',
        variant === 'code' && 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white',
        className,
      )}
      aria-label={label}
    >
      <Icon className={cn('size-3.5', done && 'text-success')} aria-hidden />
      <span>{done ? 'הועתק' : label}</span>
    </button>
  );
}

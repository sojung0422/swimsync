import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';

type GuideChipProps = {
  title: string;
  description: string;
  className?: string;
};

export function GuideChip({ title, description, className = '' }: GuideChipProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="group relative flex h-5 w-5 items-center justify-center rounded-full border border-cyan-200 bg-white shadow-sm transition hover:border-cyan-300 hover:shadow-md"
        aria-label={`${title} 안내 보기`}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 transition group-hover:scale-110" />
      </button>

      {open && (
        <div className="absolute left-1/2 top-7 z-30 w-[220px] -translate-x-1/2 rounded-2xl border border-cyan-100 bg-white p-3 text-left shadow-xl">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
              <p className="text-[11px] font-semibold text-slate-700">{title}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-400 transition hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-[11px] leading-5 text-slate-600">{description}</p>
        </div>
      )}
    </div>
  );
}

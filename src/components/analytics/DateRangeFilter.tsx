import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DateRange } from '../../utils/analyticsData';
import { buildPresets, todayStr } from '../../utils/analyticsData';
import { formatDate } from '../../utils/formatDate';

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const presets = buildPresets();
  const [open, setOpen]         = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo]     = useState('');
  const [mode, setMode]         = useState<'preset' | 'custom'>('preset');
  const [customError, setCustomError] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  // Sync custom inputs when value changes externally
  useEffect(() => {
    setCustomFrom(value.from);
    setCustomTo(value.to);
  }, [value.from, value.to]);

  // Click-outside close
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  // Escape close
  useEffect(() => {
    if (!open) return;
    function handle(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [open]);

  function applyCustom() {
    setCustomError('');
    if (!customFrom || !customTo) { setCustomError('Both dates are required.'); return; }
    if (customFrom > customTo)    { setCustomError('"From" must be before "To".'); return; }
    if (customTo > todayStr())    { setCustomError('"To" cannot be in the future.'); return; }
    onChange({ from: customFrom, to: customTo, label: 'Custom range' });
    setOpen(false);
  }

  const isCustom = value.label === 'Custom range';

  return (
    <div className="relative" ref={wrapRef}>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-2 px-3 py-2 bg-brand-card border border-brand-border rounded-lg text-sm text-brand-text hover:border-brand-muted transition-colors focus:outline-none focus:border-[#FF6B00] focus:shadow-[0_0_0_3px_rgba(255,107,0,0.15)]"
      >
        <Calendar size={14} className="text-brand-muted shrink-0" aria-hidden="true" />
        <span className="font-head font-medium max-w-[180px] truncate">
          {isCustom
            ? `${formatDate(value.from)} – ${formatDate(value.to)}`
            : value.label}
        </span>
        <ChevronDown
          size={14}
          className={`text-brand-muted shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-72 bg-brand-card2 border border-brand-border rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Tab switcher */}
            <div className="flex border-b border-brand-border">
              {(['preset', 'custom'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMode(t)}
                  className="flex-1 py-2.5 text-xs font-head font-medium capitalize transition-colors"
                  style={mode === t
                    ? { color: '#FF6B00', borderBottom: '2px solid #FF6B00', marginBottom: -1 }
                    : { color: '#8A99AE' }
                  }
                >
                  {t === 'preset' ? 'Quick Select' : 'Custom Range'}
                </button>
              ))}
            </div>

            {/* Preset list */}
            {mode === 'preset' && (
              <div className="py-1">
                {presets.map((p) => {
                  const active = value.label === p.label;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => { onChange(p); setOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between group"
                      style={active ? { background: 'rgba(255,107,0,0.1)', color: '#FF6B00' } : { color: '#C8D4E0' }}
                    >
                      <span className="font-head font-medium">{p.label}</span>
                      <span className="text-[10px] text-brand-muted group-hover:text-brand-text transition-colors font-head">
                        {p.from.slice(0, 7)} → {p.to.slice(0, 7)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Custom date inputs */}
            {mode === 'custom' && (
              <div className="p-4 space-y-3">
                <div>
                  <label className="field-label">From</label>
                  <input
                    type="date"
                    value={customFrom}
                    max={customTo || todayStr()}
                    onChange={(e) => { setCustomFrom(e.target.value); setCustomError(''); }}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="field-label">To</label>
                  <input
                    type="date"
                    value={customTo}
                    min={customFrom}
                    max={todayStr()}
                    onChange={(e) => { setCustomTo(e.target.value); setCustomError(''); }}
                    className="input-field"
                  />
                </div>

                {customError && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5">
                    <X size={12} className="shrink-0" />{customError}
                  </p>
                )}

                <button
                  type="button"
                  onClick={applyCustom}
                  disabled={!customFrom || !customTo}
                  className="w-full py-2.5 rounded-lg text-white text-sm font-medium font-head transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ background: '#FF6B00' }}
                >
                  Apply Range
                </button>

                {/* Quick shortcuts inside custom pane */}
                <div className="pt-1 border-t border-brand-border">
                  <p className="text-brand-muted text-[10px] font-head uppercase tracking-wider mb-2">Quick fill</p>
                  <div className="flex flex-wrap gap-1.5">
                    {presets.slice(0, 5).map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => { setCustomFrom(p.from); setCustomTo(p.to); setCustomError(''); }}
                        className="px-2 py-1 rounded bg-brand-card border border-brand-border text-[10px] text-brand-muted hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors font-head"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Active range footer */}
            <div className="px-4 py-2.5 border-t border-brand-border bg-brand-night/50 flex items-center justify-between">
              <span className="text-brand-muted text-[10px] font-head uppercase tracking-wider">Active</span>
              <span className="text-[#FF6B00] text-xs font-head font-medium">
                {isCustom
                  ? `${value.from} → ${value.to}`
                  : value.label}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

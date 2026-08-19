import React, { useEffect, useState } from 'react';
import { RotateCcw, X, CheckCircle2 } from 'lucide-react';
import { sounds } from './SoundEffects';

export interface UndoAction {
  id: string;
  title: string;
  description?: string;
  onUndo: () => void;
  durationMs?: number;
}

interface UndoActionBarProps {
  action: UndoAction | null;
  onDismiss: () => void;
}

export default function UndoActionBar({ action, onDismiss }: UndoActionBarProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!action) return;

    setProgress(100);
    const duration = action.durationMs || 10000;
    const intervalMs = 100;
    const step = (intervalMs / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev <= step) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [action, onDismiss]);

  if (!action) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-bounce-in font-sans">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 p-4 max-w-md flex flex-col gap-2.5 overflow-hidden relative">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h5 className="text-xs font-black tracking-tight text-white truncate">
                {action.title}
              </h5>
              {action.description && (
                <p className="text-[11px] text-slate-300 truncate">
                  {action.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                sounds.playSuccess();
                action.onUndo();
                onDismiss();
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-all border-none"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Cofnij
            </button>
            <button
              onClick={() => {
                sounds.playBeep();
                onDismiss();
              }}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar (draining countdown) */}
        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
          <div 
            className="bg-blue-500 h-full transition-all ease-linear"
            style={{ width: `${progress}%`, transitionDuration: '100ms' }}
          />
        </div>
      </div>
    </div>
  );
}

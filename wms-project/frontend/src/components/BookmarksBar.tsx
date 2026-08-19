import React, { useState } from 'react';
import { Star, Clock, Plus, ChevronRight, X } from 'lucide-react';
import { sounds } from './SoundEffects';

interface BookmarksBarProps {
  currentTab: string;
  onNavigate: (tabId: string) => void;
  sideNavItems: Array<{ id: string; label: string; icon: any }>;
  addToast?: (title: string, msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export default function BookmarksBar({
  currentTab,
  onNavigate,
  sideNavItems,
  addToast
}: BookmarksBarProps) {
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('wms-pinned-bookmarks');
      return stored ? JSON.parse(stored) : ['orders', 'inventory', 'overview'];
    } catch {
      return ['orders', 'inventory', 'overview'];
    }
  });

  const [isPinnedDropdownOpen, setIsPinnedDropdownOpen] = useState(false);

  const togglePinCurrent = () => {
    sounds.playBeep();
    setBookmarks(prev => {
      const isPinned = prev.includes(currentTab);
      const next = isPinned ? prev.filter(id => id !== currentTab) : [...prev, currentTab];
      try {
        localStorage.setItem('wms-pinned-bookmarks', JSON.stringify(next));
      } catch (e) {}

      const currentItem = sideNavItems.find(i => i.id === currentTab);
      if (addToast) {
        addToast(
          isPinned ? 'Usunięto z ulubionych' : 'Przypięto do paska',
          `Zakładka "${currentItem?.label || currentTab}"`,
          'info'
        );
      }
      return next;
    });
  };

  const isCurrentPinned = bookmarks.includes(currentTab);

  return (
    <div className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 px-6 py-1.5 flex items-center justify-between gap-3 text-xs font-sans select-none">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1 shrink-0">
          <Star className="w-3 h-3 text-amber-500 fill-amber-400" /> Szybki Dostęp:
        </span>

        {bookmarks.map(tabId => {
          const item = sideNavItems.find(i => i.id === tabId);
          if (!item) return null;
          const IconComp = item.icon;
          const isActive = currentTab === tabId;

          return (
            <button
              key={tabId}
              onClick={() => {
                sounds.playSuccess();
                onNavigate(tabId);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer border ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700'
              }`}
            >
              <IconComp className={`w-3 h-3 ${isActive ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
              <span>{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={togglePinCurrent}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer border ${
            isCurrentPinned
              ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
              : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-800'
          }`}
          title={isCurrentPinned ? "Odepnij tę stronę z paska" : "Przypnij bieżący widok do paska"}
        >
          <Star className={`w-3 h-3 ${isCurrentPinned ? 'fill-amber-400 text-amber-500' : ''}`} />
          <span>{isCurrentPinned ? 'Przypięto' : '+ Przypnij'}</span>
        </button>
      </div>
    </div>
  );
}

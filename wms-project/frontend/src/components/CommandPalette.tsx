import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Moon, Sun, Monitor, Star, Clock, FileText, Package, 
  Layers, Map, ShieldAlert, BarChart3, Settings as SettingsIcon, 
  Truck, ArrowRight, CornerDownLeft, Sparkles, X, Copy, Check,
  Download, Globe, RotateCcw, Boxes, Calendar, Compass
} from 'lucide-react';
import { sounds } from './SoundEffects';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tabId: string) => void;
  currentTab: string;
  sideNavItems: Array<{ id: string; label: string; icon: any }>;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  fontScale: string;
  onChangeFontScale: (scale: string) => void;
  addToast?: (title: string, msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

// Simple typo-tolerant fuzzy matching score
function fuzzyMatch(query: string, target: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase();
  
  if (t.includes(q)) return true;
  
  // Character sequence matching
  let qIdx = 0;
  for (let i = 0; i < t.length && qIdx < q.length; i++) {
    if (t[i] === q[qIdx]) {
      qIdx++;
    }
  }
  return qIdx === q.length;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  currentTab,
  sideNavItems,
  isDarkMode,
  onToggleDarkMode,
  fontScale,
  onChangeFontScale,
  addToast
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Bookmarks & Recents
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('wms-pinned-bookmarks');
      return stored ? JSON.parse(stored) : ['orders', 'inventory', 'overview'];
    } catch {
      return ['orders', 'inventory', 'overview'];
    }
  });

  const toggleBookmark = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playBeep();
    setBookmarks(prev => {
      const next = prev.includes(tabId) ? prev.filter(id => id !== tabId) : [...prev, tabId];
      try {
        localStorage.setItem('wms-pinned-bookmarks', JSON.stringify(next));
      } catch (err) {}
      if (addToast) {
        addToast(
          prev.includes(tabId) ? 'Usunięto z ulubionych' : 'Dodano do ulubionych',
          `Zakładka "${sideNavItems.find(i => i.id === tabId)?.label || tabId}"`,
          'info'
        );
      }
      return next;
    });
  };

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build items list
  const quickActions = [
    {
      id: 'action-dark-mode',
      type: 'action',
      title: isDarkMode ? 'Wyłącz Tryb Ciemny (Jasny Motyw)' : 'Włącz Tryb Ciemny (Dark Mode)',
      category: 'Wygląd & Motyw',
      icon: isDarkMode ? Sun : Moon,
      action: () => {
        onToggleDarkMode();
        onClose();
      }
    },
    {
      id: 'action-font-compact',
      type: 'action',
      title: 'Skalowanie UI: Kompaktowy (90% czcionka)',
      category: 'Wygląd & Motyw',
      icon: Monitor,
      action: () => {
        onChangeFontScale('90%');
        onClose();
      }
    },
    {
      id: 'action-font-normal',
      type: 'action',
      title: 'Skalowanie UI: Normalny (100% czcionka)',
      category: 'Wygląd & Motyw',
      icon: Monitor,
      action: () => {
        onChangeFontScale('100%');
        onClose();
      }
    },
    {
      id: 'action-font-large',
      type: 'action',
      title: 'Skalowanie UI: Powiększony (110% czcionka)',
      category: 'Wygląd & Motyw',
      icon: Monitor,
      action: () => {
        onChangeFontScale('110%');
        onClose();
      }
    },
    {
      id: 'action-terminal-picker',
      type: 'action',
      title: 'Otwórz Terminal Zbieracza (Picker)',
      category: 'Stanowiska Magazynowe',
      icon: Package,
      action: () => {
        window.open('/terminal?role=picker', '_blank');
        onClose();
      }
    },
    {
      id: 'action-terminal-packer',
      type: 'action',
      title: 'Otwórz Terminal Pakowacza (Packer)',
      category: 'Stanowiska Magazynowe',
      icon: Truck,
      action: () => {
        window.open('/terminal?role=packer', '_blank');
        onClose();
      }
    }
  ];

  const navigationItems = sideNavItems.map(item => ({
    id: `nav-${item.id}`,
    tabId: item.id,
    type: 'nav',
    title: item.label,
    category: 'Nawigacja Modułów',
    icon: item.icon,
    action: () => {
      onNavigate(item.id);
      onClose();
    }
  }));

  const allItems = [
    ...navigationItems,
    ...quickActions
  ];

  const filteredItems = allItems.filter(item => 
    fuzzyMatch(query, item.title) || fuzzyMatch(query, item.category)
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          sounds.playSuccess();
          filteredItems[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  // Keep selected item in view
  useEffect(() => {
    const activeEl = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Szukaj widoku, akcji, SKU, zamówienia... (np. 'zamówienia', 'dark mode', 'inwentarz')"
            className="w-full bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
            ESC aby zamknąć
          </kbd>
        </div>

        {/* Bookmarks Quick Bar (if no query) */}
        {!query && bookmarks.length > 0 && (
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-blue-50/30 dark:bg-blue-950/20 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1 shrink-0">
              <Star className="w-3 h-3 fill-amber-400 text-amber-500" /> Ulubione:
            </span>
            {bookmarks.map(tabId => {
              const navItem = sideNavItems.find(i => i.id === tabId);
              if (!navItem) return null;
              const IconComp = navItem.icon;
              return (
                <button
                  key={tabId}
                  onClick={() => {
                    sounds.playSuccess();
                    onNavigate(tabId);
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-xs"
                >
                  <IconComp className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span>{navItem.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 space-y-1 flex-grow">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-semibold">Brak wyników dla zapytania "{query}"</p>
              <p className="text-[11px] mt-1 text-slate-400">Spróbuj wpisać inną frazę lub skorzystaj z nawigacji bocznej.</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const IconComp = item.icon;
              const isPinned = item.tabId ? bookmarks.includes(item.tabId) : false;

              return (
                <div
                  key={item.id}
                  data-index={idx}
                  onClick={() => {
                    sounds.playSuccess();
                    item.action();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3 py-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg ${
                      isSelected 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                    }`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                        {item.title}
                      </div>
                      <div className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'}`}>
                        {item.category}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.tabId && (
                      <button
                        type="button"
                        onClick={(e) => toggleBookmark(item.tabId!, e)}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                          isSelected 
                            ? 'hover:bg-blue-500 text-white' 
                            : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400'
                        }`}
                        title={isPinned ? 'Usuń z ulubionych' : 'Przypnij do ulubionych'}
                      >
                        <Star className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    )}
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-blue-200 animate-pulse" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono text-[9px] bg-slate-200 dark:bg-slate-800 rounded">↑↓</kbd> Nawigacja
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono text-[9px] bg-slate-200 dark:bg-slate-800 rounded">↵</kbd> Wybierz
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            WMS Command Engine v2.4
          </span>
        </div>
      </div>
    </div>
  );
}

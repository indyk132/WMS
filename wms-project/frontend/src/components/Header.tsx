import React, { useState } from 'react';
import { Volume2, VolumeX, Search, Bell, Settings, HelpCircle, Menu, Home, LogOut, AlertCircle, AlertTriangle, Info, BookOpen, PlayCircle, Terminal, Headphones, Mail, Phone, RefreshCw } from 'lucide-react';
import { sounds } from './SoundEffects';

interface HeaderProps {
    currentTab: string;
    onSearchChange: (val: string) => void;
    searchQuery: string;
    currentUser: any;
    onLogout: () => void;
    onMobileMenuToggle: () => void;
    onSettingsClick: () => void;
    notifications: any[];
    readNotificationIds: string[];
    onMarkAllAsRead: () => void;
    onNotificationClick: (targetTab: string, notificationId: string, targetId?: string) => void;
    onRefreshData?: () => void;
    isRefreshing?: boolean;
    soundEnabled?: boolean;
    onToggleSound?: () => void;
}

export default function Header({
    currentTab,
    onSearchChange,
    searchQuery,
    currentUser,
    onLogout,
    onMobileMenuToggle,
    onSettingsClick,
    notifications = [],
    readNotificationIds = [],
    onMarkAllAsRead,
    onNotificationClick,
    onRefreshData,
    isRefreshing = false,
    soundEnabled = true,
    onToggleSound,
}: HeaderProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);
    const [helpSearchQuery, setHelpSearchQuery] = useState('');
    const [activeHelpTopic, setActiveHelpTopic] = useState<string | null>(null);

    const [selectedLanguage, setSelectedLanguage] = useState<'PL' | 'UA' | 'EN'>('PL');
    const [langDropdownOpen, setLangDropdownOpen] = useState(false);

    const handleLanguageSelect = (langCode: 'PL' | 'UA' | 'EN') => {
        sounds.playSuccess();
        setSelectedLanguage(langCode);
        setLangDropdownOpen(false);
    };

    const helpLinks = [
        { id: 'user-manual', label: 'Instrukcja użytkownika', icon: BookOpen },
        { id: 'video-tutorials', label: 'Samouczki wideo', icon: PlayCircle },
        { id: 'api-reference', label: 'Dokumentacja API', icon: Terminal },
    ];

    const helpIssues = [
        { id: 'reset-task', label: 'Jak zresetować zadanie kompletacji?' },
        { id: 'label-printing', label: 'Problemy z drukowaniem etykiet' },
        { id: 'scanner-pairing', label: 'Brak połączenia ze skanerem kodów' },
    ];

    const filteredHelpLinks = helpLinks.filter(link => 
        link.label.toLowerCase().includes(helpSearchQuery.toLowerCase())
    );

    const filteredHelpIssues = helpIssues.filter(issue => 
        issue.label.toLowerCase().includes(helpSearchQuery.toLowerCase())
    );

    const getTabLabel = () => {
        switch (currentTab) {
            case 'overview':
                return 'Podgląd Magazynu';
            case 'orders':
                return 'Zarządzanie Zamówieniami';
            case 'zones':
                return 'Strefy Magazynowe';
            case 'permissions':
                return 'Uprawnienia Użytkowników';
            case 'inventory':
                return 'Stany Zapasów SKU';
            case 'products':
                return 'Katalog Produktów';
            default:
                return 'Panel Administracyjny';
        }
    };

    return (
        <header className="fixed top-0 right-0 left-0 lg:left-[260px] h-14 bg-white border-b border-zinc-200 shadow-sm flex justify-between items-center px-6 z-30 transition-all">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMobileMenuToggle}
                    className="lg:hidden p-1.5 rounded hover:bg-zinc-100 text-zinc-600 transition-colors cursor-pointer"
                    title="Otwórz menu"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <h2 className="font-sans text-sm font-bold text-zinc-900 hidden sm:block">
                    Panel Administratora
                </h2>
                <div className="h-4 w-px bg-zinc-200 hidden sm:block"></div>
                <span className="font-sans text-[11px] text-zinc-500 font-medium flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-zinc-400">/</span>
                    <span className="text-zinc-700">{getTabLabel()}</span>
                </span>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative hidden md:block group">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="h-9 w-64 pl-9 pr-12 rounded border border-zinc-200 bg-zinc-50 font-sans text-xs text-zinc-800 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-zinc-400 shadow-inner"
                        placeholder="Szukaj SKU, zamówień, personelu..."
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5 pointer-events-none">
                        <kbd className="px-1 py-0.5 text-[9px] font-mono text-zinc-400 bg-zinc-200/60 rounded border border-zinc-300">⌘</kbd>
                        <kbd className="px-1 py-0.5 text-[9px] font-mono text-zinc-400 bg-zinc-200/60 rounded border border-zinc-300">K</kbd>
                    </div>
                </div>

                <div className="flex gap-1 text-zinc-500">
                    {onRefreshData && (
                        <button 
                            onClick={onRefreshData}
                            disabled={isRefreshing}
                            className="p-1.5 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer flex items-center justify-center disabled:opacity-50" 
                            title="Odśwież dane z bazy"
                        >
                            <RefreshCw className={`w-4.5 h-4.5 text-zinc-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    )}
                    {onToggleSound && (
                        <button 
                            onClick={onToggleSound}
                            className="p-1.5 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer flex items-center justify-center"
                            title={soundEnabled ? "Wycisz dźwięki powiadomień" : "Włącz dźwięki powiadomień"}
                        >
                            {soundEnabled ? <Volume2 className="w-4.5 h-4.5 text-zinc-600" /> : <VolumeX className="w-4.5 h-4.5 text-zinc-400" />}
                        </button>
                    )}
                    <div className="relative">
                        <button 
                            onClick={() => setNotificationsOpen(!notificationsOpen)}
                            className="p-1.5 relative hover:bg-zinc-100 rounded-full transition-colors cursor-pointer" 
                            title="Powiadomienia"
                        >
                            <Bell className="w-4.5 h-4.5 text-zinc-600" />
                            {notifications.some(n => !readNotificationIds.includes(n.id)) && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white animate-pulse"></span>
                            )}
                        </button>

                        {notificationsOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                                <div className="absolute right-0 mt-2 w-80 bg-white border border-zinc-200 rounded-xl shadow-2xl z-50 text-xs font-sans p-4 space-y-3.5 animate-fadeIn">
                                    {/* Header */}
                                    <div className="flex justify-between items-center border-b border-zinc-100 pb-2.5 select-none">
                                        <h4 className="font-extrabold text-zinc-900 text-sm tracking-tight">Powiadomienia</h4>
                                        <button 
                                            onClick={() => {
                                                onMarkAllAsRead();
                                            }}
                                            className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-bold cursor-pointer border-none bg-transparent"
                                        >
                                            Oznacz wszystkie jako przeczytane
                                        </button>
                                    </div>

                                    {/* Body list */}
                                    <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100 pr-1 select-none scrollbar-thin">
                                        {notifications.length === 0 ? (
                                            <p className="text-center text-zinc-400 py-6 font-medium">Brak powiadomień</p>
                                        ) : (
                                            notifications.map((n) => {
                                                const isRead = readNotificationIds.includes(n.id);
                                                return (
                                                    <div 
                                                        key={n.id} 
                                                        onClick={() => {
                                                            if (n.targetTab) {
                                                                onNotificationClick(n.targetTab, n.id, n.targetId);
                                                                setNotificationsOpen(false);
                                                            }
                                                        }}
                                                        className="flex gap-3 py-3 items-start hover:bg-zinc-100/60 transition-colors rounded-lg px-2 -mx-2 cursor-pointer"
                                                    >
                                                        {/* Icon status */}
                                                        <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                                                            n.type === 'error' ? 'bg-red-55/10 text-red-600' :
                                                            n.type === 'warning' ? 'bg-amber-55/10 text-amber-600' :
                                                            'bg-blue-55/10 text-blue-600'
                                                        }`}>
                                                            {n.type === 'error' ? <AlertCircle className="w-4 h-4" /> :
                                                             n.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                                                             <Info className="w-4 h-4" />}
                                                        </div>

                                                        {/* Text and Time */}
                                                        <div className="flex-1 min-w-0 space-y-0.5 text-left">
                                                            <p className={`text-[11px] leading-snug break-words ${isRead ? 'text-zinc-500 font-medium' : 'text-zinc-900 font-extrabold'}`}>
                                                                {n.text}
                                                            </p>
                                                            <p className="text-[9px] text-zinc-400 font-mono tracking-wider uppercase font-semibold">
                                                                {n.time}
                                                            </p>
                                                        </div>
                                                        
                                                        {/* Unread indicator */}
                                                        {!isRead && (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-2 self-start" />
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="border-t border-zinc-100 pt-2.5">
                                        <button 
                                            onClick={() => setNotificationsOpen(false)}
                                            className="text-[10px] text-zinc-500 hover:text-zinc-800 font-bold cursor-pointer border-none bg-transparent block w-full text-center"
                                        >
                                            Zobacz wszystkie
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Language Selector Dropdown */}
                    <div className="relative flex items-center justify-center">
                        <button
                            type="button"
                            onClick={() => {
                                setLangDropdownOpen(!langDropdownOpen);
                                setNotificationsOpen(false);
                                setHelpOpen(false);
                            }}
                            className="h-8 px-2 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 border border-zinc-200 text-xs font-bold text-zinc-700 bg-white"
                            title="Zmień język systemu / Change language"
                        >
                            <span className="text-sm select-none">
                                {selectedLanguage === 'PL' ? '🇵🇱' : selectedLanguage === 'UA' ? '🇺🇦' : '🇬🇧'}
                            </span>
                            <span className="font-mono text-[10px] tracking-wide select-none">{selectedLanguage}</span>
                        </button>

                        {langDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setLangDropdownOpen(false)} />
                                <div className="absolute right-0 mt-2 w-36 bg-white border border-zinc-200 rounded-xl shadow-2xl z-50 text-xs font-sans p-2 space-y-1 animate-fadeIn text-left">
                                    {[
                                        { code: 'PL', label: 'Polski', flag: '🇵🇱' },
                                        { code: 'UA', label: 'Українська', flag: '🇺🇦' },
                                        { code: 'EN', label: 'English', flag: '🇬🇧' }
                                    ].map(lang => (
                                        <button
                                            key={lang.code}
                                            type="button"
                                            onClick={() => handleLanguageSelect(lang.code as any)}
                                            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left font-bold cursor-pointer border-none transition-all ${
                                                selectedLanguage === lang.code
                                                    ? 'bg-indigo-50 text-indigo-700'
                                                    : 'hover:bg-zinc-100 text-zinc-750'
                                            }`}
                                        >
                                            <span className="text-base leading-none select-none">{lang.flag}</span>
                                            <span className="font-sans text-[11px] leading-none">{lang.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <button 
                        onClick={onSettingsClick}
                        className="p-1.5 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer" 
                        title="Ustawienia osobiste i profil"
                    >
                        <Settings className="w-4.5 h-4.5 text-zinc-650" />
                    </button>
                    <div className="relative">
                        <button 
                            onClick={() => {
                                setHelpOpen(!helpOpen);
                                setNotificationsOpen(false);
                            }}
                            className="p-1.5 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer flex items-center justify-center border-none bg-transparent" 
                            title="Centrum Pomocy"
                        >
                            <HelpCircle className="w-4.5 h-4.5 text-zinc-650" />
                        </button>

                        {helpOpen && (
                            <>
                                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setHelpOpen(false)} />
                                <div className="absolute right-0 mt-2 w-72 bg-white border border-zinc-200 rounded-xl shadow-2xl z-50 text-xs font-sans p-4 space-y-3.5 animate-fadeIn select-none">
                                    {/* Header */}
                                    <div className="flex items-center gap-2 border-b border-zinc-100 pb-2.5">
                                        <HelpCircle className="w-4 h-4 text-blue-600" />
                                        <h4 className="font-extrabold text-zinc-900 text-sm tracking-tight">Centrum Pomocy & Wsparcie</h4>
                                    </div>

                                    {/* Search Bar */}
                                    <div className="relative">
                                        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            placeholder="Szukaj w dokumentacji..."
                                            value={helpSearchQuery}
                                            onChange={(e) => setHelpSearchQuery(e.target.value)}
                                            className="w-full pl-8 pr-3 py-1.5 border border-zinc-250 rounded bg-white text-zinc-900 outline-none focus:border-blue-500 text-[11px]"
                                        />
                                    </div>

                                    {/* Quick links list */}
                                    <div className="space-y-2 select-none">
                                        <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-0.5">SZYBKIE LINKI</div>
                                        {filteredHelpLinks.map((link) => (
                                            <button
                                                key={link.id}
                                                onClick={() => {
                                                    setActiveHelpTopic(link.id);
                                                    setHelpOpen(false);
                                                }}
                                                className="w-full flex items-center gap-2.5 text-left text-zinc-700 hover:text-blue-600 font-bold hover:bg-zinc-50 py-1.5 px-2 rounded-lg transition-colors border-none bg-transparent cursor-pointer text-xs"
                                            >
                                                <link.icon className="w-4 h-4 text-zinc-450 shrink-0" />
                                                {link.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Common Issues list */}
                                    <div className="space-y-2 select-none border-t border-zinc-100 pt-3">
                                        <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-0.5">NAJCZĘSTSZE PROBLEMY</div>
                                        {filteredHelpIssues.map((issue) => (
                                            <button
                                                key={issue.id}
                                                onClick={() => {
                                                    setActiveHelpTopic(issue.id);
                                                    setHelpOpen(false);
                                                }}
                                                className="w-full text-left text-zinc-650 hover:text-blue-600 hover:underline py-1 px-2 hover:bg-zinc-50 rounded transition-colors border-none bg-transparent cursor-pointer text-xs"
                                            >
                                                {issue.label}
                                            </button>
                                        ))}
                                        {filteredHelpLinks.length === 0 && filteredHelpIssues.length === 0 && (
                                            <p className="text-center text-zinc-400 py-3 font-medium text-[11px]">Brak wyników wyszukiwania</p>
                                        )}
                                    </div>

                                    {/* Footer Contact Support */}
                                    <div className="border-t border-zinc-100 pt-3 select-none">
                                        <button 
                                            onClick={() => {
                                                setActiveHelpTopic('contact-support');
                                                setHelpOpen(false);
                                            }}
                                            className="w-full py-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-700 font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs"
                                        >
                                            <Headphones className="w-3.5 h-3.5 text-zinc-500" />
                                            Skontaktuj się ze wsparciem
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 border-l border-zinc-200 pl-4 relative">
                    <div className="flex flex-col text-right hidden lg:flex">
                        <span className="text-xs font-semibold text-zinc-900 leading-none">
                            {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'System Admin'}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono mt-1 tracking-wider uppercase">
                            {currentUser ? currentUser.role : 'WMS LOGO'}
                        </span>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="w-9 h-9 rounded-full bg-blue-50 border border-zinc-200 overflow-hidden cursor-pointer flex items-center justify-center hover:ring-2 hover:ring-blue-500/20 transition-all shadow-sm"
                        >
                            <img
                                alt="Profile Avatar"
                                className="w-full h-full object-cover"
                                src={currentUser?.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuACWjGGBdeCrAJ7AB6UErTkmwCPWCaEwEX1V9thIZNwuEbV15c9lbNmMHJHwd_QNwOQQ6zLNoQhB-p2UU81Vxv65-P4bAo91PRw_dDG_jPfLA-Pl2x24GTY02pyI1pRR7xFf_jPW7vAFJ85TUGWsVdRzByms2f8N3KB13bNNKNIdsBm7wdUOKnAVVYlBTV22AhJdP797M6URJ_dHyE0AvRm5_o243Vnq9cRZlfZzGTTklOsREa6OzMAPeqrrr43b32LU1yNDzx3S_4"}
                            />
                        </button>

                        {dropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded shadow-md z-50 text-xs font-sans">
                                    <div className="p-3 border-b border-zinc-100">
                                        <p className="font-bold text-zinc-800">{currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'System Admin'}</p>
                                        <p className="text-[10px] text-zinc-400 truncate">{currentUser ? currentUser.email : 'admin@logistics-os.com'}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setDropdownOpen(false);
                                            onSettingsClick();
                                        }}
                                        className="w-full text-left px-3 py-2 text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 transition-colors font-semibold cursor-pointer border-none bg-transparent"
                                    >
                                        <Settings className="w-3.5 h-3.5 text-zinc-400" />
                                        Profil & Preferencje
                                    </button>
                                    <button
                                        onClick={() => {
                                            setDropdownOpen(false);
                                            onLogout();
                                        }}
                                        className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-semibold cursor-pointer border-none bg-transparent"
                                    >
                                        <LogOut className="w-3.5 h-3.5" />
                                        Wyloguj się
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {activeHelpTopic && (
                <>
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs" onClick={() => setActiveHelpTopic(null)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <div className="bg-white rounded-xl border border-zinc-200 w-full max-w-lg shadow-2xl overflow-hidden font-sans text-xs pointer-events-auto flex flex-col max-h-[85vh]">
                            {/* Modal Header */}
                            <div className="px-5 py-4 bg-[#0f172a] text-white flex justify-between items-center select-none border-b border-slate-800">
                                <div className="flex items-center gap-2">
                                    <HelpCircle className="w-4 h-4 text-blue-400 animate-pulse" />
                                    <h3 className="font-extrabold text-sm tracking-tight">
                                        {activeHelpTopic === 'user-manual' && "Centrum Pomocy: Instrukcja użytkownika"}
                                        {activeHelpTopic === 'video-tutorials' && "Centrum Pomocy: Samouczki wideo"}
                                        {activeHelpTopic === 'api-reference' && "Centrum Pomocy: Dokumentacja API"}
                                        {activeHelpTopic === 'reset-task' && "Najczęstsze problemy: Resetowanie zadania"}
                                        {activeHelpTopic === 'label-printing' && "Najczęstsze problemy: Drukowanie etykiet"}
                                        {activeHelpTopic === 'scanner-pairing' && "Najczęstsze problemy: Parowanie skanera"}
                                        {activeHelpTopic === 'contact-support' && "Wsparcie techniczne WMS"}
                                    </h3>
                                </div>
                                <button 
                                    onClick={() => setActiveHelpTopic(null)} 
                                    className="text-zinc-400 hover:text-white cursor-pointer font-bold text-lg bg-transparent border-none outline-none"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(85vh-80px)] text-zinc-700 leading-relaxed text-xs">
                                {activeHelpTopic === 'user-manual' && (
                                    <div className="space-y-4">
                                        <p className="font-medium">Witamy w instrukcji obsługi systemu **Logistics OS WMS**. Poniżej opisano główne moduły aplikacji:</p>
                                        
                                        <div className="space-y-2">
                                            <h4 className="font-extrabold text-zinc-900 border-l-2 border-blue-500 pl-2 text-xs uppercase tracking-wider">1. Podgląd Magazynu</h4>
                                            <p className="pl-2.5">Ekran główny prezentuje kluczowe wskaźniki wydajności (KPI) oraz dziennik operacji magazynowych na żywo. Możesz tu szybko sprawdzić aktualną zajętość stref i statusy realizacji zleceń.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <h4 className="font-extrabold text-zinc-900 border-l-2 border-blue-500 pl-2 text-xs uppercase tracking-wider">2. Katalog Zapasów SKU</h4>
                                            <p className="pl-2.5">Lista wszystkich indeksów towarowych w magazynie. Umożliwia filtrowanie po nazwie lub kodzie SKU oraz ręczne dostosowanie stanów zapasów w przypadku wystąpienia rozbieżności (inwentaryzacja).</p>
                                        </div>

                                        <div className="space-y-2">
                                            <h4 className="font-extrabold text-zinc-900 border-l-2 border-blue-500 pl-2 text-xs uppercase tracking-wider">3. Mapa Obiektu (Strefy)</h4>
                                            <p className="pl-2.5">Graficzna wizualizacja rozmieszczenia towarów w blokach: **A (Żywność)**, **B (Tech/Biuro)** oraz **C (Hazmat)**. Pozwala na blokowanie korytarzy w przypadku prac konserwacyjnych.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <h4 className="font-extrabold text-zinc-900 border-l-2 border-blue-500 pl-2 text-xs uppercase tracking-wider">4. Zamówienia (Outbound)</h4>
                                            <p className="pl-2.5">Centrum zarządzania wysyłkami. Umożliwia tworzenie nowych zleceń wydań zewnętrznych, podgląd historii logów zmian oraz generowanie listów przewozowych.</p>
                                        </div>
                                    </div>
                                )}

                                {activeHelpTopic === 'video-tutorials' && (
                                    <div className="space-y-4">
                                        <p className="font-medium">Obejrzyj krótkie samouczki wideo, aby szybko wdrożyć się w obsługę procesów magazynowych:</p>
                                        
                                        {/* Mock Player */}
                                        <div className="bg-slate-900 text-zinc-400 rounded-lg aspect-video flex flex-col justify-between p-3.5 relative overflow-hidden select-none border border-slate-800">
                                            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center">
                                                <div className="w-14 h-14 rounded-full bg-blue-600/90 text-white flex items-center justify-center hover:scale-105 hover:bg-blue-550 transition-all cursor-pointer shadow-lg">
                                                    <PlayCircle className="w-8 h-8 animate-pulse" />
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-zinc-350 font-bold z-10">Odtwarzacz Wideo WMS</div>
                                            <div className="w-full flex items-center gap-2.5 z-10 text-[9px]">
                                                <span>0:00</span>
                                                <div className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
                                                    <div className="w-1/3 h-full bg-blue-500 rounded-full" />
                                                </div>
                                                <span>03:10</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2.5 mt-2">
                                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-0.5">Dostępne samouczki</div>
                                            {[
                                                { title: 'Obsługa Terminala Pakowacza (Outbound)', duration: '02:45 min', current: true },
                                                { title: 'Ścieżka Zbiórki FIFO i Układanie Towarów', duration: '04:15 min', current: false },
                                                { title: 'Konfiguracja i Kalibracja drukarki Zebra', duration: '03:10 min', current: false },
                                            ].map((vid, idx) => (
                                                <div key={idx} className={`p-2.5 rounded-lg border flex justify-between items-center cursor-pointer transition-colors ${vid.current ? 'bg-blue-55/10 border-blue-250 text-blue-900 font-bold' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-zinc-750'}`}>
                                                    <div className="flex items-center gap-2">
                                                        <PlayCircle className={`w-4 h-4 ${vid.current ? 'text-blue-600' : 'text-zinc-400'}`} />
                                                        <span>{vid.title}</span>
                                                    </div>
                                                    <span className="text-[10px] font-mono font-medium text-zinc-450">{vid.duration}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeHelpTopic === 'api-reference' && (
                                    <div className="space-y-4">
                                        <p className="font-medium">Połącz swój system ERP lub sklep internetowy bezpośrednio z platformą WMS:</p>
                                        
                                        <div className="space-y-1.5">
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-0.5 block">1. POBIERANIE KATALOGU ZAPASÓW SKU</span>
                                            <div className="bg-[#0f172a] text-zinc-200 p-3.5 rounded-lg font-mono text-[10px] space-y-1.5 overflow-x-auto border border-slate-800 leading-snug">
                                                <p className="text-emerald-400">GET /api/v1/inventory</p>
                                                <p className="text-slate-400">Headers: Authorization: Bearer wms_live_pk_...</p>
                                                <div className="text-[9px] text-zinc-400 border-t border-slate-800 pt-1.5 mt-1.5">
                                                    <p>Response [200 OK]:</p>
                                                    <p className="text-amber-300">{"{"}</p>
                                                    <p className="text-amber-300">{"  \"sku\": \"AUTO-AKU-001\","}</p>
                                                    <p className="text-amber-300">{"  \"name\": \"Akumulator 74Ah 12V\","}</p>
                                                    <p className="text-amber-300">{"  \"stock\": 25"}</p>
                                                    <p className="text-amber-300">{"}"}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-0.5 block">2. TWORZENIE ZLECENIA WYDANIA (OUTBOUND)</span>
                                            <div className="bg-[#0f172a] text-zinc-200 p-3.5 rounded-lg font-mono text-[10px] space-y-1.5 overflow-x-auto border border-slate-800 leading-snug">
                                                <p className="text-blue-400">POST /api/v1/orders</p>
                                                <div className="text-[9px] text-zinc-400 border-t border-slate-800 pt-1.5 mt-1.5">
                                                    <p>Payload:</p>
                                                    <p className="text-amber-300">{"{"}</p>
                                                    <p className="text-amber-300">{"  \"customer\": \"Klient Testowy\","}</p>
                                                    <p className="text-amber-300">{"  \"items\": [{\"sku\": \"AUTO-AKU-001\", \"qty\": 2}]"}</p>
                                                    <p className="text-amber-300">{"}"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeHelpTopic === 'reset-task' && (
                                    <div className="space-y-4">
                                        <div className="bg-amber-50 border border-amber-250 text-amber-900 p-3.5 rounded-lg flex gap-2.5 items-start">
                                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-extrabold text-[11px]">Kiedy resetować zadanie?</p>
                                                <p className="text-[10.5px] mt-0.5 leading-snug">Zresetowanie zadania kompletacji powinno nastąpić tylko wtedy, gdy magazynier (Picker) nie może fizycznie odnaleźć towaru na półce lub skaner zgłasza nieusuwalny błąd lokalizacji.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 mt-4">
                                            <div className="flex gap-3 items-start">
                                                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 font-mono">1</div>
                                                <p className="text-zinc-750 text-xs">Uruchom **Terminal Pracownika** (przycisk w prawym górnym rogu na ekranie głównym lub ścieżka `/terminal`).</p>
                                            </div>
                                            <div className="flex gap-3 items-start">
                                                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 font-mono">2</div>
                                                <p className="text-zinc-750 text-xs">Zaloguj się podając identyfikator pracownika (np. **STF-01**).</p>
                                            </div>
                                            <div className="flex gap-3 items-start">
                                                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 font-mono">3</div>
                                                <p className="text-zinc-750 text-xs">W prawym górnym rogu aktywnego zlecenia kompletacji kliknij czerwony przycisk **Zresetuj zadanie**.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeHelpTopic === 'label-printing' && (
                                    <div className="space-y-4">
                                        <p className="font-medium">Jeśli etykieta kurierska (np. DHL/DPD) nie chce się wydrukować, wykonaj następujące czynności:</p>
                                        
                                        <div className="space-y-3">
                                            <div className="flex gap-3 items-start">
                                                <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 font-mono">1</div>
                                                <div>
                                                    <p className="font-bold text-zinc-900">Sprawdzenie fizycznego połączenia</p>
                                                    <p className="text-zinc-500 text-[11px] mt-0.5 leading-snug">Upewnij się, że drukarka termiczna jest podłączona do sieci LAN lub bezpośrednio do stacji pakowania przez port USB i świeci zielona dioda LED.</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3 items-start">
                                                <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 font-mono">2</div>
                                                <div>
                                                    <p className="font-bold text-zinc-900">Rozmiar i orientacja papieru</p>
                                                    <p className="text-zinc-500 text-[11px] mt-0.5 leading-snug">Domyślny rozmiar etykiet w systemie to **100x150 mm**. W ustawieniach sterownika drukarki na komputerze ustaw właściwy format nośnika i wyłącz skalowanie.</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3 items-start">
                                                <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 font-mono">3</div>
                                                <div>
                                                    <p className="font-bold text-zinc-900">Błąd integracji API</p>
                                                    <p className="text-zinc-500 text-[11px] mt-0.5 leading-snug">W zakładce **Ustawienia &rarr; Integracje** upewnij się, że klucz API Logistics OS jest prawidłowy. Brak połączenia z kurierem uniemożliwia wygenerowanie kodu kreskowego etykiety.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeHelpTopic === 'scanner-pairing' && (
                                    <div className="space-y-4">
                                        <p className="font-medium">Instrukcja szybkiego parowania bezprzewodowego skanera kodów kreskowych:</p>
                                        
                                        <div className="space-y-3">
                                            <div className="flex gap-3 items-start">
                                                <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 font-mono">1</div>
                                                <p className="text-zinc-750 text-xs leading-snug">Zeskanuj z papierowej instrukcji skanera kod kreskowy **Reset do ustawień fabrycznych** (Factory Reset).</p>
                                            </div>
                                            <div className="flex gap-3 items-start">
                                                <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 font-mono">2</div>
                                                <p className="text-zinc-750 text-xs leading-snug">Włącz tryb parowania Bluetooth (zwykle poprzez przytrzymanie przycisku skanowania przez 8 sekund lub zeskanowanie kodu parowania) i wyszukaj urządzenie w systemie Windows.</p>
                                            </div>
                                            <div className="flex gap-3 items-start">
                                                <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 font-mono">3</div>
                                                <p className="text-zinc-750 text-xs leading-snug">**Ważne:** Zeskanuj kod konfiguracji kończącej kod (sufiks), wybierając **Enter (CR/LF)**. Dzięki temu po zeskanowaniu SKU system automatycznie zatwierdzi formularz bez konieczności klikania myszką.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeHelpTopic === 'contact-support' && (
                                    <div className="space-y-4">
                                        <p className="font-medium">Potrzebujesz bezpośredniej pomocy technicznej administratora? Skorzystaj z poniższych kanałów kontaktu:</p>
                                        
                                        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl space-y-3 font-sans">
                                            <div className="flex items-center gap-3">
                                                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Email wsparcia</p>
                                                    <p className="text-xs font-bold text-blue-900 mt-1 select-all">wsparcie@wms-logistics.pl</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 border-t border-blue-200/50 pt-3">
                                                <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Telefon (magazyn stacjonarny)</p>
                                                    <p className="text-xs font-bold text-blue-900 mt-1">+48 22 123 45 67 (wewn. 3)</p>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-[10.5px] text-zinc-450 italic leading-snug">Dla klientów o statusie umowy SLA Enterprise wsparcie telefoniczne w korytarzach kompletacji działa całodobowo (24/7/365).</p>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="px-5 py-3.5 bg-slate-50 border-t border-zinc-200 flex justify-end">
                                <button
                                    onClick={() => setActiveHelpTopic(null)}
                                    className="px-4 py-1.5 rounded bg-[#0f172a] hover:bg-[#1e293b] text-white font-extrabold transition-colors cursor-pointer text-xs border-none"
                                >
                                    Zamknij
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </header>
    );
}

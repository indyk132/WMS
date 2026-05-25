import React, { useState } from 'react';
import { Search, Bell, Settings, HelpCircle, Menu, Home, User, LogOut } from 'lucide-react';

export default function Header({
                                   currentTab,
                                   onSearchChange,
                                   searchQuery,
                                   currentUser,
                                   onLogout,
                                   onMobileMenuToggle,
                               }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Map tabs to beautiful names
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
            case 'products':
                return 'Stany Zapasów SKU';
            default:
                return 'Panel Administracyjny';
        }
    };

    return (
        <header className="fixed top-0 right-0 left-0 lg:left-[260px] h-14 bg-white border-b border-zinc-200 shadow-sm flex justify-between items-center px-6 z-30 transition-all">
            <div className="flex items-center gap-4">
                {/* Mobile Menu Trigger */}
                <button
                    onClick={onMobileMenuToggle}
                    className="lg:hidden p-1.5 rounded hover:bg-zinc-100 text-zinc-650 transition-colors"
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
                {/* Global Search */}
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

                {/* System Action Icons */}
                <div className="flex gap-1 text-zinc-500">
                    <button className="p-1.5 relative hover:bg-zinc-100 rounded-full transition-colors" title="Powiadomienia">
                        <Bell className="w-4.5 h-4.5 text-zinc-650" />
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white"></span>
                    </button>
                    <button className="p-1.5 hover:bg-zinc-100 rounded-full transition-colors" title="Ustawienia systemowe">
                        <Settings className="w-4.5 h-4.5 text-zinc-650" />
                    </button>
                    <button className="p-1.5 hover:bg-zinc-100 rounded-full transition-colors" title="Centrum Pomocy">
                        <HelpCircle className="w-4.5 h-4.5 text-zinc-650" />
                    </button>
                </div>

                {/* User Card Avatar & Settings Trigger */}
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
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-250 rounded shadow-md z-50 text-xs font-sans">
                                    <div className="p-3 border-b border-zinc-100">
                                        <p className="font-bold text-zinc-800">{currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'System Admin'}</p>
                                        <p className="text-[10px] text-zinc-400 truncate">{currentUser ? currentUser.email : 'admin@logistics-os.com'}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setDropdownOpen(false);
                                            onLogout();
                                        }}
                                        className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-semibold"
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
        </header>
    );
}

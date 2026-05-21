import React from 'react';
import { Warehouse, ArrowRight, ShieldCheck, Zap, Layers, Cpu } from 'lucide-react';

export default function Home({ onEnterDashboard, currentUser }) {
    return (
        <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col justify-between py-12 px-6 font-sans relative overflow-hidden">
            {/* Visual top bar */}
            <div className="max-w-6xl mx-auto w-full flex justify-between items-center pb-8 border-b border-zinc-200">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white shadow">
                        <Warehouse className="w-4.5 h-4.5" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">Logistics OS</span>
                </div>
                <div className="text-xs text-zinc-500 font-mono">
                    ZALOGOWANO: <span className="font-bold text-zinc-805 uppercase">{currentUser ? currentUser.role : 'ADMIN'}</span>
                </div>
            </div>

            {/* Main Hero Card */}
            <div className="max-w-4xl mx-auto w-full text-center py-16 px-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6 animate-pulse">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Inteligentny System Kontroli Magazynu
                </div>

                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-zinc-900">
                    Usprawnij Operacje Logistyczne z <span className="text-blue-600">Logistics OS</span>
                </h1>

                <p className="mt-4 text-zinc-600 max-w-2xl mx-auto text-base leading-relaxed">
                    Zintegrowana konsola czasu rzeczywistego do zarządzania stanem zapasów, zamówieniami, sekcjami temperaturowymi hal magazynowych oraz uprawnieniami personelu.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                    <button
                        onClick={onEnterDashboard}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-750 text-white font-bold rounded shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                    >
                        Wejdź do panelu kontrolnego
                        <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => window.open('https://github.com', '_blank')}
                        className="px-6 py-3 border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold rounded transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                    >
                        Pobierz dokumentację API
                    </button>
                </div>
            </div>

            {/* Three Pillars Section */}
            <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
                <div className="bg-white p-6 rounded-lg border border-zinc-200 shadow-sm">
                    <div className="w-10 h-10 rounded bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                        <Layers className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-zinc-900 text-sm">Przegląd całościowy (Overview)</h3>
                    <p className="text-zinc-500 text-xs mt-2 leading-relaxed">
                        Śledź stany krytyczne, towary niskiego stanu i nadchodzące dostawy w ułamku sekundy z interaktywnymi wykresami.
                    </p>
                </div>

                <div className="bg-white p-6 rounded-lg border border-zinc-200 shadow-sm">
                    <div className="w-10 h-10 rounded bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                        <Cpu className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-zinc-900 text-sm">Mapowanie Hal w 2D (Interactive Map)</h3>
                    <p className="text-zinc-500 text-xs mt-2 leading-relaxed">
                        Wizualny rozkład stref Ambient, Cold Storage i Hazmat z podziałem na obciążenie regałów paletowych.
                    </p>
                </div>

                <div className="bg-white p-6 rounded-lg border border-zinc-200 shadow-sm">
                    <div className="w-10 h-10 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                        <Zap className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-zinc-900 text-sm">Szybkie Akcje i Bezpieczeństwo</h3>
                    <p className="text-zinc-500 text-xs mt-2 leading-relaxed">
                        Przydzielaj zlecenia, aktualizuj uprawnienia i kontroluj blokady całych stref magazynowych za jednym kliknięciem.
                    </p>
                </div>
            </div>

            {/* Footer copyright section */}
            <div className="max-w-6xl mx-auto w-full text-center text-xs text-zinc-400 border-t border-zinc-200 pt-6">
                Logistics OS • Wersja stabilna 4.2.0. Zbudowano na platformie React.
            </div>
        </div>
    );
}

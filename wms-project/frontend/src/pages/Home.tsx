import React from 'react';
import { Warehouse, ArrowRight, ShieldCheck, Zap, Layers, Cpu } from 'lucide-react';

interface HomeProps {
    onEnterDashboard: () => void;
    currentUser: any;
}

export default function Home({ onEnterDashboard, currentUser }: HomeProps) {
    const [showApiDocMsg, setShowApiDocMsg] = React.useState(false);

    return (
        <div className="min-h-screen bg-[#f5f7fa] text-[#0b1c30] flex flex-col justify-between py-12 px-6 font-sans relative overflow-hidden animate-fadeIn">
            <div className="max-w-6xl mx-auto w-full flex justify-between items-center pb-8 border-b border-zinc-200">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white shadow">
                        <Warehouse className="w-4.5 h-4.5" />
                    </div>
                    <span className="font-bold text-lg tracking-tight select-none">Logistics OS</span>
                </div>
                <div className="text-xs text-zinc-500 font-mono select-none">
                    ZALOGOWANO: <span className="font-bold text-zinc-800 uppercase">{currentUser ? currentUser.role : 'ADMIN'}</span>
                </div>
            </div>

            <div className="max-w-4xl mx-auto w-full text-center py-16 px-4 col-span-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6 animate-pulse select-none">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Inteligentny System Kontroli Magazynu
                </div>

                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-zinc-900">
                    Usprawnij Operacje Logistyczne z <span className="text-blue-600">Logistics OS</span>
                </h1>

                <p className="mt-4 text-zinc-600 max-w-2xl mx-auto text-base leading-relaxed">
                    Zintegrowana konsola czasu rzeczywistego do zarządzania stanem zapasów, zamówieniami, sekcjami temperaturowymi hal magazynowych oraz uprawnieniami personelu.
                </p>

                {showApiDocMsg && (
                    <div className="mt-6 p-4 rounded-xl border border-blue-200 bg-blue-50 text-left text-xs max-w-xl mx-auto flex items-start gap-2.5 animate-fadeIn">
                        <Zap className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-extrabold uppercase tracking-wide text-blue-800">DOKUMENTACJA Logistics OS API v4.2.0</span>
                            <p className="text-zinc-700 mt-1 leading-relaxed">
                                System Logistics OS komunikuje się za pomocą protokołu REST API oraz subskrypcji WebSockets. Wszystkie żądania autoryzowane są kluczem <code className="bg-white/80 px-1 border rounded text-blue-800 font-sans font-bold">Bearer LOGISTICS_OS_TOKEN</code>. Adres dokumentacji Swagger został pomyślnie zlokalizowany w sieci wewnętrznej VPN: <code className="text-blue-700 underline font-sans font-bold">https://api-gateway.internal.logistics/docs</code>.
                            </p>
                            <button onClick={() => setShowApiDocMsg(false)} className="mt-2.5 text-[11px] text-blue-750 hover:text-blue-900 font-bold bg-transparent border-none cursor-pointer underline">✕ Zamknij ten komunikat</button>
                        </div>
                    </div>
                )}

                <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                    <button
                        onClick={onEnterDashboard}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-750 text-white font-bold rounded shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-sm border-none"
                    >
                        Wejdź do panelu kontrolnego
                        <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => setShowApiDocMsg(true)}
                        className="px-6 py-3 border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold rounded transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                    >
                        Pobierz dokumentację API
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6 py-8 select-none">
                <div className="bg-white p-6 rounded-lg border border-zinc-200 shadow-sm transition-shadow hover:shadow-md">
                    <div className="w-10 h-10 rounded bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                        <Layers className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-zinc-900 text-sm">Przegląd całościowy</h3>
                    <p className="text-zinc-500 text-xs mt-2 leading-relaxed">
                        Śledź stany krytyczne, towary niskiego stanu i nadchodzące dostawy w ułamku sekundy z interaktywnymi wykresami.
                    </p>
                </div>

                <div className="bg-white p-6 rounded-lg border border-zinc-200 shadow-sm transition-shadow hover:shadow-md">
                    <div className="w-10 h-10 rounded bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                        <Cpu className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-zinc-900 text-sm">Mapowanie Hal w 2D</h3>
                    <p className="text-zinc-500 text-xs mt-2 leading-relaxed">
                        Wizualny rozkład stref Ambient, Cold Storage i Hazmat z podziałem na obciążenie regałów paletowych.
                    </p>
                </div>

                <div className="bg-white p-6 rounded-lg border border-zinc-200 shadow-sm transition-shadow hover:shadow-md">
                    <div className="w-10 h-10 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                        <Zap className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-zinc-900 text-sm">Szybkie Akcje i Bezpieczeństwo</h3>
                    <p className="text-zinc-500 text-xs mt-2 leading-relaxed">
                        Przydzielaj zlecenia, aktualizuj uprawnienia i kontroluj blokady całych stref magazynowych za jednym kliknięciem.
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto w-full text-center text-xs text-zinc-400 border-t border-zinc-200 pt-6 select-none">
                Logistics OS • Wersja stabilna 4.2.0. Zbudowano na platformie React.
            </div>
        </div>
    );
}

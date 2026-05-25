import React from 'react';

export default function Footer() {
    const currentYear = new Date().getFullYear();
    return (
        <footer className="bg-white border-t border-zinc-200 py-4 px-6 text-zinc-500 font-sans text-xs flex flex-col md:flex-row justify-between items-center gap-2 mt-auto">
            <div className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Logistics OS v4.2.0 • Wszystkie systemy sprawne</span>
            </div>
            <div className="flex gap-4 items-center">
                <span>© {currentYear} Logistics OS Inc.</span>
                <span className="text-zinc-300">|</span>
                <span className="hover:text-blue-600 cursor-pointer transition-colors">Dokumentacja</span>
                <span className="text-zinc-300">|</span>
                <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-[10px] text-zinc-600">STREFA: PL-PÓŁNOC-1</span>
            </div>
        </footer>
    );
}

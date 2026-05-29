import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, Warehouse } from 'lucide-react';
import { loginUser } from '../services/usersApi';

export default function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const user = await loginUser({ email, password });
            onLoginSuccess(user);
        } catch (err) {
            setError(err.message || 'Bledny email lub haslo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const fillQuickAdmin = () => {
        setEmail('admin@logistics-os.com');
        setPassword('admin');
        setError('');
    };

    const fillQuickManager = () => {
        setEmail('manager@logistics-os.com');
        setPassword('manager');
        setError('');
    };

    return (
        <div className="min-h-screen bg-[#f4f6f9] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-500/[0.04] blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-600/[0.04] blur-3xl pointer-events-none" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
                <div className="mx-auto h-12 w-12 rounded bg-blue-600 flex items-center justify-center text-white shadow-lg mb-4">
                    <Warehouse className="w-7 h-7" />
                </div>
                <h2 className="text-3xl font-black text-zinc-950 tracking-tight">
                    Logistics OS
                </h2>
                <p className="mt-1.5 text-zinc-500 font-medium tracking-wide">
                    Portal Kontroli Magazynu
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
                <div className="bg-white py-8 px-4 shadow-2xl rounded-lg sm:px-10 border border-zinc-200">
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-xs font-semibold leading-relaxed">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                                Adres e-mail
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                                    <Mail className="w-4 h-4" />
                                </span>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-zinc-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-zinc-50 outline-none text-zinc-850"
                                    placeholder="twoj-email@logistics-os.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                                Haslo dostepu
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                                    <Lock className="w-4 h-4" />
                                </span>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-zinc-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-zinc-50 outline-none text-zinc-850"
                                    placeholder="********"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-md flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
                        >
                            {isSubmitting ? 'Sprawdzanie...' : 'Autoryzuj wejscie'}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-zinc-200">
                        <h3 className="text-zinc-500 text-xs font-bold text-center mb-3 tracking-wide uppercase">
                            Konta demonstracyjne
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={fillQuickAdmin}
                                className="p-2.5 border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 rounded text-left transition-colors cursor-pointer"
                            >
                                <div className="font-bold text-zinc-800 text-[11px] flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                                    Administrator Systemu
                                </div>
                                <div className="text-[10px] text-zinc-500 mt-1">
                                    Haslo: <span className="font-mono font-semibold">admin</span>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={fillQuickManager}
                                className="p-2.5 border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 rounded text-left transition-colors cursor-pointer"
                            >
                                <div className="font-bold text-zinc-800 text-[11px] flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                                    Kierownik Magazynu
                                </div>
                                <div className="text-[10px] text-zinc-500 mt-1">
                                    Haslo: <span className="font-mono font-semibold">manager</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-zinc-200 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                window.location.hash = '#/terminal';
                                window.location.reload();
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                        >
                            Przełącz na Terminal Roboczy Pracownika 📲
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

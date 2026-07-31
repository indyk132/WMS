import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, Warehouse, KeyRound, CheckCircle2 } from 'lucide-react';
import { loginUser, updateUser } from '../services/usersApi';

interface LoginProps {
    onLoginSuccess: (user: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Password reset requirement state
    const [pendingResetUser, setPendingResetUser] = useState<any | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [resetError, setResetError] = useState('');
    const [isResetSubmitting, setIsResetSubmitting] = useState(false);

    const checkPasswordResetRequired = (user: any) => {
        try {
            const rawReq = window.localStorage.getItem('wms-password-reset-required');
            const reqList: string[] = rawReq ? JSON.parse(rawReq) : [];
            const emId = user.employeeId || user.id;
            const emEmail = user.email || '';

            return user.requirePasswordReset || reqList.includes(emId) || (emEmail && reqList.includes(emEmail));
        } catch {
            return false;
        }
    };

    const recordFailedLoginAttempt = (targetEmail: string) => {
        if (!targetEmail) return;
        try {
            const raw = window.localStorage.getItem('wms-failed-login-attempts');
            const data: Record<string, { count: number; lastAttempt: string; ip: string }> = raw ? JSON.parse(raw) : {};
            const key = targetEmail.toLowerCase();
            const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
            
            const existing = data[key] || { count: 0, lastAttempt: nowStr, ip: '192.168.1.105 (Terminal Bramowy)' };
            data[key] = {
                count: existing.count + 1,
                lastAttempt: nowStr,
                ip: existing.ip || '192.168.1.105 (Terminal Bramowy)'
            };
            window.localStorage.setItem('wms-failed-login-attempts', JSON.stringify(data));
            window.dispatchEvent(new CustomEvent('wms-failed-logins-updated', { detail: { email: key } }));
        } catch (e) {
            console.error('Failed recording login attempt:', e);
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const user = await loginUser({ email, password });
            if (checkPasswordResetRequired(user)) {
                setPendingResetUser(user);
            } else {
                onLoginSuccess(user);
            }
        } catch (err: any) {
            setError(err.message || 'Błędny email lub hasło.');
            recordFailedLoginAttempt(email);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePasswordResetSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setResetError('');

        if (newPassword.length < 4) {
            setResetError('Nowe hasło musi składać się z co najmniej 4 znaków.');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setResetError('Podane hasła nie są identyczne.');
            return;
        }

        setIsResetSubmitting(true);
        try {
            const emId = pendingResetUser.employeeId || pendingResetUser.id;
            const emEmail = pendingResetUser.email || '';

            // Remove from requirement list
            try {
                const rawReq = window.localStorage.getItem('wms-password-reset-required');
                const reqList: string[] = rawReq ? JSON.parse(rawReq) : [];
                const updated = reqList.filter(id => id !== emId && id !== emEmail);
                window.localStorage.setItem('wms-password-reset-required', JSON.stringify(updated));
            } catch (e) {
                console.error(e);
            }

            // Update user password via API / localStorage
            try {
                await updateUser(emId, { password: newPassword, requirePasswordReset: false } as any);
            } catch (e) {
                console.warn('Backend update error, updating local:', e);
            }

            const updatedUser = { ...pendingResetUser, password: newPassword, requirePasswordReset: false };
            onLoginSuccess(updatedUser);
        } catch (err: any) {
            setResetError(err.message || 'Wystąpił błąd podczas zmiany hasła.');
        } finally {
            setIsResetSubmitting(false);
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

    const fillQuickSales = () => {
        setEmail('sales@logistics-os.com');
        setPassword('sales');
        setError('');
    };

    const fillQuickPlanner = () => {
        setEmail('planner@logistics-os.com');
        setPassword('planner');
        setError('');
    };

    const fillQuickAuditor = () => {
        setEmail('auditor@logistics-os.com');
        setPassword('auditor');
        setError('');
    };

    if (pendingResetUser) {
        return (
            <div className="min-h-screen bg-[#f5f7fa] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-sm relative overflow-hidden animate-fadeIn">
                <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 select-none">
                    <div className="mx-auto h-12 w-12 rounded bg-blue-600 flex items-center justify-center text-white shadow-lg mb-4">
                        <KeyRound className="w-6 h-6 animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-black text-zinc-950 tracking-tight">
                        Wymagana zmiana hasła
                    </h2>
                    <p className="mt-1.5 text-zinc-500 text-xs font-medium max-w-sm mx-auto">
                        Administrator serwera Logistics OS zobowiązał Cię do zdefiniowania nowego bezpiecznego hasła przed uzyskaniem dostępu.
                    </p>
                </div>

                <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10">
                    <div className="bg-white py-8 px-4 shadow-2xl rounded-lg sm:px-10 border border-blue-200">
                        <form className="space-y-4" onSubmit={handlePasswordResetSubmit}>
                            {resetError && (
                                <div className="bg-red-50 border border-red-200 text-red-750 p-3 rounded text-xs font-semibold leading-relaxed">
                                    {resetError}
                                </div>
                            )}

                            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs font-semibold text-blue-900">
                                Zalogowano jako: <strong>{pendingResetUser.firstName} {pendingResetUser.lastName}</strong> ({pendingResetUser.email})
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                                    Nowe hasło
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                                        <Lock className="w-4 h-4" />
                                    </span>
                                    <input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 border border-zinc-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-zinc-900 bg-zinc-50"
                                        placeholder="Min. 4 znaki..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                                    Potwierdź nowe hasło
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                                        <Lock className="w-4 h-4" />
                                    </span>
                                    <input
                                        type="password"
                                        required
                                        value={confirmNewPassword}
                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 border border-zinc-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-zinc-900 bg-zinc-50"
                                        placeholder="Powtórz nowe hasło..."
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isResetSubmitting}
                                    className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded shadow-sm text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none cursor-pointer active:scale-95 transition-all"
                                >
                                    {isResetSubmitting ? 'Zapisywanie...' : 'Zapisz nowe hasło i przejdź do systemu'}
                                    <CheckCircle2 className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f7fa] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-sm relative overflow-hidden animate-fadeIn">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-500/[0.04] blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-600/[0.04] blur-3xl pointer-events-none" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 select-none">
                <div className="mx-auto h-12 w-12 rounded bg-blue-600 flex items-center justify-center text-white shadow-lg mb-4">
                    <Warehouse className="w-7 h-7 animate-bounce" />
                </div>
                <h2 className="text-3xl font-black text-zinc-950 tracking-tight">
                    Logistics OS
                </h2>
                <p className="mt-1.5 text-zinc-400 font-medium tracking-wide font-mono uppercase">
                    Portal Kontroli Magazynu
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
                <div className="bg-white py-8 px-4 shadow-2xl rounded-lg sm:px-10 border border-zinc-200">
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-750 p-3 rounded text-xs font-semibold leading-relaxed">
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
                                    className="w-full pl-9 pr-3 py-2 border border-zinc-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-zinc-50 outline-none text-zinc-900"
                                    placeholder="twoj-email@logistics-os.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                                Hasło dostępu
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
                                    className="w-full pl-9 pr-3 py-2 border border-zinc-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-zinc-50 outline-none text-zinc-900"
                                    placeholder="********"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-10 bg-[#0052CC] hover:bg-[#0041a3] disabled:opacity-60 text-white font-bold rounded-md flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md border-none"
                        >
                            {isSubmitting ? 'Sprawdzanie...' : 'Zaloguj się'}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-zinc-200">
                        <h3 className="text-zinc-500 text-xs font-bold text-center mb-3 tracking-wide uppercase">
                            Konta demonstracyjne
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={fillQuickAdmin}
                                className="p-2.5 border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 rounded text-left transition-colors cursor-pointer"
                            >
                                <div className="font-bold text-zinc-805 text-[11px] flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                                    Admin
                                </div>
                                <div className="text-[10px] text-zinc-500 mt-1">
                                    Hasło: <span className="font-mono font-semibold">admin</span>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={fillQuickManager}
                                className="p-2.5 border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 rounded text-left transition-colors cursor-pointer"
                            >
                                <div className="font-bold text-zinc-850 text-[11px] flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                                    Kierownik
                                </div>
                                <div className="text-[10px] text-zinc-500 mt-1">
                                    Hasło: <span className="font-mono font-semibold">manager</span>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={fillQuickSales}
                                className="p-2.5 border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 rounded text-left transition-colors cursor-pointer"
                            >
                                <div className="font-bold text-zinc-850 text-[11px] flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    Handlowiec
                                </div>
                                <div className="text-[10px] text-zinc-500 mt-1">
                                    Hasło: <span className="font-mono font-semibold">sales</span>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={fillQuickPlanner}
                                className="p-2.5 border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 rounded text-left transition-colors cursor-pointer"
                            >
                                <div className="font-bold text-zinc-850 text-[11px] flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                                    Planista
                                </div>
                                <div className="text-[10px] text-zinc-500 mt-1">
                                    Hasło: <span className="font-mono font-semibold">planner</span>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={fillQuickAuditor}
                                className="p-2.5 border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 rounded text-left transition-colors cursor-pointer"
                            >
                                <div className="font-bold text-zinc-850 text-[11px] flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                                    Audytor
                                </div>
                                <div className="text-[10px] text-zinc-500 mt-1">
                                    Hasło: <span className="font-mono font-semibold">auditor</span>
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
                            className="text-xs text-blue-650 hover:text-blue-800 font-bold hover:underline cursor-pointer flex items-center justify-center gap-1.5 mx-auto bg-transparent border-none"
                        >
                            Przełącz na Terminal Roboczy Pracownika 📲
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

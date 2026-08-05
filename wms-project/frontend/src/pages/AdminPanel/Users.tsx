import React, { useState, useEffect } from 'react';
import { Plus, ShieldCheck, UserCheck, UserX, Edit2, Trash2, Search, LogOut, AlertTriangle, Radio, KeyRound, ShieldAlert, Globe, Wifi } from 'lucide-react';
import { User } from '../../services/usersApi';

interface UsersPermissionsProps {
    staffList: User[];
    onAddStaff: (newStaff: any) => Promise<User>;
    onUpdateStaff: (id: string, updates: any) => Promise<User>;
    onDeleteStaff: (id: string) => Promise<void>;
    usersSync: { isLoading: boolean; error: string };
    addToast?: (title: string, text: string, type: 'error' | 'warning' | 'info' | 'success') => void;
    logActivity?: (msg: string, type: string, details?: string) => void;
    onForceLogoutUser?: (staffId: string, staffName: string) => void;
}

export default function UsersPermissions({ 
    staffList, 
    onAddStaff, 
    onUpdateStaff, 
    onDeleteStaff, 
    usersSync,
    addToast,
    logActivity,
    onForceLogoutUser
}: UsersPermissionsProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [forceLogoutStaff, setForceLogoutStaff] = useState<User | null>(null);
    const [resetPasswordStaff, setResetPasswordStaff] = useState<User | null>(null);

    // Option 222: Soft-Delete and Restore Engine for Users
    const [softDeletedUserIds, setSoftDeletedUserIds] = useState<string[]>(() => {
        try {
            const saved = window.localStorage.getItem('wms-soft-deleted-users');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [showTrashBasket, setShowTrashBasket] = useState(false);

    const handleSoftDelete = (id: string, name: string) => {
        const updated = [...softDeletedUserIds, id];
        setSoftDeletedUserIds(updated);
        try {
            window.localStorage.setItem('wms-soft-deleted-users', JSON.stringify(updated));
        } catch (e) { console.error(e); }
        if (addToast) addToast('Przeniesiono do kosza (Soft-Delete)', `Użytkownik ${name} został przenieśmy do kosza z opcją przywrócenia.`, 'warning');
        if (logActivity) logActivity(`Soft-delete dla użytkownika ${name}`, 'warning');
    };

    const handleRestoreUser = (id: string, name: string) => {
        const updated = softDeletedUserIds.filter(i => i !== id);
        setSoftDeletedUserIds(updated);
        try {
            window.localStorage.setItem('wms-soft-deleted-users', JSON.stringify(updated));
        } catch (e) { console.error(e); }
        if (addToast) addToast('Przywrócono użytkownika', `Przywrócono użytkownika ${name} z kosza.`, 'success');
        if (logActivity) logActivity(`Przywrócenie z kosza użytkownika ${name}`, 'info');
    };

    const [forcedLoggedOutIds, setForcedLoggedOutIds] = useState<string[]>(() => {
        try {
            const saved = window.localStorage.getItem('wms-forced-logouts');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [passwordResetRequiredIds, setPasswordResetRequiredIds] = useState<string[]>(() => {
        try {
            const saved = window.localStorage.getItem('wms-password-reset-required');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [failedLogins, setFailedLogins] = useState<Record<string, { count: number; lastAttempt: string; ip: string }>>(() => {
        try {
            const saved = window.localStorage.getItem('wms-failed-login-attempts');
            if (saved) return JSON.parse(saved);
        } catch {}
        
        // Seed initial demo data for failed login attempt security indicator
        const seedData: Record<string, { count: number; lastAttempt: string; ip: string }> = {
            'sales@logistics-os.com': { count: 3, lastAttempt: '2026-07-27 10:41', ip: '192.168.1.142 (Stacja Sales-02)' },
            'auditor@logistics-os.com': { count: 1, lastAttempt: '2026-07-27 09:15', ip: '192.168.1.188 (Mobilne IP)' }
        };
        try {
            window.localStorage.setItem('wms-failed-login-attempts', JSON.stringify(seedData));
        } catch {}
        return seedData;
    });

    useEffect(() => {
        const handleFailedLoginsUpdate = () => {
            try {
                const saved = window.localStorage.getItem('wms-failed-login-attempts');
                if (saved) setFailedLogins(JSON.parse(saved));
            } catch {}
        };
        window.addEventListener('storage', handleFailedLoginsUpdate);
        window.addEventListener('wms-failed-logins-updated', handleFailedLoginsUpdate);
        return () => {
            window.removeEventListener('storage', handleFailedLoginsUpdate);
            window.removeEventListener('wms-failed-logins-updated', handleFailedLoginsUpdate);
        };
    }, []);

    const handleClearFailedLogins = (emailOrId: string) => {
        const updated = { ...failedLogins };
        const key = emailOrId.toLowerCase();
        delete updated[key];
        setFailedLogins(updated);
        try {
            window.localStorage.setItem('wms-failed-login-attempts', JSON.stringify(updated));
        } catch (e) {
            console.error(e);
        }
        if (addToast) {
            addToast('Zresetowano licznik nieudanych prób', `Wyczyszczono ostrzeżenie bezpieczeństwa dla ${emailOrId}.`, 'success');
        }
        if (logActivity) {
            logActivity(`Zresetowano nieudane próby logowania dla ${emailOrId}`, 'info');
        }
    };

    // IP Whitelist Policy state and handlers
    const [ipPolicyModalStaff, setIpPolicyModalStaff] = useState<User | null>(null);
    const [ipPolicyInputIp, setIpPolicyInputIp] = useState('192.168.1.100');
    const [ipPolicyInputStatus, setIpPolicyInputStatus] = useState<'whitelisted' | 'vpn' | 'unauthorized'>('whitelisted');
    const [ipPolicyInputSubnet, setIpPolicyInputSubnet] = useState('192.168.1.0/24 (LAN WMS)');
    const [ipPolicyInputLocation, setIpPolicyInputLocation] = useState('Magazyn Centralny');

    const [ipPolicyMap, setIpPolicyMap] = useState<Record<string, { ip: string; status: 'whitelisted' | 'vpn' | 'unauthorized'; subnet: string; location: string }>>(() => {
        try {
            const saved = window.localStorage.getItem('wms-user-ip-whitelist');
            if (saved) return JSON.parse(saved);
        } catch {}

        const defaultSeed: Record<string, { ip: string; status: 'whitelisted' | 'vpn' | 'unauthorized'; subnet: string; location: string }> = {
            'admin@logistics-os.com': { ip: '192.168.1.100', status: 'whitelisted', subnet: '192.168.1.0/24 (LAN WMS)', location: 'Hala Główna - Serwerownia' },
            'manager@logistics-os.com': { ip: '192.168.1.104', status: 'whitelisted', subnet: '192.168.1.0/24 (LAN WMS)', location: 'Biuro Kierownika' },
            'sales@logistics-os.com': { ip: '84.10.22.14', status: 'vpn', subnet: 'VPN Secure Tunnel', location: 'Dostęp Zdalny / Biuro Handlowe' },
            'planner@logistics-os.com': { ip: '192.168.1.112', status: 'whitelisted', subnet: '192.168.1.0/24 (LAN WMS)', location: 'Dyspozytornia Doków' },
            'auditor@logistics-os.com': { ip: '185.220.101.5', status: 'unauthorized', subnet: 'Niezidentyfikowana podsieć WAN', location: 'Zewnętrzny adres IP (Alert Security)' }
        };
        try {
            window.localStorage.setItem('wms-user-ip-whitelist', JSON.stringify(defaultSeed));
        } catch {}
        return defaultSeed;
    });

    const handleOpenIpPolicyModal = (staff: User) => {
        setIpPolicyModalStaff(staff);
        const emId = (staff.employeeId || staff.id).toLowerCase();
        const emEmail = (staff.email || '').toLowerCase();
        const existing = ipPolicyMap[emEmail] || ipPolicyMap[emId] || {
            ip: '192.168.1.105',
            status: 'whitelisted',
            subnet: '192.168.1.0/24 (LAN WMS)',
            location: 'Stacja Robocza Magazynu'
        };
        setIpPolicyInputIp(existing.ip);
        setIpPolicyInputStatus(existing.status);
        setIpPolicyInputSubnet(existing.subnet);
        setIpPolicyInputLocation(existing.location);
    };

    const handleSaveIpPolicy = (e: React.FormEvent) => {
        e.preventDefault();
        if (!ipPolicyModalStaff) return;
        const emId = (ipPolicyModalStaff.employeeId || ipPolicyModalStaff.id).toLowerCase();
        const emEmail = (ipPolicyModalStaff.email || '').toLowerCase();

        const updated = {
            ...ipPolicyMap,
            [emEmail || emId]: {
                ip: ipPolicyInputIp,
                status: ipPolicyInputStatus,
                subnet: ipPolicyInputSubnet,
                location: ipPolicyInputLocation
            }
        };
        setIpPolicyMap(updated);
        try {
            window.localStorage.setItem('wms-user-ip-whitelist', JSON.stringify(updated));
        } catch (err) {
            console.error(err);
        }

        const staffName = `${ipPolicyModalStaff.firstName} ${ipPolicyModalStaff.lastName}`;
        if (addToast) {
            addToast('Zapisano politykę IP Whitelist', `Zaktualizowano regułę autoryzacji IP dla ${staffName}.`, 'success');
        }
        if (logActivity) {
            logActivity(`Zaktualizowano politykę IP dla ${staffName}`, 'info', `Status: ${ipPolicyInputStatus}, IP: ${ipPolicyInputIp}`);
        }

        setIpPolicyModalStaff(null);
    };

    // Option 82: Active User Sessions Monitor with Remote Disconnect state and handler
    const [activeSessions, setActiveSessions] = useState<Array<{
        sessionId: string;
        staffId: string;
        name: string;
        role: string;
        device: string;
        ip: string;
        loginTime: string;
        lastActive: string;
    }>>(() => {
        try {
            const saved = window.localStorage.getItem('wms-active-user-sessions');
            if (saved) return JSON.parse(saved);
        } catch {}
        return [
            { sessionId: 'SESS-901', staffId: 'EMP-001', name: 'Jan Kowalski', role: 'Picker', device: 'Terminal RF-01 (Android Handheld)', ip: '192.168.1.120', loginTime: 'Dziś, 08:00', lastActive: 'Przed chwilą' },
            { sessionId: 'SESS-902', staffId: 'EMP-002', name: 'Anna Nowak', role: 'Packer', device: 'Stacja Pakowania #2 (Chrome Win11)', ip: '192.168.1.125', loginTime: 'Dziś, 08:15', lastActive: '1 min temu' },
            { sessionId: 'SESS-903', staffId: 'EMP-8492', name: 'Administrator Główny', role: 'Admin', device: 'Panel Zarządczy (Firefox MacOS)', ip: '192.168.1.100', loginTime: 'Dziś, 07:30', lastActive: 'Aktywna teraz' },
            { sessionId: 'SESS-904', staffId: 'EMP-9104', name: 'Marek Wiśniewski', role: 'Warehouse Manager', device: 'Tablet Zbieracza (iPad Pro)', ip: '192.168.1.140', loginTime: 'Dziś, 09:10', lastActive: '3 min temu' }
        ];
    });

    const handleTerminateActiveSession = (sessionId: string, name: string) => {
        const updated = activeSessions.filter(s => s.sessionId !== sessionId);
        setActiveSessions(updated);
        try {
            window.localStorage.setItem('wms-active-user-sessions', JSON.stringify(updated));
        } catch (e) {
            console.error(e);
        }
        if (addToast) {
            addToast('Odłączono aktywną sesję', `Pomyślnie zakończono sesję ${sessionId} dla ${name}.`, 'warning');
        }
        if (logActivity) {
            logActivity(`Zdalne odłączenie sesji ${sessionId} dla ${name}`, 'warning');
        }
    };

    // Option 83: Password Complexity Policy Enforcer state and handler
    const [passwordPolicy, setPasswordPolicy] = useState<{
        minLength: number;
        requireUppercase: boolean;
        requireNumbers: boolean;
        requireSpecialChars: boolean;
        expireIntervalDays: number;
    }>(() => {
        try {
            const saved = window.localStorage.getItem('wms-password-complexity-policy');
            if (saved) return JSON.parse(saved);
        } catch {}
        return {
            minLength: 10,
            requireUppercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            expireIntervalDays: 90
        };
    });

    const handleSavePasswordPolicy = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            window.localStorage.setItem('wms-password-complexity-policy', JSON.stringify(passwordPolicy));
        } catch (err) {
            console.error(err);
        }
        if (addToast) {
            addToast('Zapisano wymogi złożoności hasła', 'Zaktualizowano globalne reguły haseł dla użytkowników WMS.', 'success');
        }
        if (logActivity) {
            logActivity('Zaktualizowano politykę złożoności haseł WMS', 'info', `Min. znaków: ${passwordPolicy.minLength}`);
        }
    };

    const polishRoleMap: Record<string, string> = {
        'Picker': 'Kompletujący (Picker)',
        'Packer': 'Pakowacz (Packer)',
        'Warehouse Manager': 'Kierownik magazynu',
        'Super Admin': 'Super Administrator',
        'Admin': 'Administrator',
        'Sales Manager': 'Kierownik sprzedaży',
        'Logistics Planner': 'Planista logistyki',
        'Inventory Auditor': 'Inwentaryzator'
    };
    const getPolishRole = (role: string) => {
        return polishRoleMap[role] || role;
    };

    const polishStatusMap: Record<string, string> = {
        'Active': 'Aktywny',
        'Suspended': 'Zawieszony'
    };
    const getPolishStatus = (status: string) => {
        return polishStatusMap[status] || status;
    };
    const getPolishZoneAssignment = (zone: string) => {
        if (!zone) return 'Nieprzypisany';
        return zone
            .replace(/Aisle/g, 'Korytarz')
            .replace(/Global Access/g, 'Dostęp Globalny')
            .replace(/Station/g, 'Stanowisko')
            .replace(/Zone/g, 'Strefa');
    };

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('Picker');
    const [zoneAssignment, setZoneAssignment] = useState('Aisle 1-3');
    const [status, setStatus] = useState('Active');
    const [password, setPassword] = useState('changeme');
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');

    const filteredStaff = staffList.filter((staff) => {
        const emId = (staff.employeeId || staff.id).toLowerCase();
        const isSoftDeleted = softDeletedUserIds.includes(emId) || softDeletedUserIds.includes(staff.id);

        if (showTrashBasket) {
            return isSoftDeleted;
        } else {
            if (isSoftDeleted) return false;
        }

        const fullName = `${staff.firstName || ''} ${staff.lastName || ''}`.toLowerCase();
        const emailVal = (staff.email || '').toLowerCase();
        const idVal = emId;

        const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                              emailVal.includes(searchTerm.toLowerCase()) ||
                              idVal.includes(searchTerm.toLowerCase());

        const matchesRole = roleFilter === 'All' || staff.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    const handleAddClick = () => {
        setEditingStaffId(null);
        setFirstName('');
        setLastName('');
        setEmail('');
        setRole('Picker');
        setZoneAssignment('Aisle 1-3');
        setStatus('Active');
        setPassword('changeme');
        setFormError('');
        setIsModalOpen(true);
    };

    const handleEditClick = (staff: User) => {
        setEditingStaffId(staff.employeeId || staff.id);
        setFirstName(staff.firstName || '');
        setLastName(staff.lastName || '');
        setEmail(staff.email || '');
        setRole(staff.role || 'Picker');
        setZoneAssignment(staff.zoneAssignment || 'Aisle 1-3');
        setStatus(staff.status || 'Active');
        setPassword(''); 
        setFormError('');
        setIsModalOpen(true);
    };

    const handleConfirmForceLogout = () => {
        if (!forceLogoutStaff) return;
        const emId = forceLogoutStaff.employeeId || forceLogoutStaff.id;
        const staffName = `${forceLogoutStaff.firstName} ${forceLogoutStaff.lastName}`;
        const email = forceLogoutStaff.email || '';

        const updated = Array.from(new Set([...forcedLoggedOutIds, emId, email].filter(Boolean)));
        setForcedLoggedOutIds(updated);
        try {
            window.localStorage.setItem('wms-forced-logouts', JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent('wms-forced-logout-event', {
                detail: { staffId: emId, email }
            }));
        } catch (e) {
            console.error('Failed to dispatch forced logout:', e);
        }

        if (logActivity) {
            logActivity(
                `Unieważniono sesję użytkownika ${staffName}`,
                'warning',
                `ID Pracownika: ${emId}, E-mail: ${email}. Administratorkie wymuszenie wylogowania.`
            );
        }

        if (addToast) {
            addToast(
                'Wymuszono wylogowanie sesji',
                `Sygnał rozłączenia sesji został wyemitowany dla ${staffName}.`,
                'warning'
            );
        }

        if (onForceLogoutUser) {
            onForceLogoutUser(emId, staffName);
        }

        setForceLogoutStaff(null);
    };

    const handleConfirmRequirePasswordReset = async () => {
        if (!resetPasswordStaff) return;
        const emId = resetPasswordStaff.employeeId || resetPasswordStaff.id;
        const staffName = `${resetPasswordStaff.firstName} ${resetPasswordStaff.lastName}`;
        const email = resetPasswordStaff.email || '';

        const updated = Array.from(new Set([...passwordResetRequiredIds, emId, email].filter(Boolean)));
        setPasswordResetRequiredIds(updated);

        try {
            window.localStorage.setItem('wms-password-reset-required', JSON.stringify(updated));
            await onUpdateStaff(emId, { requirePasswordReset: true });
        } catch (e) {
            console.error('Failed to update password reset requirement:', e);
        }

        if (logActivity) {
            logActivity(
                `Wymuszono zmianę hasła dla ${staffName}`,
                'info',
                `ID Pracownika: ${emId}, E-mail: ${email}. Zobowiązano użytkownika do zmiany hasła przy logowaniu.`
            );
        }

        if (addToast) {
            addToast(
                'Wymuszono zmianę hasła',
                `Użytkownik ${staffName} zostanie poproszony o ustawienie nowego hasła przy najbliższym logowaniu.`,
                'info'
            );
        }

        setResetPasswordStaff(null);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setFormError('');
        setIsSubmitting(true);

        try {
            if (editingStaffId) {
                const updates: any = {
                    firstName,
                    lastName,
                    email,
                    role,
                    zoneAssignment,
                    status
                };
                if (password) {
                    updates.password = password;
                }
                await onUpdateStaff(editingStaffId, updates);
            } else {
                await onAddStaff({
                    firstName,
                    lastName,
                    email,
                    role,
                    zoneAssignment,
                    status,
                    password,
                });
            }

            setIsModalOpen(false);
            setFirstName('');
            setLastName('');
            setEmail('');
            setRole('Picker');
            setZoneAssignment('Aisle 1-3');
            setStatus('Active');
            setPassword('changeme');
            setEditingStaffId(null);
        } catch (error: any) {
            setFormError(error.message || 'Nie udało się zapisać użytkownika.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 font-sans text-sm text-[#0b1c30] animate-fadeIn">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 leading-tight">Uprawnienia Użytkowników</h2>
                    <p className="text-zinc-500 text-xs mt-1 border-none">Zarządzaj rolami personelu magazynu i dostępem do stref.</p>
                </div>
                <div className="flex gap-2.5 flex-wrap items-center">
                    <div className="relative">
                        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                        <input
                            type="text"
                            placeholder="Szukaj pracownika..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-1.5 h-9 border border-zinc-300 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950 bg-white w-48 sm:w-56"
                        />
                    </div>

                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="h-9 px-3 border border-zinc-300 rounded text-xs outline-none text-zinc-950 bg-white cursor-pointer select-none"
                    >
                        <option value="All">Wszystkie role</option>
                        <option value="Admin">Administrator</option>
                        <option value="Warehouse Manager">Kierownik magazynu</option>
                        <option value="Sales Manager">Kierownik sprzedaży</option>
                        <option value="Logistics Planner">Planista logistyki</option>
                        <option value="Inventory Auditor">Inwentaryzator</option>
                        <option value="Picker">Kompletujący (Picker)</option>
                        <option value="Packer">Pakowacz (Packer)</option>
                    </select>

                    <button
                        type="button"
                        onClick={() => setShowTrashBasket(!showTrashBasket)}
                        className={`h-9 px-3 rounded font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border shadow-xs ${
                            showTrashBasket
                                ? 'bg-amber-600 text-white border-amber-700'
                                : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-300'
                        }`}
                        title="Kosz usuniętych użytkowników (Option 222 Soft-Delete Basket)"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Kosz {softDeletedUserIds.length > 0 && `(${softDeletedUserIds.length})`}</span>
                    </button>

                    <button
                        onClick={handleAddClick}
                        className="h-9 px-4 rounded bg-zinc-900 hover:bg-zinc-850 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-sm shrink-0 border-none"
                    >
                        <Plus className="w-4 h-4" />
                        Dodaj użytkownika
                    </button>
                </div>
            </div>

            {usersSync?.isLoading && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded text-xs font-semibold">
                    Ładowanie użytkowników z backendu...
                </div>
            )}

            {usersSync?.error && (
                <div className="bg-amber-50 border border-amber-250 text-amber-800 px-4 py-3 rounded text-xs font-semibold">
                    {usersSync.error}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 select-none">
                <div className="bg-white rounded border border-zinc-200 p-5 shadow-sm">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Aktywny Personel</span>
                    <p className="text-2xl font-extrabold text-zinc-905 mt-2 font-mono">
                        {staffList.filter((staff) => staff.status === 'Active').length}
                    </p>
                </div>
                <div className="bg-white rounded border border-zinc-200 p-5 shadow-sm">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Administratorzy</span>
                    <p className="text-2xl font-extrabold text-zinc-905 mt-2 font-mono">
                        {staffList.filter((staff) => staff.role?.includes('Admin')).length}
                    </p>
                </div>
                <div className="bg-white rounded border border-zinc-200 p-5 shadow-sm">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Zawieszeni</span>
                    <p className="text-2xl font-extrabold text-zinc-905 mt-2 font-mono">
                        {staffList.filter((staff) => staff.status === 'Suspended').length}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded border border-zinc-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-zinc-50 font-bold text-zinc-650 text-xs border-b border-zinc-200">
                            <th className="py-2.5 px-4 font-bold">ID Pracownika</th>
                            <th className="py-2.5 px-4 font-bold">Imię i nazwisko</th>
                            <th className="py-2.5 px-4 font-bold">E-mail</th>
                            <th className="py-2.5 px-4 font-bold">Rola</th>
                            <th className="py-2.5 px-4 font-bold">Dostęp do stref</th>
                            <th className="py-2.5 px-4 text-right font-bold font-sans">Status</th>
                            <th className="py-2.5 px-4 text-center w-28 font-bold">Akcje</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 text-xs font-semibold text-zinc-800">
                        {filteredStaff.map((staff) => {
                            const isActive = staff.status === 'Active';
                            const emId = staff.employeeId || staff.id;
                            const isSessionRevoked = forcedLoggedOutIds.includes(emId) || (staff.email && forcedLoggedOutIds.includes(staff.email));
                            const isResetRequired = passwordResetRequiredIds.includes(emId) || (staff.email && passwordResetRequiredIds.includes(staff.email)) || (staff as any).requirePasswordReset;
                            
                            const failedData = (staff.email && failedLogins[staff.email.toLowerCase()]) || failedLogins[emId.toLowerCase()];
                            const ipData = (staff.email && ipPolicyMap[staff.email.toLowerCase()]) || ipPolicyMap[emId.toLowerCase()] || {
                                ip: '192.168.1.105',
                                status: 'whitelisted',
                                subnet: '192.168.1.0/24 (LAN WMS)',
                                location: 'Magazyn Centralny'
                            };

                            return (
                                <tr key={emId} className="hover:bg-zinc-50/70 transition-colors">
                                    <td className="py-3 px-4 font-mono font-bold text-[#0052CC]">{emId}</td>
                                    <td className="py-3 px-4 font-bold text-zinc-900">
                                        {staff.firstName} {staff.lastName}
                                    </td>
                                    <td className="py-3 px-4 text-zinc-500 font-sans">{staff.email}</td>
                                    <td className="py-3 px-4 select-none">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-250 text-[10px] font-bold shadow-3xs">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            {getPolishRole(staff.role)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-zinc-650 font-mono">{getPolishZoneAssignment(staff.zoneAssignment)}</td>
                                    <td className="py-3 px-4 text-right select-none">
                                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                            {ipData && (
                                                <div className="relative group inline-block text-left">
                                                    {ipData.status === 'whitelisted' && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-bold cursor-help shadow-2xs">
                                                            <Wifi className="w-3 h-3 text-emerald-600" />
                                                            IP Autoryzowane
                                                        </span>
                                                    )}
                                                    {ipData.status === 'vpn' && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300 text-[9px] font-bold cursor-help shadow-2xs">
                                                            <Globe className="w-3 h-3 text-blue-600" />
                                                            IP Zdalne (VPN)
                                                        </span>
                                                    )}
                                                    {ipData.status === 'unauthorized' && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 text-[9px] font-bold cursor-help shadow-2xs animate-pulse">
                                                            <ShieldAlert className="w-3 h-3 text-red-600" />
                                                            IP Nieautoryzowane
                                                        </span>
                                                    )}

                                                    <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover:block w-64 p-3 bg-zinc-950 text-white rounded-lg shadow-2xl text-[10px] z-50 font-mono space-y-1 text-left border border-zinc-800 leading-normal">
                                                        <div className="font-extrabold text-blue-400 border-b border-zinc-800 pb-1 flex items-center justify-between uppercase tracking-wider">
                                                            <span>POLITYKA IP WHITELIST</span>
                                                            <Globe className="w-3.5 h-3.5 text-blue-400" />
                                                        </div>
                                                        <div><strong className="text-zinc-400">Ostatni IP:</strong> <span className="text-white font-bold">{ipData.ip}</span></div>
                                                        <div><strong className="text-zinc-400">Podsieć WAN/LAN:</strong> {ipData.subnet}</div>
                                                        <div><strong className="text-zinc-400">Lokalizacja:</strong> {ipData.location}</div>
                                                        <div><strong className="text-zinc-400">Status IT:</strong> <span className={ipData.status === 'unauthorized' ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>{ipData.status === 'whitelisted' ? 'Zgodne z polityką LAN' : (ipData.status === 'vpn' ? 'Tunel Zdalny VPN' : 'NIEZGODNE (Alert)')}</span></div>
                                                        <div className="pt-1 text-[9px] text-zinc-500 italic">Kliknij przycisk kuli ziemskiej w akcjach, aby zmienić reguły IP.</div>
                                                    </div>
                                                </div>
                                            )}
                                            {failedData && failedData.count > 0 && (
                                                <div className="relative group inline-block text-left">
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300 border border-red-300 text-[9px] font-bold cursor-help shadow-2xs">
                                                        <ShieldAlert className="w-3 h-3 text-red-600 animate-pulse" />
                                                        Nieudane logowania: {failedData.count}
                                                    </span>
                                                    <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover:block w-64 p-3 bg-zinc-950 text-white rounded-lg shadow-2xl text-[10px] z-50 font-mono space-y-1 text-left border border-zinc-800 leading-normal">
                                                        <div className="font-extrabold text-red-400 border-b border-zinc-800 pb-1 flex items-center justify-between uppercase tracking-wider">
                                                            <span>Ostrzeżenie bezpieczeństwa</span>
                                                            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                                                        </div>
                                                        <div><strong className="text-zinc-400">Liczba błędnych prób:</strong> <span className="text-red-400 font-bold">{failedData.count}</span></div>
                                                        <div><strong className="text-zinc-400">Data ostatniej próby:</strong> {failedData.lastAttempt}</div>
                                                        <div><strong className="text-zinc-400">Źródło / Adres IP:</strong> {failedData.ip}</div>
                                                        <div className="pt-1 text-[9px] text-zinc-500 italic">Kliknij przycisk zielonej tarczy w akcjach, aby wyczyścić ten alert.</div>
                                                    </div>
                                                </div>
                                            )}
                                            {isResetRequired && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-300 text-[9px] font-bold">
                                                    <KeyRound className="w-3 h-3 text-blue-600" />
                                                    Reset hasła
                                                </span>
                                            )}
                                            {isSessionRevoked && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 text-[9px] font-bold">
                                                    <Radio className="w-3 h-3 animate-pulse text-amber-600" />
                                                    Sesja wygaszona
                                                </span>
                                            )}
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold shadow-3xs ${
                                                isActive
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-red-50 text-red-700 border-red-200'
                                            }`}>
                                                {isActive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                                                {getPolishStatus(staff.status)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex justify-center gap-1.5">
                                            <button
                                                onClick={() => handleOpenIpPolicyModal(staff)}
                                                className="p-1.5 rounded hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-zinc-200 bg-white transition-all cursor-pointer shadow-sm"
                                                title={`Konfiguruj politykę IP Whitelist (${ipData.ip} - ${ipData.status})`}
                                            >
                                                <Globe className="w-3.5 h-3.5 text-zinc-600" />
                                            </button>
                                            {failedData && failedData.count > 0 && (
                                                <button
                                                    onClick={() => handleClearFailedLogins(staff.email || emId)}
                                                    className="p-1.5 rounded hover:bg-emerald-100 text-emerald-700 border border-emerald-300 bg-emerald-50/80 transition-all cursor-pointer shadow-sm animate-bounce"
                                                    title={`Resetuj licznik nieudanych prób (${failedData.count} nieudanych prób, ostatnia: ${failedData.lastAttempt}, IP: ${failedData.ip})`}
                                                >
                                                    <ShieldCheck className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setResetPasswordStaff(staff)}
                                                className="p-1.5 rounded hover:bg-blue-100 text-blue-700 border border-blue-250 bg-blue-50/60 transition-all cursor-pointer shadow-sm"
                                                title="Wymuś zmianę hasła przy kolejnym logowaniu"
                                            >
                                                <KeyRound className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => setForceLogoutStaff(staff)}
                                                className="p-1.5 rounded hover:bg-amber-100 text-amber-700 border border-amber-250 bg-amber-50/60 transition-all cursor-pointer shadow-sm"
                                                title="Wymuś wylogowanie aktywnej sesji"
                                            >
                                                <LogOut className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleEditClick(staff)}
                                                className="p-1.5 rounded hover:bg-blue-50 text-zinc-500 hover:text-blue-600 border border-zinc-200 bg-white transition-all cursor-pointer shadow-sm"
                                                title="Edytuj użytkownika"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            {softDeletedUserIds.includes(emId) || softDeletedUserIds.includes(staff.id) ? (
                                                <button
                                                    onClick={() => handleRestoreUser(emId, `${staff.firstName} ${staff.lastName}`)}
                                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded text-[11px] font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                                                    title="Przywróć użytkownika z kosza"
                                                >
                                                    Przywróć
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleSoftDelete(emId, `${staff.firstName} ${staff.lastName}`)}
                                                    className="p-1.5 rounded hover:bg-red-50 text-zinc-500 hover:text-red-650 hover:border-red-200 border border-zinc-200 bg-white transition-all cursor-pointer shadow-sm"
                                                    title="Przenieś do kosza (Soft-Delete)"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Option 82: Active User Sessions Monitor with Remote Disconnect */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                            <h3 className="font-extrabold text-zinc-900 text-sm uppercase tracking-wider">
                                Podgląd Aktywnych Sesji Użytkowników z Odłączaniem (Option 82 - Active Sessions)
                            </h3>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                            Monitoruj aktywne połączenia urządzeń mobilnych RF, stanowisk pakowania oraz panelu administracyjnego w czasie rzeczywistym.
                        </p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-mono font-bold shrink-0">
                        🟢 Aktywne sesje: {activeSessions.length}
                    </span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-zinc-200">
                    <table className="w-full text-left border-collapse text-xs font-sans">
                        <thead>
                            <tr className="bg-zinc-50 text-zinc-600 font-bold border-b border-zinc-200 uppercase font-mono text-[10px] tracking-wider select-none">
                                <th className="py-2.5 px-3">Użytkownik / Rola</th>
                                <th className="py-2.5 px-3">Urządzenie / Klient</th>
                                <th className="py-2.5 px-3">Adres IP</th>
                                <th className="py-2.5 px-3">Czas zalogowania</th>
                                <th className="py-2.5 px-3">Ostatnia aktywność</th>
                                <th className="py-2.5 px-3 text-right">Akcja IT</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-150 font-medium text-zinc-700">
                            {activeSessions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-6 text-center text-zinc-400 font-semibold">
                                        Brak zarejestrowanych aktywnych sesji.
                                    </td>
                                </tr>
                            ) : (
                                activeSessions.map(session => (
                                    <tr key={session.sessionId} className="hover:bg-zinc-50/80 transition-colors">
                                        <td className="py-2.5 px-3">
                                            <div className="font-bold text-zinc-900">{session.name}</div>
                                            <div className="text-[10px] text-zinc-400 font-mono uppercase">{session.role} ({session.staffId})</div>
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-zinc-600">
                                            {session.device}
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-blue-700 font-semibold">
                                            {session.ip}
                                        </td>
                                        <td className="py-2.5 px-3 text-zinc-500 font-mono">
                                            {session.loginTime}
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                {session.lastActive}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => handleTerminateActiveSession(session.sessionId, session.name)}
                                                className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-[11px] font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1 ml-auto"
                                                title={`Zakończ sesję ${session.sessionId}`}
                                            >
                                                <LogOut className="w-3 h-3" />
                                                Odłącz
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Option 83: Password Complexity Policy Enforcer */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <div>
                        <h3 className="font-extrabold text-zinc-900 text-sm uppercase tracking-wider">
                            Konfigurator Wymogów Złożoności Hasła (Option 83 - Password Enforcer)
                        </h3>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Ustaw politykę bezpieczeństwa i zasady tworzenia haseł dla wszystkich operatorów klastra WMS.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSavePasswordPolicy} className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                    <div className="space-y-3 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-zinc-700">Minimalna długość hasła</label>
                                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                                    {passwordPolicy.minLength} znaków
                                </span>
                            </div>
                            <input
                                type="range"
                                min="8"
                                max="24"
                                step="1"
                                value={passwordPolicy.minLength}
                                onChange={(e) => setPasswordPolicy({ ...passwordPolicy, minLength: parseInt(e.target.value) })}
                                className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-zinc-700">Cykl wygasania haseł</label>
                                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                                    Co {passwordPolicy.expireIntervalDays} dni
                                </span>
                            </div>
                            <select
                                value={passwordPolicy.expireIntervalDays}
                                onChange={(e) => setPasswordPolicy({ ...passwordPolicy, expireIntervalDays: parseInt(e.target.value) })}
                                className="w-full bg-white border border-zinc-300 rounded px-2.5 py-1.5 text-xs text-zinc-800 outline-none cursor-pointer font-medium"
                            >
                                <option value={30}>Co 30 dni (Maksymalne bezpieczeństwo)</option>
                                <option value={60}>Co 60 dni (Standard korporacyjny)</option>
                                <option value={90}>Co 90 dni (Zalecany kompromis)</option>
                                <option value={180}>Co 180 dni (Rzadka rotacja)</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                        <span className="text-xs font-bold text-zinc-800 block uppercase tracking-wider font-mono">
                            Zasady i Znakowe Wymogi Hasła:
                        </span>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-700 select-none">
                            <input
                                type="checkbox"
                                checked={passwordPolicy.requireUppercase}
                                onChange={(e) => setPasswordPolicy({ ...passwordPolicy, requireUppercase: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded border-zinc-300 focus:ring-blue-500 cursor-pointer"
                            />
                            <span>Wymagaj co najmniej jednej wielkiej litery (A-Z)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-700 select-none">
                            <input
                                type="checkbox"
                                checked={passwordPolicy.requireNumbers}
                                onChange={(e) => setPasswordPolicy({ ...passwordPolicy, requireNumbers: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded border-zinc-300 focus:ring-blue-500 cursor-pointer"
                            />
                            <span>Wymagaj co najmniej jednej cyfry (0-9)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-700 select-none">
                            <input
                                type="checkbox"
                                checked={passwordPolicy.requireSpecialChars}
                                onChange={(e) => setPasswordPolicy({ ...passwordPolicy, requireSpecialChars: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded border-zinc-300 focus:ring-blue-500 cursor-pointer"
                            />
                            <span>Wymagaj znaku specjalnego (!@#$%^&*)</span>
                        </label>

                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-lg cursor-pointer shadow transition-all border-none flex items-center justify-center gap-1.5 uppercase tracking-wider"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Zapisz Wymogi Złożoności Hasła
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg border border-zinc-300 w-full max-w-md shadow-2xl overflow-hidden font-sans text-sm pb-1">
                        <div className="px-5 py-4 bg-[#0b1c30] text-white flex justify-between items-center">
                            <h3 className="font-bold tracking-tight">
                                {editingStaffId ? 'Edytuj użytkownika magazynu' : 'Dodaj użytkownika magazynu'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-zinc-400 hover:text-white cursor-pointer font-bold text-lg bg-transparent border-none"
                            >
                                x
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {formError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-xs font-semibold leading-relaxed">
                                    {formError}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Imię</label>
                                    <input
                                        required
                                        value={firstName}
                                        onChange={(event) => setFirstName(event.target.value)}
                                        className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950 bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Nazwisko</label>
                                    <input
                                        required
                                        value={lastName}
                                        onChange={(event) => setLastName(event.target.value)}
                                        className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950 bg-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">E-mail</label>
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950 bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2 font-sans font-semibold text-zinc-700">
                                    Hasło {editingStaffId && <span className="text-[10px] text-zinc-400 lowercase">(pozostaw puste, aby zachować obecne)</span>}
                                </label>
                                <input
                                    required={!editingStaffId}
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950 bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Rola</label>
                                    <select
                                        value={role}
                                        onChange={(event) => setRole(event.target.value)}
                                        className="w-full p-2 border border-zinc-300 rounded outline-none text-zinc-950 bg-white"
                                    >
                                        <option value="Picker">Kompletujący (Picker)</option>
                                        <option value="Packer">Pakowacz (Packer)</option>
                                        <option value="Warehouse Manager">Kierownik magazynu</option>
                                        <option value="Admin">Administrator</option>
                                        <option value="Sales Manager">Kierownik sprzedaży</option>
                                        <option value="Logistics Planner">Planista logistyki</option>
                                        <option value="Inventory Auditor">Inwentaryzator</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Dostęp do stref</label>
                                    <input
                                        required
                                        value={zoneAssignment}
                                        onChange={(event) => setZoneAssignment(event.target.value)}
                                        className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950 bg-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2 font-display">Status</label>
                                <select
                                    value={status}
                                    onChange={(event) => setStatus(event.target.value)}
                                    className="w-full p-2 border border-zinc-300 rounded outline-none text-zinc-950 bg-white"
                                >
                                    <option value="Active">Aktywny (Active)</option>
                                    <option value="Suspended">Zawieszony (Suspended)</option>
                                </select>
                            </div>

                            <div className="pt-4 border-t border-zinc-200 mt-6 flex justify-end gap-3 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-semibold rounded text-xs cursor-pointer bg-white"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded text-xs cursor-pointer shadow border-none"
                                >
                                    {isSubmitting ? 'Zapisywanie...' : (editingStaffId ? 'Zaktualizuj użytkownika' : 'Zapisz użytkownika')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteConfirmId && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-lg border border-red-200 w-full max-w-sm shadow-2xl overflow-hidden font-sans text-sm pb-1">
                        <div className="px-5 py-3.5 bg-red-600 text-white flex justify-between items-center select-none font-bold">
                            <span>POTWIERDŹ USUNIĘCIE</span>
                        </div>
                        <div className="p-5 space-y-4">
                            <p className="text-zinc-650 font-semibold leading-relaxed">
                                Czy na pewno chcesz trwale usunąć profil tego pracownika z bazy danych Logistics OS? Operacji tej nie można cofnąć.
                            </p>
                            <div className="pt-2 flex justify-end gap-3 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="px-4 py-2 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-semibold rounded text-xs cursor-pointer bg-white"
                                >
                                    Anuluj
                                </button>
                                <button
                                    onClick={() => {
                                        onDeleteStaff(deleteConfirmId);
                                        setDeleteConfirmId(null);
                                    }}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-xs cursor-pointer shadow border-none animate-pulse"
                                >
                                    Usuń bezpowrotnie
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Force Logout Confirmation Modal */}
            {forceLogoutStaff && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-lg border border-amber-300 w-full max-w-md shadow-2xl overflow-hidden font-sans text-sm pb-1">
                        <div className="px-5 py-3.5 bg-amber-600 text-white flex justify-between items-center select-none font-bold">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-200 animate-pulse" />
                                <span>WYMUSZENIE WYLOGOWANIA SESJI</span>
                            </div>
                            <button
                                onClick={() => setForceLogoutStaff(null)}
                                className="text-amber-200 hover:text-white cursor-pointer font-bold text-lg bg-transparent border-none"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <p className="text-zinc-700 font-medium leading-relaxed">
                                Czy na pewno chcesz natychmiast unieważnić aktywną sesję pracownika:
                            </p>
                            
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1 text-xs">
                                <div className="font-extrabold text-amber-950">
                                    {forceLogoutStaff.firstName} {forceLogoutStaff.lastName}
                                </div>
                                <div className="font-mono text-amber-800 text-[11px]">
                                    ID: {forceLogoutStaff.employeeId || forceLogoutStaff.id} | Rola: {getPolishRole(forceLogoutStaff.role)}
                                </div>
                                <div className="font-mono text-amber-700 text-[11px]">
                                    {forceLogoutStaff.email}
                                </div>
                            </div>

                            <p className="text-xs text-zinc-500 leading-normal">
                                System wyemituje sygnał unieważnienia sesji (`wms-forced-logout-event`). Pracownik zostanie natychmiast rozłączony z systemem WMS i przekierowany do ekranu logowania.
                            </p>

                            <div className="pt-2 flex justify-end gap-3 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => setForceLogoutStaff(null)}
                                    className="px-4 py-2 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-semibold rounded text-xs cursor-pointer bg-white"
                                >
                                    Anuluj
                                </button>
                                <button
                                    onClick={handleConfirmForceLogout}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-xs cursor-pointer shadow border-none flex items-center gap-1.5 active:scale-95 transition-all"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    Wymuś wylogowanie sesji
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Reset Requirement Modal */}
            {resetPasswordStaff && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-lg border border-blue-300 w-full max-w-md shadow-2xl overflow-hidden font-sans text-sm pb-1">
                        <div className="px-5 py-3.5 bg-blue-600 text-white flex justify-between items-center select-none font-bold">
                            <div className="flex items-center gap-2">
                                <KeyRound className="w-4 h-4 text-blue-200" />
                                <span>WYMUSZENIE ZMIANY HASŁA</span>
                            </div>
                            <button
                                onClick={() => setResetPasswordStaff(null)}
                                className="text-blue-200 hover:text-white cursor-pointer font-bold text-lg bg-transparent border-none"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <p className="text-zinc-700 font-medium leading-relaxed">
                                Czy chcesz wymusić ponowne ustawienie hasła dla pracownika:
                            </p>
                            
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1 text-xs">
                                <div className="font-extrabold text-blue-950">
                                    {resetPasswordStaff.firstName} {resetPasswordStaff.lastName}
                                </div>
                                <div className="font-mono text-blue-800 text-[11px]">
                                    ID: {resetPasswordStaff.employeeId || resetPasswordStaff.id} | Rola: {getPolishRole(resetPasswordStaff.role)}
                                </div>
                                <div className="font-mono text-blue-700 text-[11px]">
                                    {resetPasswordStaff.email}
                                </div>
                            </div>

                            <p className="text-xs text-zinc-500 leading-normal">
                                Użytkownik zostanie zobowiązany do wprowadzenia i zatwierdzenia nowego bezpiecznego hasła przed uzyskaniem dostępu do portalu WMS przy kolejnym logowaniu.
                            </p>

                            <div className="pt-2 flex justify-end gap-3 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => setResetPasswordStaff(null)}
                                    className="px-4 py-2 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-semibold rounded text-xs cursor-pointer bg-white"
                                >
                                    Anuluj
                                </button>
                                <button
                                    onClick={handleConfirmRequirePasswordReset}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs cursor-pointer shadow border-none flex items-center gap-1.5 active:scale-95 transition-all"
                                >
                                    <KeyRound className="w-3.5 h-3.5" />
                                    Wymuś zmianę hasła
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* IP Whitelist Policy Config Modal */}
            {ipPolicyModalStaff && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-lg border border-zinc-300 w-full max-w-md shadow-2xl overflow-hidden font-sans text-sm pb-1">
                        <div className="px-5 py-3.5 bg-zinc-900 text-white flex justify-between items-center select-none font-bold">
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-blue-400" />
                                <span>POLITYKA BEZPIECZEŃSTWA IP WHITELIST</span>
                            </div>
                            <button
                                onClick={() => setIpPolicyModalStaff(null)}
                                className="text-zinc-400 hover:text-white cursor-pointer font-bold text-lg bg-transparent border-none"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveIpPolicy} className="p-5 space-y-4">
                            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs space-y-1">
                                <div className="font-bold text-zinc-900">
                                    {ipPolicyModalStaff.firstName} {ipPolicyModalStaff.lastName}
                                </div>
                                <div className="font-mono text-zinc-600 text-[11px]">
                                    ID: {ipPolicyModalStaff.employeeId || ipPolicyModalStaff.id} | {ipPolicyModalStaff.email}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                                    Adres IP Logowania
                                </label>
                                <input
                                    required
                                    value={ipPolicyInputIp}
                                    onChange={(e) => setIpPolicyInputIp(e.target.value)}
                                    className="w-full p-2 border border-zinc-300 rounded font-mono text-xs outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900 bg-white"
                                    placeholder="np. 192.168.1.105"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                                    Status Autoryzacji IT
                                </label>
                                <select
                                    value={ipPolicyInputStatus}
                                    onChange={(e) => setIpPolicyInputStatus(e.target.value as any)}
                                    className="w-full p-2 border border-zinc-300 rounded text-xs outline-none text-zinc-900 bg-white"
                                >
                                    <option value="whitelisted">IP Autoryzowane (Wewnętrzna Sieć LAN Magazynu)</option>
                                    <option value="vpn">IP Zdalne (Zabezpieczony Tunel VPN)</option>
                                    <option value="unauthorized">IP Nieautoryzowane (Brak dostępu / Alert)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                                    Przypisana Podsieć
                                </label>
                                <input
                                    value={ipPolicyInputSubnet}
                                    onChange={(e) => setIpPolicyInputSubnet(e.target.value)}
                                    className="w-full p-2 border border-zinc-300 rounded font-mono text-xs outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900 bg-white"
                                    placeholder="np. 192.168.1.0/24 (LAN WMS)"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                                    Opis Lokalizacji Terminala
                                </label>
                                <input
                                    value={ipPolicyInputLocation}
                                    onChange={(e) => setIpPolicyInputLocation(e.target.value)}
                                    className="w-full p-2 border border-zinc-300 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 text-zinc-900 bg-white"
                                    placeholder="np. Hala A / Biuro Obsługi"
                                />
                            </div>

                            <div className="pt-3 border-t border-zinc-200 flex justify-end gap-3 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => setIpPolicyModalStaff(null)}
                                    className="px-4 py-2 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-semibold rounded text-xs cursor-pointer bg-white"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs cursor-pointer shadow border-none flex items-center gap-1.5 active:scale-95 transition-all"
                                >
                                    <Globe className="w-3.5 h-3.5" />
                                    Zapisz politykę IP
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useState } from 'react';
import { Plus, ShieldCheck, UserCheck, UserX, Edit2, Trash2, Search } from 'lucide-react';
import { User } from '../../services/usersApi';

interface UsersPermissionsProps {
    staffList: User[];
    onAddStaff: (newStaff: any) => Promise<User>;
    onUpdateStaff: (id: string, updates: any) => Promise<User>;
    onDeleteStaff: (id: string) => Promise<void>;
    usersSync: { isLoading: boolean; error: string };
}

export default function UsersPermissions({ 
    staffList, 
    onAddStaff, 
    onUpdateStaff, 
    onDeleteStaff, 
    usersSync 
}: UsersPermissionsProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
        const fullName = `${staff.firstName || ''} ${staff.lastName || ''}`.toLowerCase();
        const emailVal = (staff.email || '').toLowerCase();
        const idVal = (staff.employeeId || staff.id || '').toLowerCase();

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

    const handleDeleteClick = (staffId: string) => {
        setDeleteConfirmId(staffId);
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
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold shadow-3xs ${
                                            isActive
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-red-50 text-red-700 border-red-200'
                                        }`}>
                                            {isActive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                                            {getPolishStatus(staff.status)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex justify-center gap-3">
                                            <button
                                                onClick={() => handleEditClick(staff)}
                                                className="p-1.5 rounded hover:bg-blue-50 text-zinc-500 hover:text-blue-600 border border-zinc-200 bg-white transition-all cursor-pointer shadow-sm"
                                                title="Edytuj użytkownika"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(emId)}
                                                className="p-1.5 rounded hover:bg-red-50 text-zinc-500 hover:text-red-650 hover:border-red-200 border border-zinc-200 bg-white transition-all cursor-pointer shadow-sm"
                                                title="Usuń użytkownika"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
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
        </div>
    );
}

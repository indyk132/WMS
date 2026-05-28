import React, { useState } from 'react';
import { Plus, ShieldCheck, UserCheck, UserX, Edit2, Trash2 } from 'lucide-react';

export default function UsersPermissions({ staffList, onAddStaff, onUpdateStaff, onDeleteStaff, usersSync }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaffId, setEditingStaffId] = useState(null);

    const polishRoleMap = {
        'Picker': 'Kompletujący (Picker)',
        'Packer': 'Pakowacz (Packer)',
        'Warehouse Manager': 'Kierownik magazynu',
        'Super Admin': 'Super Administrator',
        'Admin': 'Administrator'
    };
    const getPolishRole = (role) => {
        return polishRoleMap[role] || role;
    };

    const polishStatusMap = {
        'Active': 'Aktywny',
        'Suspended': 'Zawieszony'
    };
    const getPolishStatus = (status) => {
        return polishStatusMap[status] || status;
    };
    const getPolishZoneAssignment = (zone) => {
        if (!zone) return '';
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

    const handleEditClick = (staff) => {
        setEditingStaffId(staff.id);
        setFirstName(staff.firstName || '');
        setLastName(staff.lastName || '');
        setEmail(staff.email || '');
        setRole(staff.role || 'Picker');
        setZoneAssignment(staff.zoneAssignment || 'Aisle 1-3');
        setStatus(staff.status || 'Active');
        setPassword(''); // Optional for edit
        setFormError('');
        setIsModalOpen(true);
    };

    const handleDeleteClick = (staffId) => {
        if (confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
            onDeleteStaff(staffId);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError('');
        setIsSubmitting(true);

        try {
            if (editingStaffId) {
                const updates = {
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
        } catch (error) {
            setFormError(error.message || 'Nie udalo sie zapisac uzytkownika.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 font-sans text-sm text-[#0b1c30]">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 leading-tight">Uprawnienia Użytkowników</h2>
                    <p className="text-zinc-500 text-xs mt-1">Zarządzaj rolami personelu magazynu i dostępem do stref.</p>
                </div>
                <div className="flex gap-2.5">
                    <button
                        onClick={() => {
                            window.location.hash = '#/terminal';
                            window.location.reload();
                        }}
                        className="h-9 px-4 rounded border border-purple-300 hover:bg-purple-50 text-purple-700 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer bg-white"
                    >
                        Terminal Roboczy WMS 📲
                    </button>

                    <button
                        onClick={handleAddClick}
                        className="h-9 px-4 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Dodaj użytkownika
                    </button>
                </div>
            </div>

            {usersSync?.isLoading && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded text-xs font-semibold">
                    Ladowanie uzytkownikow z backendu...
                </div>
            )}

            {usersSync?.error && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded text-xs font-semibold">
                    {usersSync.error}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded border border-zinc-200 p-5 shadow-sm">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Aktywny Personel</span>
                    <p className="text-2xl font-extrabold text-zinc-900 mt-2">
                        {staffList.filter((staff) => staff.status === 'Active').length}
                    </p>
                </div>
                <div className="bg-white rounded border border-zinc-200 p-5 shadow-sm">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Administratorzy</span>
                    <p className="text-2xl font-extrabold text-zinc-900 mt-2">
                        {staffList.filter((staff) => staff.role.includes('Admin')).length}
                    </p>
                </div>
                <div className="bg-white rounded border border-zinc-200 p-5 shadow-sm">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Zawieszeni</span>
                    <p className="text-2xl font-extrabold text-zinc-900 mt-2">
                        {staffList.filter((staff) => staff.status === 'Suspended').length}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded border border-[#c6c6cd] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-zinc-50 font-bold text-zinc-650 text-xs border-b border-[#c6c6cd]">
                            <th className="py-2.5 px-4">ID Pracownika</th>
                            <th className="py-2.5 px-4">Imię i nazwisko</th>
                            <th className="py-2.5 px-4">E-mail</th>
                            <th className="py-2.5 px-4">Rola</th>
                            <th className="py-2.5 px-4">Dostęp do stref</th>
                            <th className="py-2.5 px-4 text-right">Status</th>
                            <th className="py-2.5 px-4 text-center w-28">Akcje</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 text-xs font-medium text-zinc-800">
                        {staffList.map((staff) => {
                            const isActive = staff.status === 'Active';

                            return (
                                <tr key={staff.id} className="hover:bg-zinc-50/70 transition-colors">
                                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{staff.id}</td>
                                    <td className="py-3 px-4 font-bold text-zinc-900">
                                        {staff.firstName} {staff.lastName}
                                    </td>
                                    <td className="py-3 px-4 text-zinc-500">{staff.email}</td>
                                    <td className="py-3 px-4">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                                            <ShieldCheck className="w-3 h-3" />
                                            {getPolishRole(staff.role)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-zinc-650">{getPolishZoneAssignment(staff.zoneAssignment)}</td>
                                    <td className="py-3 px-4 text-right">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                                            isActive
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-red-50 text-red-700 border-red-200'
                                        }`}>
                                            {isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                                            {getPolishStatus(staff.status)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => handleEditClick(staff)}
                                                className="p-1.5 rounded hover:bg-blue-50 text-zinc-500 hover:text-blue-600 transition-colors cursor-pointer border border-zinc-200 bg-white"
                                                title="Edytuj użytkownika"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(staff.id)}
                                                className="p-1.5 rounded hover:bg-red-50 text-zinc-500 hover:text-red-600 transition-colors cursor-pointer border border-zinc-200 bg-white"
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
                    <div className="bg-white rounded-lg border border-zinc-300 w-full max-w-md shadow-2xl overflow-hidden font-sans text-sm">
                        <div className="px-5 py-4 bg-[#0b1c30] text-white flex justify-between items-center">
                            <h3 className="font-bold tracking-tight">
                                {editingStaffId ? 'Edytuj użytkownika magazynu' : 'Dodaj użytkownika magazynu'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-zinc-400 hover:text-white cursor-pointer font-bold text-lg"
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
                                        className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Nazwisko</label>
                                    <input
                                        required
                                        value={lastName}
                                        onChange={(event) => setLastName(event.target.value)}
                                        className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950"
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
                                    className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                                    Hasło {editingStaffId && <span className="text-[10px] text-zinc-400 lowercase">(pozostaw puste, aby zachować obecne)</span>}
                                </label>
                                <input
                                    required={!editingStaffId}
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950"
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
                                        <option value="Warehouse Manager">Kierownik magazynu (Warehouse Manager)</option>
                                        <option value="Super Admin">Super Administrator (Super Admin)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Dostęp do stref</label>
                                    <input
                                        required
                                        value={zoneAssignment}
                                        onChange={(event) => setZoneAssignment(event.target.value)}
                                        className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Status</label>
                                <select
                                    value={status}
                                    onChange={(event) => setStatus(event.target.value)}
                                    className="w-full p-2 border border-zinc-300 rounded outline-none text-zinc-950 bg-white"
                                >
                                    <option value="Active">Aktywny (Active)</option>
                                    <option value="Suspended">Zawieszony (Suspended)</option>
                                </select>
                            </div>

                            <div className="pt-4 border-t border-zinc-200 mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-semibold rounded text-xs cursor-pointer"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded text-xs cursor-pointer shadow"
                                >
                                    {isSubmitting ? 'Zapisywanie...' : (editingStaffId ? 'Zaktualizuj użytkownika' : 'Zapisz użytkownika')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

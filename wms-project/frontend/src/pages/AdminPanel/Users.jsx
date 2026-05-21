import React, { useState } from 'react';
import { Plus, ShieldCheck, UserCheck, UserX } from 'lucide-react';

export default function UsersPermissions({ staffList, onAddStaff, usersSync }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('Picker');
    const [zoneAssignment, setZoneAssignment] = useState('Aisle 1-3');
    const [password, setPassword] = useState('changeme');
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError('');
        setIsSubmitting(true);

        try {
            await onAddStaff({
                firstName,
                lastName,
                email,
                role,
                zoneAssignment,
                status: 'Active',
                password,
            });

            setIsModalOpen(false);
            setFirstName('');
            setLastName('');
            setEmail('');
            setRole('Picker');
            setZoneAssignment('Aisle 1-3');
            setPassword('changeme');
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
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 leading-tight">User Permissions</h2>
                    <p className="text-zinc-500 text-xs mt-1">Manage warehouse staff roles and zone access.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="h-9 px-4 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add User
                </button>
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
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Active Staff</span>
                    <p className="text-2xl font-extrabold text-zinc-900 mt-2">
                        {staffList.filter((staff) => staff.status === 'Active').length}
                    </p>
                </div>
                <div className="bg-white rounded border border-zinc-200 p-5 shadow-sm">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Admins</span>
                    <p className="text-2xl font-extrabold text-zinc-900 mt-2">
                        {staffList.filter((staff) => staff.role.includes('Admin')).length}
                    </p>
                </div>
                <div className="bg-white rounded border border-zinc-200 p-5 shadow-sm">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Suspended</span>
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
                            <th className="py-2.5 px-4">Employee ID</th>
                            <th className="py-2.5 px-4">Name</th>
                            <th className="py-2.5 px-4">Email</th>
                            <th className="py-2.5 px-4">Role</th>
                            <th className="py-2.5 px-4">Zone Access</th>
                            <th className="py-2.5 px-4 text-right">Status</th>
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
                                            {staff.role}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-zinc-650">{staff.zoneAssignment}</td>
                                    <td className="py-3 px-4 text-right">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                                            isActive
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-red-50 text-red-700 border-red-200'
                                        }`}>
                                            {isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                                            {staff.status}
                                        </span>
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
                            <h3 className="font-bold tracking-tight">Add Warehouse User</h3>
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
                                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">First Name</label>
                                    <input
                                        required
                                        value={firstName}
                                        onChange={(event) => setFirstName(event.target.value)}
                                        className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Last Name</label>
                                    <input
                                        required
                                        value={lastName}
                                        onChange={(event) => setLastName(event.target.value)}
                                        className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Email</label>
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Password</label>
                                <input
                                    required
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Role</label>
                                    <select
                                        value={role}
                                        onChange={(event) => setRole(event.target.value)}
                                        className="w-full p-2 border border-zinc-300 rounded outline-none text-zinc-950 bg-white"
                                    >
                                        <option value="Picker">Picker</option>
                                        <option value="Packer">Packer</option>
                                        <option value="Warehouse Manager">Warehouse Manager</option>
                                        <option value="Super Admin">Super Admin</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Zone Access</label>
                                    <input
                                        required
                                        value={zoneAssignment}
                                        onChange={(event) => setZoneAssignment(event.target.value)}
                                        className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-zinc-200 mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-semibold rounded text-xs cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded text-xs cursor-pointer shadow"
                                >
                                    {isSubmitting ? 'Saving...' : 'Save User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

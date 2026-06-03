import React, { useState, useEffect } from 'react';
import { X, UserCheck, Mail, Info, Key, Save } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onUpdateCurrentUser: (updatedUser: any) => void;
}

export default function ProfileModal({ isOpen, onClose, currentUser, onUpdateCurrentUser }: ProfileModalProps) {
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    avatarUrl: '',
    password: '',
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (currentUser && isOpen) {
      setProfileForm({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        avatarUrl: currentUser.avatarUrl || '',
        password: '',
      });
      setSaveStatus('idle');
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    setTimeout(() => {
      const updatedUser = {
        ...currentUser,
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        avatarUrl: profileForm.avatarUrl || null,
      };
      if (profileForm.password) {
        updatedUser.password = profileForm.password;
      }
      
      onUpdateCurrentUser(updatedUser);
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
        onClose();
      }, 1000);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans animate-fadeIn">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white w-full max-w-md rounded-xl border border-zinc-200 shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-150 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-zinc-900 text-sm tracking-tight uppercase">Mój Profil</h3>
              <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Edycja preferencji osobistych</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer border-none bg-transparent"
            title="Zamknij"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 overflow-y-auto pr-1 flex-grow scrollbar-thin">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Imię</label>
              <input
                type="text"
                required
                value={profileForm.firstName}
                onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-blue-500 rounded px-2.5 py-1.5 text-xs text-zinc-800 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Nazwisko</label>
              <input
                type="text"
                required
                value={profileForm.lastName}
                onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-blue-500 rounded px-2.5 py-1.5 text-xs text-zinc-800 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Adres e-mail</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-zinc-400">
                <Mail className="w-3.5 h-3.5" />
              </span>
              <input
                type="email"
                required
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full pl-8 pr-2.5 py-1.5 bg-zinc-50 border border-zinc-200 focus:border-blue-500 rounded text-xs text-zinc-800 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Rola systemowa</label>
            <input
              type="text"
              disabled
              value={currentUser?.role || 'Brak'}
              className="w-full bg-zinc-100 border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-zinc-450 outline-none cursor-not-allowed font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Link do awatara (URL)</label>
            <input
              type="text"
              value={profileForm.avatarUrl}
              onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })}
              className="w-full bg-zinc-50 border border-zinc-200 focus:border-blue-500 rounded px-2.5 py-1.5 text-xs text-zinc-800 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="https://example.com/avatar.png"
            />
          </div>

          <div className="space-y-1 border-t border-zinc-100 pt-3">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Zmień hasło logowania (Opcjonalne)</label>
            <span className="text-[9px] text-zinc-400 block mb-1">Pozostaw puste, aby zachować dotychczasowe.</span>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-zinc-400">
                <Key className="w-3.5 h-3.5" />
              </span>
              <input
                type="password"
                value={profileForm.password}
                onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                className="w-full pl-8 pr-2.5 py-1.5 bg-zinc-50 border border-zinc-200 focus:border-blue-500 rounded text-xs text-zinc-800 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="Nowe hasło"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-150 text-blue-900 rounded-lg flex items-start gap-2.5 text-[10px] leading-relaxed">
            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Wszelkie modyfikacje zostaną zsynchronizowane z Twoim kontem na liście personelu magazynu.
            </span>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-2.5 mt-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-zinc-500 hover:bg-zinc-50 border border-zinc-200 rounded-lg cursor-pointer transition-all"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={saveStatus === 'saving'}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-75 text-white font-bold text-xs rounded-lg shadow-md border-none cursor-pointer transition-all flex items-center gap-1.5"
            >
              {saveStatus === 'saving' ? (
                <span>Trwa zapis...</span>
              ) : saveStatus === 'saved' ? (
                <span>Zapisano!</span>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Zapisz profil
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

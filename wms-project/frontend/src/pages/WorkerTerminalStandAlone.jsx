import React, { useState, useEffect, useRef } from "react";
import { 
  User, ShieldAlert, BadgeInfo, Key, Hammer, LogIn, Warehouse, HelpCircle, Eye, EyeOff,
  Barcode, Clock, AlertCircle, Play, CheckCircle, ChevronRight, 
  MapPin, Check, RefreshCw, Box, Printer, CheckSquare, Square, 
  ArrowLeft, Scale, ShoppingCart, Layers, UserCheck, Timer, Award, LogOut, ArrowRight,
  Wifi
} from "lucide-react";


import { sounds } from "../components/SoundEffects";


import { INITIAL_PRODUCTS, WORKERS } from "../data/warehouseData";




export function WorkerLogin({ workersList, staffList, onLoginSelected }) {
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("picker"); 

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    sounds.playSuccess();
    
    const cleanId = empId.toUpperCase().trim();
    let name = "J. SMITH";
    let shift = "A-Morning";
    let isStaffAdmin = false;
    let staffRole = "Worker";

    const foundPicker = workersList.pickers.find(p => p.id === cleanId);
    const foundPacker = workersList.packers.find(p => p.id === cleanId);
    const foundStaff = (staffList || []).find(s => s.id === cleanId || s.employeeId === cleanId);

    if (foundPicker) {
      name = foundPicker.name;
      shift = foundPicker.shift;
    } else if (foundPacker) {
      name = foundPacker.name;
      shift = foundPacker.shift;
    } else if (foundStaff) {
      name = `${foundStaff.firstName} ${foundStaff.lastName}`;
      shift = foundStaff.zoneAssignment || "Pełny Dostęp";
      isStaffAdmin = foundStaff.role === 'Super Admin' || foundStaff.role === 'Admin' || foundStaff.role === 'Warehouse Manager';
      staffRole = foundStaff.role;
    }

    if (cleanId.includes("ADMIN")) {
      isStaffAdmin = true;
      staffRole = "Admin";
    }

    let finalRole = selectedRole;
    if (foundPicker || (foundStaff && foundStaff.role === 'Picker')) {
      finalRole = 'picker';
    } else if (foundPacker || (foundStaff && foundStaff.role === 'Packer')) {
      finalRole = 'packer';
    } else if (foundStaff && (foundStaff.role === 'Super Admin' || foundStaff.role === 'Admin' || foundStaff.role === 'Warehouse Manager')) {
      finalRole = 'picker';
    }

    onLoginSelected({
      empId: cleanId || "EMP-001",
      name,
      shift,
      role: finalRole,
      isAdmin: isStaffAdmin,
      staffRole: staffRole
    });
  };

  const handleQuickLogin = (worker, role) => {
    sounds.playBeep();
    setEmpId(worker.id);
    setPassword(worker.password || "");
    setSelectedRole(role);
  };

  return (
    <div className="flex-grow max-w-md mx-auto w-full px-4 pt-12 pb-24 flex flex-col justify-center items-center">
      <header className="flex flex-col items-center text-center gap-2 mb-8">
        <div className="flex items-center gap-3">
          <Warehouse className="w-9 h-9 text-[#0052CC]" />
          <h1 className="font-display text-2xl font-black text-zinc-900 tracking-wider uppercase">
            Logistics OS
          </h1>
        </div>
        <p className="text-xs text-zinc-500 font-mono tracking-widest uppercase">
          Magazynowy Terminal Roboczy
        </p>
      </header>

      <div className="w-full bg-white border border-zinc-200 rounded-xl shadow-lg p-5 sm:p-7 flex flex-col gap-6">
        <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide" htmlFor="username">
              ID Pracownika / Kod kreskowy
            </label>
            <div className="relative">
              <input 
                type="text"
                id="username"
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                placeholder="np. EMP-001"
                required
                className="w-full h-14 pl-4 pr-11 rounded-lg border border-zinc-300 bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent transition-all font-mono text-sm"
              />
              <Barcode className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide" htmlFor="password">
              Hasło dostępowe systemu
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-14 pl-4 pr-11 rounded-lg border border-zinc-300 bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent transition-all font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full h-14 bg-[#0052CC] hover:bg-[#0041a3] text-white font-display font-black text-xs uppercase tracking-widest rounded-lg shadow hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            ZALOGUJ DO TERMINALU
          </button>
        </form>

        <div className="pt-3 border-t border-zinc-150 flex flex-col gap-2.5">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-center block">
            Szybkie logowanie demo
          </span>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <span className="text-[8.5px] text-zinc-500 font-bold uppercase text-center block mb-1.5 tracking-wide">Operatorzy WMS</span>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin({ id: 'EMP-1102', password: 'picker' }, "picker")}
                  className="py-2 px-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 hover:text-zinc-950 text-[10px] font-mono rounded truncate text-left cursor-pointer transition-all flex flex-col"
                >
                  <span className="font-bold text-zinc-800">Jan Kowalski</span>
                  <span className="text-[8px] text-zinc-400 font-sans mt-0.5">Kompletujący (EMP-1102)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin({ id: 'EMP-9921', password: 'packer' }, "packer")}
                  className="py-2 px-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 hover:text-zinc-950 text-[10px] font-mono rounded truncate text-left cursor-pointer transition-all flex flex-col"
                >
                  <span className="font-bold text-zinc-800">Mariusz Pakosz</span>
                  <span className="text-[8px] text-zinc-400 font-sans mt-0.5">Pakowacz (EMP-9921)</span>
                </button>
              </div>
            </div>

            <div>
              <span className="text-[8.5px] text-zinc-500 font-bold uppercase text-center block mb-1.5 tracking-wide">Kadra Zarządzająca</span>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin({ id: 'EMP-9104', password: 'manager' }, "picker")}
                  className="py-2 px-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 hover:text-zinc-950 text-[10px] font-mono rounded truncate text-left cursor-pointer transition-all flex flex-col"
                >
                  <span className="font-bold text-zinc-800">Wojtek Nowak</span>
                  <span className="text-[8px] text-zinc-400 font-sans mt-0.5">Kierownik magazynu (EMP-9104)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin({ id: 'EMP-8492', password: 'admin' }, "packer")}
                  className="py-2 px-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 hover:text-zinc-950 text-[10px] font-mono rounded truncate text-left cursor-pointer transition-all flex flex-col"
                >
                  <span className="font-bold text-zinc-800">System Admin</span>
                  <span className="text-[8px] text-zinc-400 font-sans mt-0.5">Administrator (EMP-8492)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-150 text-center">
          <button
            type="button"
            onClick={() => {
              window.location.hash = '';
              window.location.reload();
            }}
            className="text-[11px] font-bold text-[#0052CC] hover:text-[#0041a3] hover:underline cursor-pointer"
          >
            ← Powrót do Portalu Administratora
          </button>
        </div>
      </div>
    </div>
  );
}




export function WorkerHome({ currentUser, onLogout, onLaunchTerminal }) {
  return (
    <div className="flex-grow max-w-4xl mx-auto w-full px-4 py-8 flex flex-col justify-center">
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden p-6 md:p-10 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-zinc-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-zinc-50 border border-zinc-250 flex items-center justify-center text-[#0052CC]">
              <UserCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-display font-black text-zinc-900 uppercase tracking-wide">
                  Witaj, {currentUser.name}!
                </h2>
                <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-250 text-emerald-700 font-mono text-[9px] rounded uppercase font-bold tracking-widest">
                  Zalogowano
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-mono mt-1">
                Przypisana Zmiana: <span className="text-zinc-800 font-bold">{currentUser.shift}</span> • Rola: <span className="text-[#0052CC] font-bold uppercase">{currentUser.role === "picker" ? "Zbieracz / Picker" : "Pakowacz / Packer"}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-655 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shrink-0"
          >
            <LogOut className="w-4 h-4" />
            Wyloguj się
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl flex items-center gap-3">
            <Timer className="w-8 h-8 text-[#0052CC] shrink-0" />
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block font-mono">Norma Kompletacji</span>
              <span className="text-sm font-bold text-zinc-900 font-mono leading-tight">Maks. 180s / produkt</span>
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl flex items-center gap-3">
            <Award className="w-8 h-8 text-amber-500 shrink-0" />
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block font-mono">Aktualny Bonus</span>
              <span className="text-sm font-bold text-amber-600 font-mono leading-tight">+12.5% Produktywności</span>
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl flex items-center gap-3">
            <Wifi className="w-8 h-8 text-emerald-500 shrink-0" />
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block font-mono">ZASIĘG WMS</span>
              <span className="text-sm font-bold text-emerald-600 font-mono leading-tight flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Stabilne Połączenie
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-2">
          <h3 className="text-xs font-display font-black uppercase text-zinc-400 tracking-widest">
            Wybierz moduł terminala
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-6 rounded-xl border flex flex-col justify-between gap-6 transition-all ${
              currentUser.role === "picker" 
                ? "bg-blue-50/50 border-[#0052CC] shadow-md" 
                : "bg-white border-zinc-200 hover:border-zinc-350"
            }`}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-lg border ${
                    currentUser.role === "picker"
                      ? "bg-white border-[#0052CC]/30 text-[#0052CC]"
                      : "bg-zinc-50 border-zinc-250 text-zinc-400"
                  }`}>
                    <Layers className="w-6 h-6" />
                  </div>
                  {currentUser.role === "picker" && (
                    <span className="px-2 py-0.5 bg-[#0052CC] text-white text-[8px] uppercase tracking-wider font-bold rounded">Twoja rola</span>
                  )}
                </div>
                <h4 className="font-display font-black text-base text-zinc-900 uppercase tracking-wider mt-2">
                  STACJA ZBIERACZA (PICKER WMS)
                </h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Moduł przeznaczony do kompletowania zamówień bezpośrednio z półek magazynowych za pomocą wskazówek świetlnych i głosowych.
                </p>
              </div>

              <button
                onClick={() => { sounds.playSuccess(); onLaunchTerminal("picker"); }}
                className="w-full py-3 px-4 rounded-lg font-display font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer bg-[#0052CC] hover:bg-[#0041a3] text-white shadow-md active:scale-[0.98]"
              >
                URUCHOM TERMINAL KOLEKTORA
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className={`p-6 rounded-xl border flex flex-col justify-between gap-6 transition-all ${
              currentUser.role === "packer" 
                ? "bg-purple-50/50 border-purple-500 shadow-md" 
                : "bg-white border-zinc-200 hover:border-zinc-350"
            }`}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-lg border ${
                    currentUser.role === "packer"
                      ? "bg-white border-purple-500/30 text-purple-650"
                      : "bg-zinc-50 border-zinc-250 text-zinc-400"
                  }`}>
                    <Box className="w-6 h-6" />
                  </div>
                  {currentUser.role === "packer" && (
                    <span className="px-2 py-0.5 bg-purple-600 text-white text-[8px] uppercase tracking-wider font-bold rounded">Twoja rola</span>
                  )}
                </div>
                <h4 className="font-display font-black text-base text-zinc-900 uppercase tracking-wider mt-2">
                  STACJA PAKOWACZA (PACKER WMS)
                </h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Moduł weryfikacji zebranych produktów, ważenia paczek, wyboru kartonów i szybkiego drukowania etykiet wysyłkowych.
                </p>
              </div>

              <button
                onClick={() => { sounds.playSuccess(); onLaunchTerminal("packer"); }}
                className="w-full py-3 px-4 rounded-lg font-display font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer bg-purple-600 hover:bg-purple-700 text-white shadow-md active:scale-[0.98]"
              >
                URUCHOM STACJĘ WERYFIKACJI
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




import { PickerView } from "../components/PickerView";




import { PackerView } from "../components/PackerView";




const readStoredAdminForTerminal = () => {
  if (typeof window === 'undefined') return { user: null, tab: 'login' };
  try {
    const stored = window.localStorage.getItem('wms-current-user');
    if (stored) {
      const user = JSON.parse(stored);
      return {
        user: {
          empId: user.employeeId || user.id || 'EMP-ADMIN',
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.name || 'Administrator'),
          shift: 'Dostęp Globalny',
          role: user.role === 'Packer' ? 'packer' : 'picker', 
          isAdmin: true
        },
        tab: 'worker_terminal'
      };
    }
  } catch (e) {
    console.error(e);
  }
  return { user: null, tab: 'login' };
};


export default function WorkerTerminalStandAlone({ orders, onUpdateOrder, staffList }) {
  const [initialData] = useState(() => readStoredAdminForTerminal());
  const [currentUser, setCurrentUser] = useState(initialData.user);
  const [activeTab, setActiveTab] = useState(initialData.tab);

  const handleLogin = (userCredentials) => {
    setCurrentUser(userCredentials);
    setActiveTab("worker_terminal");
  };

  const handleLogout = () => {
    sounds.playBeep();
    
    window.localStorage.removeItem('wms-current-user');
    window.localStorage.removeItem('wms-in-lobby');
    window.localStorage.removeItem('wms-current-tab');
    setCurrentUser(null);
    setActiveTab("login");
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#f4f6f9] transition-colors duration-300">
      {activeTab === "login" && (
        <WorkerLogin workersList={WORKERS} staffList={staffList} onLoginSelected={handleLogin} />
      )}

      {activeTab === "home" && (
        <WorkerHome 
          currentUser={currentUser} 
          onLogout={handleLogout} 
          onLaunchTerminal={(selectedRole) => {
            setCurrentUser(prev => ({ ...prev, role: selectedRole }));
            setActiveTab("worker_terminal");
          }} 
        />
      )}

      {activeTab === "worker_terminal" && currentUser && (
        currentUser.role === "picker" ? (
          <PickerView 
            orders={orders} 
            onUpdateOrder={onUpdateOrder} 
            workerName={currentUser.name}
            currentUser={currentUser}
            onBackToMenu={() => { sounds.playBeep(); setActiveTab("home"); }}
          />
        ) : (
          <PackerView 
            orders={orders} 
            onUpdateOrder={onUpdateOrder} 
            workerName={currentUser.name}
            currentUser={currentUser}
            onBackToMenu={() => { sounds.playBeep(); setActiveTab("home"); }}
          />
        )
      )}
    </div>
  );
}

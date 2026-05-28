import React, { useState, useEffect, useRef } from "react";
import { 
  User, ShieldAlert, BadgeInfo, Key, Hammer, LogIn, Warehouse, HelpCircle, Eye, EyeOff,
  Barcode, Clock, AlertCircle, Play, CheckCircle, ChevronRight, 
  MapPin, Check, RefreshCw, Box, Printer, CheckSquare, Square, 
  ArrowLeft, Scale, ShoppingCart, Layers, UserCheck, Timer, Award, LogOut, ArrowRight
} from "lucide-react";

// Local Sound Helper
import { sounds } from "../components/SoundEffects";

// Warehouse Static Data
import { INITIAL_PRODUCTS, WORKERS } from "../data/warehouseData";

// ==========================================
// 1. SUB-COMPONENT: WORKER LOGIN VIEW
// ==========================================
export function WorkerLogin({ workersList, staffList, onLoginSelected }) {
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("picker"); // picker, packer

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    sounds.playSuccess();
    
    const cleanId = empId.toUpperCase().trim();
    let name = "J. SMITH";
    let shift = "A-Morning";

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
    }

    onLoginSelected({
      empId: cleanId || "EMP-001",
      name,
      shift,
      role: selectedRole
    });
  };

  const handleQuickLogin = (worker, role) => {
    sounds.playBeep();
    setEmpId(worker.id);
    setSelectedRole(role);
  };

  return (
    <div className="flex-grow max-w-md mx-auto w-full px-4 pt-12 pb-24 flex flex-col justify-center items-center">
      <header className="flex flex-col items-center text-center gap-2 mb-8">
        <div className="flex items-center gap-3">
          <Warehouse className="w-9 h-9 text-[#7bd0ff]" />
          <h1 className="font-display text-2xl font-black text-[#d5e3fc] tracking-wider uppercase">
            Logistics OS
          </h1>
        </div>
        <p className="text-xs text-[#798098] font-mono tracking-widest uppercase">
          Magazynowy Terminal Roboczy
        </p>
      </header>

      <div className="w-full bg-[#122032] border border-[#233144] rounded-xl shadow-lg p-5 sm:p-7 flex flex-col gap-6">
        <div className="flex bg-[#051425] p-1 rounded-lg border border-[#1d2b3d]">
          <button
            type="button"
            onClick={() => { sounds.playBeep(); setSelectedRole("picker"); }}
            className={`flex-1 py-3 text-xs font-display font-extrabold uppercase rounded-md transition-all tracking-wider cursor-pointer ${
              selectedRole === "picker" 
                ? "bg-[#2170e4] text-white shadow" 
                : "text-[#798098] hover:text-[#c6c6cd]"
            }`}
          >
            Sektor Zbieraczy
          </button>
          
          <button
            type="button"
            onClick={() => { sounds.playBeep(); setSelectedRole("packer"); }}
            className={`flex-1 py-3 text-xs font-display font-extrabold uppercase rounded-md transition-all tracking-wider cursor-pointer ${
              selectedRole === "packer" 
                ? "bg-[#2170e4] text-white shadow" 
                : "text-[#798098] hover:text-[#c6c6cd]"
            }`}
          >
            Sektor Pakowaczy
          </button>
        </div>

        <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#798098] uppercase tracking-wide" htmlFor="username">
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
                className="w-full h-12 pl-4 pr-10 rounded-lg border border-[#233144] bg-[#051425] text-[#d5e3fc] placeholder-[#798098] focus:outline-none focus:ring-2 focus:ring-[#7bd0ff] focus:border-transparent transition-all font-mono text-sm"
              />
              <User className="absolute right-3.5 top-3.5 w-5 h-5 text-[#798098]" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#798098] uppercase tracking-wide" htmlFor="password">
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
                className="w-full h-12 pl-4 pr-10 rounded-lg border border-[#233144] bg-[#051425] text-[#d5e3fc] placeholder-[#798098] focus:outline-none focus:ring-2 focus:ring-[#7bd0ff] focus:border-transparent transition-all font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-[#798098] hover:text-[#c6c6cd] focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full h-13 bg-[#7bd0ff] hover:bg-[#5bbbef] text-[#051425] font-display font-black text-xs uppercase tracking-widest rounded-lg hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            ZALOGUJ DO TERMINALU
          </button>
        </form>

        <div className="pt-2 border-t border-[#1d2b3d] flex flex-col gap-2.5">
          <span className="text-[10px] font-bold text-[#798098] uppercase tracking-wider text-center block">
            Szybkie logowanie demo
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[8px] text-[#798098] uppercase text-center block mb-1">Zbieracze (Pickers)</span>
              <div className="flex flex-col gap-1">
                {workersList.pickers.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleQuickLogin(p, "picker")}
                    className="py-1.5 px-2 bg-[#051425] hover:bg-[#111f32] border border-[#1d2b3d] text-[#c6c6cd] text-[10px] font-mono rounded truncate text-left cursor-pointer"
                  >
                    {p.name} ({p.id})
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[8px] text-[#798098] uppercase text-center block mb-1">Pakowacze (Packers)</span>
              <div className="flex flex-col gap-1">
                {workersList.packers.map(pk => (
                  <button
                    key={pk.id}
                    type="button"
                    onClick={() => handleQuickLogin(pk, "packer")}
                    className="py-1.5 px-2 bg-[#051425] hover:bg-[#111f32] border border-[#1d2b3d] text-[#c6c6cd] text-[10px] font-mono rounded truncate text-left cursor-pointer"
                  >
                    {pk.name} ({pk.id})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-[#1d2b3d] text-center">
          <button
            type="button"
            onClick={() => {
              window.location.hash = '';
              window.location.reload();
            }}
            className="text-[11px] font-bold text-[#7bd0ff] hover:text-[#5bbbef] hover:underline cursor-pointer"
          >
            ← Powrót do Portalu Administratora
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. SUB-COMPONENT: WORKER MENU HOME
// ==========================================
export function WorkerHome({ currentUser, onLogout, onLaunchTerminal }) {
  return (
    <div className="flex-grow max-w-4xl mx-auto w-full px-4 py-8 flex flex-col justify-center">
      <div className="bg-[#122032] border border-[#233144] rounded-2xl shadow-xl overflow-hidden p-6 md:p-10 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-[#233144]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#1d2b3d] border border-[#7bd0ff]/30 flex items-center justify-center text-[#7bd0ff]">
              <UserCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-display font-black text-[#d5e3fc] uppercase tracking-wide">
                  Witaj, {currentUser.name}!
                </h2>
                <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/30 text-green-400 font-mono text-[9px] rounded uppercase font-bold tracking-widest">
                  Zalogowano
                </span>
              </div>
              <p className="text-xs text-[#798098] font-mono mt-1">
                Przypisana Zmiana: <span className="text-[#c6c6cd] font-bold">{currentUser.shift}</span> • Rola: <span className="text-[#7bd0ff] font-bold uppercase">{currentUser.role === "picker" ? "Zbieracz / Picker" : "Pakowacz / Packer"}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-950/20 border border-red-900/40 hover:bg-red-950/40 text-red-400 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shrink-0"
          >
            <LogOut className="w-4 h-4" />
            Wyloguj konto
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#051425] border border-[#1d2b3d] p-4 rounded-xl flex items-center gap-3">
            <Timer className="w-8 h-8 text-[#7bd0ff] shrink-0" />
            <div>
              <span className="text-[10px] text-[#798098] uppercase block font-mono">Norma Kompletacji</span>
              <span className="text-sm font-bold text-[#d5e3fc] font-mono leading-tight">Maks. 180s / produkt</span>
            </div>
          </div>

          <div className="bg-[#051425] border border-[#1d2b3d] p-4 rounded-xl flex items-center gap-3">
            <Award className="w-8 h-8 text-yellow-500 shrink-0" />
            <div>
              <span className="text-[10px] text-[#798098] uppercase block font-mono">Aktualny Bonus</span>
              <span className="text-sm font-bold text-yellow-400 font-mono leading-tight">+12.5% Produktywności</span>
            </div>
          </div>

          <div className="bg-[#051425] border border-[#1d2b3d] p-4 rounded-xl flex flex-col justify-center">
            <span className="text-[10px] text-[#798098] uppercase block font-mono">Status RTLS GPS</span>
            <span className="text-sm font-bold text-[#7bd0ff] font-mono leading-tight">Zsynchronizowano (99.8%)</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-2">
          <h3 className="text-xs font-display font-black uppercase text-[#798098] tracking-widest">
            Wybierz moduł terminala
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-6 rounded-xl border flex flex-col justify-between gap-6 transition-all ${
              currentUser.role === "picker" 
                ? "bg-[#2170e4]/10 border-[#2170e4] shadow-md" 
                : "bg-[#0b1828]/60 border-[#1d2b3d] hover:border-[#2170e4]/40"
            }`}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-[#051425] border border-[#2170e4]/30 text-[#7bd0ff] rounded-lg">
                    <Layers className="w-6 h-6" />
                  </div>
                  {currentUser.role === "picker" && (
                    <span className="px-2 py-0.5 bg-[#2170e4] text-white text-[8px] uppercase tracking-wider font-bold rounded">Zalecane</span>
                  )}
                </div>
                <h4 className="font-display font-black text-base text-[#d5e3fc] uppercase tracking-wider mt-2">
                  STACJA ZBIERACZA (PICKERWS)
                </h4>
                <p className="text-xs text-[#798098] leading-relaxed">
                  Moduł przeznaczony do kompletowania zamówień bezpośrednio z półek magazynowych za pomocą wskazówek świetlnych i głosowych.
                </p>
              </div>

              <button
                onClick={() => { sounds.playSuccess(); onLaunchTerminal("picker"); }}
                className="w-full py-3 px-4 rounded-lg font-display font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer bg-[#2170e4] hover:bg-[#2c7ce7] text-white shadow-md active:scale-[0.98]"
              >
                URUCHOM TERMINAL KOLEKTORA
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className={`p-6 rounded-xl border flex flex-col justify-between gap-6 transition-all ${
              currentUser.role === "packer" 
                ? "bg-purple-950/10 border-purple-500 shadow-md" 
                : "bg-[#0b1828]/60 border-[#1d2b3d] hover:border-purple-500/40"
            }`}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-[#051425] border border-purple-500/30 text-purple-400 rounded-lg">
                    <Box className="w-6 h-6" />
                  </div>
                  {currentUser.role === "packer" && (
                    <span className="px-2 py-0.5 bg-purple-600 text-white text-[8px] uppercase tracking-wider font-bold rounded">Zalecane</span>
                  )}
                </div>
                <h4 className="font-display font-black text-base text-[#d5e3fc] uppercase tracking-wider mt-2">
                  STACJA PAKOWACZA (PACKERWS)
                </h4>
                <p className="text-xs text-[#798098] leading-relaxed">
                  Moduł weryfikacji zebranych produktów, ważenia paczek, wyboru kartonów i szybkiego drukowania etykiet wysyłkowych.
                </p>
              </div>

              <button
                onClick={() => { sounds.playSuccess(); onLaunchTerminal("packer"); }}
                className="w-full py-3 px-4 rounded-lg font-display font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer bg-purple-600 hover:bg-purple-500 text-white shadow-md active:scale-[0.98]"
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

// ==========================================
// 3. SUB-COMPONENT: REUSABLE PICKER VIEW
// ==========================================
import { PickerView } from "../components/PickerView";

// ==========================================
// 4. SUB-COMPONENT: REUSABLE PACKER VIEW
// ==========================================
import { PackerView } from "../components/PackerView";

// ==========================================
// 5. COMBINED EXPORT CONTAINER
// ==========================================
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
          role: user.role === 'Packer' ? 'packer' : 'picker', // default to picker
          isAdmin: true
        },
        tab: 'home'
      };
    }
  } catch (e) {
    console.error(e);
  }
  return { user: null, tab: 'login' };
};

/**
 * Fully decoupled and combined entry point designed exclusively for WMS workers.
 * This can be loaded independently in the warehouse on scanner devices (e.g. Zebra TC52).
 */
export default function WorkerTerminalStandAlone({ orders, onUpdateOrder, staffList }) {
  const [initialData] = useState(() => readStoredAdminForTerminal());
  const [currentUser, setCurrentUser] = useState(initialData.user);
  const [activeTab, setActiveTab] = useState(initialData.tab);

  const handleLogin = (userCredentials) => {
    setCurrentUser(userCredentials);
    setActiveTab("home");
  };

  const handleLogout = () => {
    sounds.playBeep();
    // Clear localStorage to log them out of the global admin session!
    window.localStorage.removeItem('wms-current-user');
    window.localStorage.removeItem('wms-in-lobby');
    window.localStorage.removeItem('wms-current-tab');
    setCurrentUser(null);
    setActiveTab("login");
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#051425]">
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
            onBackToMenu={() => { sounds.playBeep(); setActiveTab("home"); }}
          />
        ) : (
          <PackerView 
            orders={orders} 
            onUpdateOrder={onUpdateOrder} 
            workerName={currentUser.name}
            onBackToMenu={() => { sounds.playBeep(); setActiveTab("home"); }}
          />
        )
      )}
    </div>
  );
}

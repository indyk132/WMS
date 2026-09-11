import React, { useState, useEffect } from "react";
import { 
  LogIn, Warehouse, Eye, EyeOff, Barcode, Clock, Timer, Award, LogOut, ArrowRight, Wifi, UserCheck, Layers, Box,
  Battery, BatteryCharging, BatteryWarning, Wrench, AlertTriangle, CheckCircle2, X, RefreshCw, Smartphone, Zap
} from "lucide-react";
import { sounds } from "../components/SoundEffects";
import { WORKERS } from "../data/warehouseData";
import { PickerView } from "../components/PickerView";
import { PackerView } from "../components/PackerView";

interface WorkerLoginProps {
  workersList: any;
  staffList: any[];
  onLoginSelected: (credentials: any) => void;
}

export function WorkerLogin({ workersList, staffList, onLoginSelected }: WorkerLoginProps) {
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("picker"); 

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playSuccess();
    
    const cleanId = empId.toUpperCase().trim();
    let name = "J. SMITH";
    let shift = "A-Morning";
    let isStaffAdmin = false;
    let staffRole = "Worker";

    const foundPicker = workersList.pickers.find((p: any) => p.id === cleanId);
    const foundPacker = workersList.packers.find((p: any) => p.id === cleanId);
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

  const handleQuickLogin = (worker: any, role: string) => {
    sounds.playBeep();
    setEmpId(worker.id);
    setPassword(worker.password || "");
    setSelectedRole(role);
  };

  return (
    <div className="flex-grow max-w-md mx-auto w-full px-4 pt-12 pb-24 flex flex-col justify-center items-center font-sans h-screen">
      <header className="flex flex-col items-center text-center gap-2 mb-8 select-none">
        <div className="flex items-center gap-3">
          <Warehouse className="w-9 h-9 text-[#0052CC]" />
          <h1 className="font-display text-2xl font-black text-zinc-900 tracking-wider uppercase">
            Logistics OS
          </h1>
        </div>
        <p className="text-xs text-zinc-500 font-mono tracking-widest uppercase mt-1.5 font-bold">
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
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 focus:outline-none cursor-pointer bg-transparent border-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full h-14 bg-[#0052CC] hover:bg-[#0041a3] text-white font-display font-black text-xs uppercase tracking-widest rounded-lg shadow hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer border-none"
          >
            <LogIn className="w-4 h-4" />
            ZALOGUJ DO TERMINALU
          </button>
        </form>

        <div className="pt-3 border-t border-zinc-150 flex flex-col gap-2.5">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-center block">
            Szybkie logowanie demo
          </span>
          <div className="grid grid-cols-2 gap-3.5 select-none">
            <div>
              <span className="text-[8.5px] text-zinc-500 font-bold uppercase text-center block mb-1.5 tracking-wide">Operatorzy WMS</span>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin({ id: 'EMP-1102', password: 'picker' }, "picker")}
                  className="py-2 px-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-750 hover:text-zinc-950 text-[10px] font-mono rounded truncate text-left cursor-pointer transition-all flex flex-col"
                >
                  <span className="font-bold text-zinc-800">Jan Kowalski</span>
                  <span className="text-[8px] text-zinc-400 font-sans mt-0.5">Kompletujący (EMP-1102)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin({ id: 'EMP-9921', password: 'packer' }, "packer")}
                  className="py-2 px-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-750 hover:text-zinc-950 text-[10px] font-mono rounded truncate text-left cursor-pointer transition-all flex flex-col"
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
                  className="py-2 px-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-750 hover:text-zinc-950 text-[10px] font-mono rounded truncate text-left cursor-pointer transition-all flex flex-col"
                >
                  <span className="font-bold text-zinc-800">Wojtek Nowak</span>
                  <span className="text-[8px] text-zinc-400 font-sans mt-0.5">Kierownik (EMP-9104)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin({ id: 'EMP-8492', password: 'admin' }, "packer")}
                  className="py-2 px-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-750 hover:text-zinc-950 text-[10px] font-mono rounded truncate text-left cursor-pointer transition-all flex flex-col"
                >
                  <span className="font-bold text-zinc-800">System Admin</span>
                  <span className="text-[8px] text-zinc-400 font-sans mt-0.5">Admin (EMP-8492)</span>
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
            className="text-[11px] font-bold text-[#0052CC] hover:text-[#0041a3] hover:underline cursor-pointer bg-transparent border-none"
          >
            ← Powrót do Portalu Administratora
          </button>
        </div>
      </div>
    </div>
  );
}

interface WorkerHomeProps {
  currentUser: any;
  onLogout: () => void;
  onLaunchTerminal: (role: string) => void;
  battery: { level: number; charging: boolean; supported: boolean };
  onOpenScannerTest: () => void;
  onOpenReportModal: () => void;
}

export function WorkerHome({ 
  currentUser, 
  onLogout, 
  onLaunchTerminal,
  battery,
  onOpenScannerTest,
  onOpenReportModal
}: WorkerHomeProps) {
  return (
    <div className="flex-grow max-w-4xl mx-auto w-full px-4 py-8 flex flex-col justify-center min-h-screen font-sans">
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden p-6 md:p-8 flex flex-col gap-6 animate-fadeIn">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-zinc-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-zinc-50 border border-zinc-300 flex items-center justify-center text-[#0052CC]">
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
            className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-655 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shrink-0 bg-white"
          >
            <LogOut className="w-4 h-4" />
            Wyloguj się
          </button>
        </div>

        {/* Status Grid with Option 83 Battery */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none">
          <div className="bg-zinc-50 border border-zinc-200 p-3.5 rounded-xl flex items-center gap-3">
            <Timer className="w-7 h-7 text-[#0052CC] shrink-0 animate-pulse" />
            <div>
              <span className="text-[9px] text-zinc-500 uppercase block font-mono">Norma Kompletacji</span>
              <span className="text-xs font-bold text-zinc-900 font-mono leading-tight">Maks. 180s / SKU</span>
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 p-3.5 rounded-xl flex items-center gap-3">
            <Award className="w-7 h-7 text-amber-500 shrink-0" />
            <div>
              <span className="text-[9px] text-zinc-500 uppercase block font-mono">Aktualny Bonus</span>
              <span className="text-xs font-bold text-amber-600 font-mono leading-tight">+12.5% Premii</span>
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 p-3.5 rounded-xl flex items-center gap-3">
            <Wifi className="w-7 h-7 text-emerald-500 shrink-0 animate-pulse" />
            <div>
              <span className="text-[9px] text-zinc-500 uppercase block font-mono">Zasięg Wi-Fi AP-4</span>
              <span className="text-xs font-bold text-emerald-600 font-mono leading-tight flex items-center gap-1 font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Stabilne
              </span>
            </div>
          </div>

          {/* OPTION 83: Battery Card */}
          <div className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
            battery.level <= 20 && !battery.charging 
              ? 'bg-red-50 border-red-200 text-red-800' 
              : 'bg-zinc-50 border-zinc-200 text-zinc-900'
          }`}>
            {battery.charging ? (
              <BatteryCharging className="w-7 h-7 text-emerald-500 shrink-0 animate-pulse" />
            ) : battery.level <= 20 ? (
              <BatteryWarning className="w-7 h-7 text-red-500 shrink-0 animate-bounce" />
            ) : (
              <Battery className="w-7 h-7 text-blue-600 shrink-0" />
            )}
            <div>
              <span className="text-[9px] text-zinc-500 uppercase block font-mono">83. Bateria Terminala</span>
              <span className="text-xs font-bold font-mono leading-tight flex items-center gap-1">
                {battery.level}% {battery.charging ? '⚡ Ładowanie' : battery.level <= 20 ? '⚠️ Niski!' : 'OK'}
              </span>
            </div>
          </div>
        </div>

        {/* Hardware & Diagnostics Bar (Options 81 & 88) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 shadow-3xs">
              <Smartphone className="w-4.5 h-4.5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Narzędzia Techniczne Stanowiska Roboczego</h4>
              <p className="text-[11px] text-slate-500">Diagnostyka lasera skanera Zebra/Honeywell oraz zgłaszanie usterek sprzętowych.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenScannerTest}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
              title="Test prędkości odczytu lasera, suffixu Enter oraz poprawności EAN/Code128"
            >
              <Barcode className="w-4 h-4 text-blue-600" />
              81. Test Skanera Kodów
            </button>

            <button
              type="button"
              onClick={onOpenReportModal}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
              title="Zgłoś awarię skanera, drukarki Zebra, terminala lub wózka"
            >
              <Wrench className="w-4 h-4 text-rose-600" />
              88. Zgłoś Awarię Sprzętu
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-1">
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
                      : "bg-zinc-50 border-zinc-250 text-zinc-405"
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
                className="w-full py-3 px-4 rounded-lg font-display font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer bg-[#0052CC] hover:bg-[#0041a3] text-white shadow-md active:scale-[0.98] border-none"
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
                      : "bg-zinc-50 border-zinc-255 text-zinc-400"
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
                className="w-full py-3 px-4 rounded-lg font-display font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer bg-purple-600 hover:bg-purple-700 text-white shadow-md active:scale-[0.98] border-none"
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

interface WorkerTerminalStandAloneProps {
  orders: any[];
  onUpdateOrder: (id: string, updates: any) => void;
  staffList: any[];
  products: any[];
}

export default function WorkerTerminalStandAlone({ orders, onUpdateOrder, staffList, products }: WorkerTerminalStandAloneProps) {
  const [initialData] = useState(() => readStoredAdminForTerminal());
  const [currentUser, setCurrentUser] = useState(initialData.user);
  const [activeTab, setActiveTab] = useState(initialData.tab);

  // ----------------------------------------------------
  // OPTION 83: Battery Level API Hook & Status Indicator
  // ----------------------------------------------------
  const [battery, setBattery] = useState<{ level: number; charging: boolean; supported: boolean }>({
    level: 88,
    charging: false,
    supported: false,
  });

  useEffect(() => {
    let batteryObj: any = null;
    const updateBattery = () => {
      if (batteryObj) {
        setBattery({
          level: Math.round(batteryObj.level * 100),
          charging: batteryObj.charging,
          supported: true,
        });
      }
    };

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((batt: any) => {
        batteryObj = batt;
        updateBattery();
        batt.addEventListener('levelchange', updateBattery);
        batt.addEventListener('chargingchange', updateBattery);
      }).catch(() => {
        setBattery({ level: 88, charging: false, supported: false });
      });
    }

    return () => {
      if (batteryObj) {
        batteryObj.removeEventListener('levelchange', updateBattery);
        batteryObj.removeEventListener('chargingchange', updateBattery);
      }
    };
  }, []);

  // ----------------------------------------------------
  // OPTION 81: Barcode Scanner Diagnostics Test Modal
  // ----------------------------------------------------
  const [isScannerTestOpen, setIsScannerTestOpen] = useState(false);
  const [scannerInput, setScannerInput] = useState("");
  const [keyTimestamps, setKeyTimestamps] = useState<number[]>([]);
  const [scanLogs, setScanLogs] = useState<Array<{
    code: string;
    speedMs: number;
    hasEnter: boolean;
    symbology: string;
    time: string;
  }>>([
    {
      code: '5901234567890',
      speedMs: 24,
      hasEnter: true,
      symbology: 'EAN-13 (Standardowy kod kreskowy)',
      time: '18:40:12'
    },
    {
      code: 'LOC-A-02-01',
      speedMs: 31,
      hasEnter: true,
      symbology: 'Magazynowy Kod Lokacji',
      time: '18:42:55'
    }
  ]);

  const handleScannerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const now = performance.now();
    setKeyTimestamps(prev => [...prev, now]);

    if (e.key === 'Enter') {
      e.preventDefault();
      const val = scannerInput.trim();
      if (!val) return;

      sounds.playBeep();
      const timestamps = [...keyTimestamps, now];
      let speed = 25;
      if (timestamps.length >= 2) {
        speed = Math.round(timestamps[timestamps.length - 1] - timestamps[0]);
      }

      let symb = 'Code 128 / Przemysłowy Alfanumeryczny';
      if (/^\d{13}$/.test(val)) symb = 'EAN-13 (Standardowy kod kreskowy)';
      else if (/^\d{8}$/.test(val)) symb = 'EAN-8 (Format skrócony)';
      else if (/^\d{12}$/.test(val)) symb = 'UPC-A (Standard handlowy)';
      else if (/^\d{14}$/.test(val)) symb = 'ITF-14 (Karton logistyczny)';
      else if (val.startsWith('LOC-')) symb = 'Magazynowy Kod Lokacji';
      else if (val.startsWith('TOTE-')) symb = 'Kod Pojemnika Kompletacji';
      else if (val.startsWith('ORD-')) symb = 'Kod Zamówienia WMS';
      else if (/^\d{2}-\d{3}$/.test(val)) symb = 'Kod Pocztowy PL';

      setScanLogs(prev => [
        {
          code: val,
          speedMs: speed,
          hasEnter: true,
          symbology: symb,
          time: new Date().toLocaleTimeString('pl-PL')
        },
        ...prev.slice(0, 9)
      ]);

      setScannerInput("");
      setKeyTimestamps([]);
    }
  };

  const handleSimulateScan = (codeToScan: string) => {
    sounds.playBeep();
    let symb = 'Code 128 / Przemysłowy Alfanumeryczny';
    if (/^\d{13}$/.test(codeToScan)) symb = 'EAN-13 (Standardowy kod kreskowy)';
    else if (codeToScan.startsWith('LOC-')) symb = 'Magazynowy Kod Lokacji';
    else if (codeToScan.startsWith('TOTE-')) symb = 'Kod Pojemnika Kompletacji';

    setScanLogs(prev => [
      {
        code: codeToScan,
        speedMs: Math.floor(18 + Math.random() * 20),
        hasEnter: true,
        symbology: symb,
        time: new Date().toLocaleTimeString('pl-PL')
      },
      ...prev.slice(0, 9)
    ]);
  };

  // ----------------------------------------------------
  // OPTION 88: Worker Equipment Failure Reporting Modal
  // ----------------------------------------------------
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [ticketDeviceType, setTicketDeviceType] = useState('Skaner ręczny Zebra TC57');
  const [ticketDeviceId, setTicketDeviceId] = useState('');
  const [ticketUrgency, setTicketUrgency] = useState('Średni');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketToast, setTicketToast] = useState<string | null>(null);

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketDescription.trim()) return;

    sounds.playSuccess();
    const storedTickets = JSON.parse(localStorage.getItem('wms-equipment-tickets') || '[]');
    const newTicket = {
      id: `TCK-${Math.floor(200 + Math.random() * 800)}`,
      deviceType: `${ticketDeviceType} ${ticketDeviceId.trim() ? `[${ticketDeviceId.trim()}]` : ''}`.trim(),
      station: currentUser?.role === 'picker' ? 'Strefa Kompletacji (Picker)' : 'Stacja Pakowania (Packer)',
      urgency: ticketUrgency,
      description: ticketDescription.trim(),
      reportedBy: currentUser?.name || 'Operator terminala',
      reportedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'OTWARTE'
    };

    const updated = [newTicket, ...storedTickets];
    localStorage.setItem('wms-equipment-tickets', JSON.stringify(updated));

    setTicketDescription('');
    setTicketDeviceId('');
    setIsReportModalOpen(false);
    setTicketToast(`[Opcja 88]: Zgłoszenie awarii ${newTicket.id} przekazano do Helpdesku IT!`);
    setTimeout(() => setTicketToast(null), 4500);
  };

  const handleLogin = (userCredentials: any) => {
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
    <div className="min-h-screen w-full flex flex-col bg-[#f5f7fa] transition-colors duration-305">
      {/* Toast Notification for Option 88 */}
      {ticketToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          {ticketToast}
        </div>
      )}

      {/* Industrial Status Bar when working in Terminal */}
      {activeTab === "worker_terminal" && currentUser && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-1.5 text-white flex flex-wrap items-center justify-between text-xs select-none">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-slate-400">
              TERMINAL: <strong className="text-white">{currentUser.empId}</strong> ({currentUser.name})
            </span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span className="hidden sm:inline font-mono text-[11px] text-slate-400">
              ROLA: <strong className="text-amber-400 uppercase">{currentUser.role === 'picker' ? 'Kompletacja' : 'Pakowanie'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* OPTION 83: Battery status indicator */}
            <div 
              className={`flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded ${
                battery.level <= 20 && !battery.charging 
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40' 
                  : 'text-emerald-400 bg-slate-800 border border-slate-700'
              }`}
              title={battery.charging ? "Terminal podłączony do stacji dokującej" : `Stan baterii: ${battery.level}%`}
            >
              {battery.charging ? (
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              ) : battery.level <= 20 ? (
                <BatteryWarning className="w-3.5 h-3.5 text-red-400 animate-bounce" />
              ) : (
                <Battery className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>83. {battery.level}%</span>
            </div>

            {/* OPTION 81: Quick scanner test trigger */}
            <button
              type="button"
              onClick={() => setIsScannerTestOpen(true)}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 hover:text-white text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
              title="Otwórz okno testowania skanera kodów kreskowych"
            >
              <Barcode className="w-3 h-3 text-blue-400" />
              81. Test Skanera
            </button>

            {/* OPTION 88: Quick report ticket trigger */}
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="px-2 py-0.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 rounded text-rose-300 hover:text-white text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
              title="Zgłoś awarię sprzętu lub skanera"
            >
              <Wrench className="w-3 h-3 text-rose-400" />
              88. Zgłoś Awarię
            </button>
          </div>
        </div>
      )}

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
          battery={battery}
          onOpenScannerTest={() => setIsScannerTestOpen(true)}
          onOpenReportModal={() => setIsReportModalOpen(true)}
        />
      )}

      {activeTab === "worker_terminal" && (
        !currentUser ? (
          <WorkerLogin workersList={WORKERS} staffList={staffList} onLoginSelected={handleLogin} />
        ) : currentUser.role === "picker" ? (
          <PickerView 
            orders={orders} 
            onUpdateOrder={onUpdateOrder} 
            workerName={currentUser?.name || "Operator WMS"}
            products={products}
            onBackToMenu={() => { sounds.playBeep(); setActiveTab("home"); }}
          />
        ) : (
          <PackerView 
            orders={orders} 
            onUpdateOrder={onUpdateOrder} 
            workerName={currentUser?.name || "Operator WMS"}
            currentUser={currentUser}
            onBackToMenu={() => { sounds.playBeep(); setActiveTab("home"); }}
          />
        )
      )}

      {/* ---------------------------------------------------- */}
      {/* OPTION 81: SCANNER DIAGNOSTICS MODAL                 */}
      {/* ---------------------------------------------------- */}
      {isScannerTestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-150 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-blue-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Barcode className="w-5 h-5 text-blue-300" />
                <h3 className="font-bold text-sm tracking-wide">81. Diagnostyka Skanera Kodów (Zebra / Honeywell)</h3>
              </div>
              <button
                onClick={() => setIsScannerTestOpen(false)}
                className="p-1 rounded-lg hover:bg-blue-800 text-blue-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                <Smartphone className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Test odczytu sprzętowego lasera / matrycy 2D</p>
                  <p className="text-blue-700 mt-0.5">
                    Skieruj skaner na dowolny kod kreskowy. System sprawdzi czas transmisji znaków, obecność suffixu Enter [CR/LF] oraz zgodność formatu.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pole aktywnego odczytu (Zeskanuj kod lub wpisz i kliknij Enter):
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="Kliknij tutaj i naciśnij spust skanera..."
                  value={scannerInput}
                  onChange={(e) => setScannerInput(e.target.value)}
                  onKeyDown={handleScannerKeyDown}
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-blue-500 rounded-xl font-mono text-sm text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-slate-500">Symuluj skan testowy:</span>
                <button
                  type="button"
                  onClick={() => handleSimulateScan('5901234567890')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer"
                >
                  EAN-13
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateScan('LOC-B-04-01')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer"
                >
                  Lokacja
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateScan('TOTE-88')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer"
                >
                  Pojemnik
                </button>
              </div>

              {/* History table */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-slate-700">Historia ostatnich odczytów:</span>
                  <button
                    type="button"
                    onClick={() => setScanLogs([])}
                    className="text-[10px] text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                  >
                    Wyczyść historię
                  </button>
                </div>
                <div className="space-y-2">
                  {scanLogs.map((log, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900">{log.code}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                            {log.symbology}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Czas: {log.time}</span>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {log.speedMs} ms
                        </span>
                        <span className="block text-[9px] text-slate-500 font-mono mt-0.5">Suffix [Enter]: OK</span>
                      </div>
                    </div>
                  ))}
                  {scanLogs.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      Brak zarejestrowanych odczytów. Zeskanuj kod kreskowy powyżej.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsScannerTestOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs cursor-pointer border-none shadow-xs"
              >
                Zamknij diagnostykę
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* OPTION 88: HARDWARE FAILURE REPORTING MODAL          */}
      {/* ---------------------------------------------------- */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-rose-700 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-rose-200" />
                <h3 className="font-bold text-sm tracking-wide">88. Zgłoś Awarię Sprzętu / Helpdesk IT</h3>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 rounded-lg hover:bg-rose-800 text-rose-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTicket} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 overflow-y-auto space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Typ uszkodzonego urządzenia:</label>
                  <select
                    value={ticketDeviceType}
                    onChange={(e) => setTicketDeviceType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                  >
                    <option value="Skaner ręczny Zebra TC57">Skaner ręczny Zebra TC57 / TC52</option>
                    <option value="Drukarka etykiet Zebra ZD421">Drukarka etykiet Zebra ZD421 / ZT411</option>
                    <option value="Terminal stacjonarny / Laptop">Terminal stacjonarny / Laptop</option>
                    <option value="Waga paczkowa / podajnikowa">Waga paczkowa / podajnikowa</option>
                    <option value="Wózek kompletacyjny / Rolkontener">Wózek kompletacyjny / Rolkontener</option>
                    <option value="Inny osprzęt magazynowy">Inny osprzęt magazynowy</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Oznaczenie / ID sprzętu:</label>
                    <input
                      type="text"
                      placeholder="np. SKAN-04, ZEBRA-P2"
                      value={ticketDeviceId}
                      onChange={(e) => setTicketDeviceId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Priorytet usterki:</label>
                    <select
                      value={ticketUrgency}
                      onChange={(e) => setTicketUrgency(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                    >
                      <option value="Niski">Niski - działa, drobny mankament</option>
                      <option value="Średni">Średni - utrudnia pracę</option>
                      <option value="Wysoki">Wysoki - przestój stanowiska</option>
                      <option value="Krytyczny">Krytyczny - blokada wysyłek</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Szczegółowy opis problemu:</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Opisz co dokładnie nie działa (np. brak wiązki lasera, zacięty papier w drukarce, błąd komunikacji Bluetooth)..."
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-blue-500"
                  />
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
                  Zgłoszenie trafi bezpośrednio do panelu Administratora WMS oraz technika dyżurnego IT.
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-md transition-colors cursor-pointer border-none"
                >
                  <Wrench className="w-3.5 h-3.5" /> Wyślij Zgłoszenie Awarii
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

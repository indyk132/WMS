import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Building, ShieldCheck, Mail, Bell, 
  Database, RefreshCw, Key, Save, Check, Info, AlertCircle,
  Truck, Eye, EyeOff, Download, Copy
} from 'lucide-react';

interface WarehouseSettings {
  warehouseName: string;
  warehouseCode: string;
  companyName: string;
  defaultUnit: string;
  pickingMethod: 'FIFO' | 'FEFO' | 'LIFO';
  autoAssignStaff: boolean;
  barcodeRequired: boolean;
  lowStockThreshold: number;
  zoneCapacityAlert: number;
  systemNotificationsEmail: string;
  apiKey: string;
  enableRfidTelemetry: boolean;
  selectedCourier: string;
  // User/Admin Panel specific security settings
  passwordMinLength: number;
  sessionTimeout: number; // in minutes
  requireMfaForAdmins: boolean;
  lockoutAttempts: number;
  passwordChangeInterval: number; // in days
  allowStaffSelfRegistration: boolean;
  defaultUserRole: 'Picker' | 'Packer' | 'Warehouse Manager' | 'Admin';
}

const DEFAULT_SETTINGS: WarehouseSettings = {
  warehouseName: 'W-A1 LOGISTICS HUB',
  warehouseCode: 'HUB-PL-01',
  companyName: 'Logistics OS Poland Sp. z o.o.',
  defaultUnit: 'szt.',
  pickingMethod: 'FIFO',
  autoAssignStaff: true,
  barcodeRequired: true,
  lowStockThreshold: 20,
  zoneCapacityAlert: 85,
  systemNotificationsEmail: 'notyfikacje@logistics-os.com',
  apiKey: 'wms_live_pk_84293xcd72e90f23821a9',
  enableRfidTelemetry: true,
  selectedCourier: 'dhl',
  // User/Admin defaults
  passwordMinLength: 8,
  sessionTimeout: 30,
  requireMfaForAdmins: true,
  lockoutAttempts: 5,
  passwordChangeInterval: 90,
  allowStaffSelfRegistration: true,
  defaultUserRole: 'Picker'
};

interface SettingsProps {
  highlightedField?: string | null;
}

export default function Settings({ highlightedField }: SettingsProps) {
  const [settings, setSettings] = useState<WarehouseSettings>(() => {
    try {
      const stored = localStorage.getItem('wms-warehouse-settings');
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [activeTab, setActiveTab] = useState<'general' | 'picking' | 'alerts' | 'integrations' | 'users'>('general');

  useEffect(() => {
    if (highlightedField === 'courier-api') {
      setActiveTab('integrations');
      setTimeout(() => {
        const element = document.getElementById('settings-courier-api');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [highlightedField]);

  const [showApiKey, setShowApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [demoProgress, setDemoProgress] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);

  const handleExportConfig = () => {
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        systemIdentifier: 'Logistics-OS-WMS',
        schemaVersion: '1.0.0',
        settings: settings
      };
      
      const fileContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([fileContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wms_config_${settings.warehouseCode.toLowerCase() || 'hub'}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export settings:', err);
      alert('Nie udało się wyeksportować konfiguracji systemu.');
    }
  };

  const handleCopyConfig = () => {
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        systemIdentifier: 'Logistics-OS-WMS',
        schemaVersion: '1.0.0',
        settings: settings
      };
      
      navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    } catch (err) {
      console.error('Failed to copy config:', err);
      alert('Kopiowanie nie powiodło się.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    setTimeout(() => {
      localStorage.setItem('wms-warehouse-settings', JSON.stringify(settings));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    }, 800);
  };

  const handleReset = () => {
    if (window.confirm('Czy na pewno chcesz przywrócić domyślne ustawienia fabryczne systemu WMS?')) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.setItem('wms-warehouse-settings', JSON.stringify(DEFAULT_SETTINGS));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    }
  };

  const runSystemDiagnostic = () => {
    setDemoProgress(true);
    setTimeout(() => {
      setDemoProgress(false);
      alert('Autodiagnostyka zakończona pomyślnie!\nZeskanowano 4 hale, 12 bram RFID, 0 błędów krytycznych.');
    }, 2000);
  };

  return (
    <div id="wms-settings-panel" className="space-y-6 font-sans text-sm text-[#334155] animate-fadeIn pb-12">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-[#0f172a] p-6 rounded-xl border border-[#1e293b] text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-[#2170e4] text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide">
              SYSTEM CONFIG
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-white font-sans flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-blue-400 rotate-45" /> Config OS & Ustawienia Magazynu
            </h2>
          </div>
          <p className="text-zinc-400 text-xs mt-1 font-medium max-w-2xl leading-relaxed">
            Centralna konfiguracja platformy WMS. Dostosuj politykę kolejkowania wydań, alerty sensoryki IoT, interfejsy zintegrowanych kurierów oraz limity reorderu SKU.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-1.5 select-none">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all border-none text-left cursor-pointer ${
                activeTab === 'general' 
                  ? 'bg-blue-50 text-blue-700 font-extrabold' 
                  : 'text-slate-550 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Building className="w-4 h-4 text-slate-500" />
              Ogólne & Profil Magazynu
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('picking')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all border-none text-left cursor-pointer ${
                activeTab === 'picking' 
                  ? 'bg-blue-50 text-blue-700 font-extrabold' 
                  : 'text-slate-550 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Database className="w-4 h-4 text-slate-500" />
              Metody Kompletacji & Pakowania
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('alerts')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all border-none text-left cursor-pointer ${
                activeTab === 'alerts' 
                  ? 'bg-blue-50 text-blue-700 font-extrabold' 
                  : 'text-slate-550 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Bell className="w-4 h-4 text-slate-500" />
              Powiadomienia & Alerty IoT
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('integrations')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all border-none text-left cursor-pointer ${
                activeTab === 'integrations' 
                  ? 'bg-blue-50 text-blue-700 font-extrabold' 
                  : 'text-slate-550 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Key className="w-4 h-4 text-slate-500" />
              Integracje API & Kurierzy
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all border-none text-left cursor-pointer ${
                activeTab === 'users' 
                  ? 'bg-blue-50 text-blue-700 font-extrabold' 
                  : 'text-slate-550 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              Użytkownicy & Bezpieczeństwo
            </button>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Narzędzia diagnostyczne</span>
            <button
              type="button"
              onClick={runSystemDiagnostic}
              disabled={demoProgress}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 transition-all text-xs border border-slate-200 cursor-pointer font-bold font-sans"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${demoProgress ? 'animate-spin' : ''}`} />
              {demoProgress ? 'Diagnozowanie...' : 'Uruchom autodiagnostykę'}
            </button>

            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-[10px] text-slate-500 font-mono leading-relaxed">
              <span className="text-[#2170e4] font-bold block">Status sprzętowy:</span>
              • Bramki RFID (Status: OK)<br />
              • Drukarki Zebra (Online)<br />
              • Skanery stacjonarne (11/12)
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-2.5 space-y-2 text-xs">
              <span className="text-[#2170e4] font-extrabold block uppercase tracking-wide text-[10px]">Szybki eksport JSON</span>
              <p className="text-[11px] text-slate-500 leading-normal">
                Przekaż parametry instalacji do systemów ERP.
              </p>
              <div className="flex gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={handleExportConfig}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer border-none transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Pobierz
                </button>
                <button
                  type="button"
                  onClick={handleCopyConfig}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded bg-white hover:bg-zinc-50 text-zinc-700 font-bold text-[11px] cursor-pointer border border-zinc-200 transition-all"
                >
                  <Copy className="w-3.5 h-3.5 text-zinc-500" />
                  {copyStatus ? 'Kopia!' : 'Kopiuj'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm">
          <form onSubmit={handleSave} className="space-y-6">
            
            {activeTab === 'general' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#2170e4]" />
                    Profil i Identyfikacja Magazynu
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Ustaw podstawowe parametry klastra i dane podmiotu gospodarczego.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Nazwa Magazynu (Słownikowa)</label>
                    <input
                      type="text"
                      required
                      value={settings.warehouseName}
                      onChange={(e) => setSettings({ ...settings, warehouseName: e.target.value })}
                      className="w-full bg-slate-50 border border-zinc-200 focus:border-blue-500 rounded px-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Kod Identyfikacyjny (WMS Cluster ID)</label>
                    <input
                      type="text"
                      required
                      value={settings.warehouseCode}
                      onChange={(e) => setSettings({ ...settings, warehouseCode: e.target.value })}
                      className="w-full bg-slate-50 border border-zinc-200 focus:border-blue-500 rounded px-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700">Nazwa Firmy / Operatora Logistycznego</label>
                    <input
                      type="text"
                      required
                      value={settings.companyName}
                      onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                      className="w-full bg-slate-50 border border-zinc-200 focus:border-blue-500 rounded px-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Domyślna jednostka zliczeniowa</label>
                    <select
                      value={settings.defaultUnit}
                      onChange={(e) => setSettings({ ...settings, defaultUnit: e.target.value })}
                      className="w-full bg-slate-50 border border-zinc-200 focus:border-blue-500 rounded px-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                    >
                      <option value="szt.">szt. (Sztuka)</option>
                      <option value="kg">kg (Kilogram)</option>
                      <option value="pl">PL (Paleta Euro)</option>
                      <option value="opg.">opg. (Opakowanie zbiorcze)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg flex items-start gap-2.5 text-xs">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block">Uwaga o klastrowaniu:</span>
                    Zmiana kodu identyfikacyjnego magazynu wymusza reindeksację bazy RFID podczas kolejnego nocnego przeliczenia.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'picking' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#2170e4]" />
                    Strategie Zbiórki, Pakowania i Wydań
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Dostosuj zaawansowane algorytmy kolejkowania wydań out-of-doors.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Kolejkowanie asortymentowe (WMS Picking Policy)</label>
                    <span className="text-xs text-slate-400 block mb-2">Decyduje o kolejności zbiórek z półek korytarzy ryglowych na podstawie dat wejść produktów.</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { code: 'FIFO', label: 'FIFO (First In, First Out)', desc: 'Zbiórka produktów z najwcześniejszą datą przyjęcia. Standard logistyczny.' },
                        { code: 'FEFO', label: 'FEFO (First Expired, First Out)', desc: 'Zbiórka produktów o najkrótszym terminie przydatności do spożycia/użycia.' },
                        { code: 'LIFO', label: 'LIFO (Last In, First Out)', desc: 'Zbiórka z ominięciem kolejek, wysyłka ostatnio przyjętych zasobów.' },
                      ].map((policy) => (
                        <div 
                          key={policy.code}
                          onClick={() => setSettings({ ...settings, pickingMethod: policy.code as any })}
                          className={`p-3 rounded-lg border-2 text-xs transition-all cursor-pointer flex flex-col justify-between ${
                            settings.pickingMethod === policy.code 
                              ? 'border-blue-500 bg-blue-550/5 text-blue-900' 
                              : 'border-slate-200 hover:border-slate-350 text-slate-600 bg-slate-50'
                          }`}
                        >
                          <div>
                            <span className="font-black text-xs block">{policy.label}</span>
                            <span className="text-[10px] text-slate-500 tracking-normal block mt-1 leading-normal">{policy.desc}</span>
                          </div>
                          <span className="text-[10px] font-black tracking-widest mt-3 uppercase text-right">
                            {settings.pickingMethod === policy.code ? '● AKTYWNE' : 'WYBIERZ'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 my-4"></div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-700 block">Opcje Operatora Terminala</label>
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 text-xs block">Automatyczny przydział operatorów (Auto-allocation)</span>
                        <span className="text-[11px] text-slate-450 leading-relaxed block">
                          Po wejściu pracownika na terminal dopasuje i zaalokuje mu rundę kompletacyjną automatycznie wg odległości od korytarzy.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.autoAssignStaff}
                        onChange={(e) => setSettings({ ...settings, autoAssignStaff: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 text-xs block">Wymóg skanowania kodu kreskowego (EAN / SKU Verified)</span>
                        <span className="text-[11px] text-slate-455 leading-relaxed block">
                          Zbiórka wymaga fizycznego sczytania kodu E-13 za pomocą skanera terminala. Brak manualnego potweirdzenia.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.barcodeRequired}
                        onChange={(e) => setSettings({ ...settings, barcodeRequired: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#2170e4]" />
                    Sensoryka IoT i Ostrzeżenia Magazynowe
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Ustaw limity progowe dla czujników pojemności i alarmów zapasów.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-slate-800">Próg alarmu niskiego stanu SKU</label>
                      <span className="text-xs font-bold text-red-650 bg-red-100 px-2 py-0.5 rounded font-mono">{settings.lowStockThreshold} %</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="40"
                      step="5"
                      value={settings.lowStockThreshold}
                      onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2170e4]"
                    />
                  </div>

                  <div className="space-y-1.5 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-slate-800">Próg przepełnienia korytarzy ryglowych</label>
                      <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded font-mono">{settings.zoneCapacityAlert} %</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="95"
                      step="5"
                      value={settings.zoneCapacityAlert}
                      onChange={(e) => setSettings({ ...settings, zoneCapacityAlert: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2170e4]"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700">Adres E-mail do wysyłki raportów o statusie BHP i anomalii</label>
                    <input
                      type="email"
                      required
                      value={settings.systemNotificationsEmail}
                      onChange={(e) => setSettings({ ...settings, systemNotificationsEmail: e.target.value })}
                      className="w-full bg-slate-50 border border-zinc-200 focus:border-blue-500 rounded px-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-100 rounded-xl border border-slate-200 md:col-span-2 mt-2">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 text-xs block">Aktywuj telemetrię bramek RFID (Live RFID)</span>
                      <span className="text-[11px] text-slate-500 leading-relaxed block">Nasłuchiwanie WebSocket dla danych z bram rozładunkowych.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enableRfidTelemetry}
                      onChange={(e) => setSettings({ ...settings, enableRfidTelemetry: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div 
                id="settings-courier-api" 
                className={`space-y-5 animate-fadeIn transition-all duration-500 ${
                  highlightedField === 'courier-api' 
                    ? 'bg-amber-50/50 p-4 rounded-xl ring-2 ring-amber-400 shadow-sm' 
                    : ''
                }`}
              >
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                    <Key className="w-4 h-4 text-[#2170e4]" />
                    Integracje Kurierskie i Platformowe API
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Połącz proces pakowania ze zdalnym generowaniem etykiet przewozowych.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Domyślny partner kurierski (Inbound / Outbound API)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { code: 'dhl', label: 'DHL Express', icon: Truck },
                        { code: 'dpd', label: 'DPD Group', icon: Truck },
                        { code: 'inpost', label: 'InPost Paczkomaty', icon: Truck },
                        { code: 'fedex', label: 'FedEx Cargo', icon: Truck },
                      ].map((courier) => (
                        <div
                          key={courier.code}
                          onClick={() => setSettings({ ...settings, selectedCourier: courier.code })}
                          className={`p-3.5 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                            settings.selectedCourier === courier.code
                              ? 'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-500/10'
                              : 'border-slate-200 hover:border-slate-350 text-slate-600 bg-slate-50'
                          }`}
                        >
                          <courier.icon className={`w-6 h-6 ${settings.selectedCourier === courier.code ? 'text-[#2170e4]' : 'text-slate-450'}`} />
                          <span className="font-bold text-xs block">{courier.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 mt-6">
                    <label className="text-xs font-bold text-slate-700">Dostęp cyfrowy: Klucz API Logistics OS</label>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={settings.apiKey}
                        onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                        className="w-full bg-slate-50 border border-zinc-200 focus:border-blue-500 rounded pl-3 pr-10 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 p-1 border-none bg-transparent cursor-pointer"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 my-5"></div>

                  <div className="space-y-3 bg-slate-550/[0.03] rounded-xl p-4 border border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                          <Download className="w-4 h-4 text-blue-600" />
                          Eksport konfiguracji systemu (JSON)
                        </span>
                        <span className="text-[11px] text-slate-500 block leading-relaxed max-w-xl">
                          Generowanie pliku tekstowego zawierającego aktualną konfigurację klastra WMS dla zewnętrznych systemów ERP.
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleCopyConfig}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-750 font-bold text-xs rounded border border-slate-250 cursor-pointer transition-all"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          {copyStatus ? 'Skopiowano!' : 'Kopiuj'}
                        </button>
                        <button
                          type="button"
                          onClick={handleExportConfig}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2170e4] hover:bg-blue-600 text-white font-bold text-xs rounded border-none cursor-pointer transition-all shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Pobierz JSON
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <span className="text-[10px] font-bold text-slate-400 block mb-1 font-mono uppercase tracking-wider">Podgląd pliku JSON</span>
                      <pre className="text-[11px] bg-slate-900 text-emerald-400 p-3 rounded-lg overflow-x-auto max-h-40 font-mono select-all leading-relaxed border border-slate-950 scrollbar-thin">
{JSON.stringify({
  exportedAt: new Date().toISOString(),
  systemIdentifier: 'Logistics-OS-WMS',
  schemaVersion: '1.0.0',
  settings: settings
}, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#2170e4]" />
                    Uwierzytelnianie, Profile i Polityka Bezpieczeństwa
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Dostosuj reguły poziomu haseł administratorów, limity sesji oraz opcje rejestracji personelu.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="p-4 border border-slate-200 rounded-xl space-y-4 bg-slate-50/40">
                    <span className="font-bold text-xs text-slate-900 uppercase tracking-wide block border-b border-slate-100 pb-2">
                      Zasady haseł i autoryzacji
                    </span>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-700">Minimalna długość hasła</label>
                        <span className="text-xs font-bold text-[#2170e4] font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-150">
                          {settings.passwordMinLength || 8} znaków
                        </span>
                      </div>
                      <input
                        type="range"
                        min="6"
                        max="20"
                        step="1"
                        value={settings.passwordMinLength || 8}
                        onChange={(e) => setSettings({ ...settings, passwordMinLength: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2170e4]"
                      />
                    </div>

                    <div className="space-y-2 pt-1 border-t border-slate-100/70">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-700">Maksymalne próby logowania</label>
                        <span className="text-xs font-bold text-[#2170e4] font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-150">
                          {settings.lockoutAttempts || 5} prób
                        </span>
                      </div>
                      <input
                        type="number"
                        min="3"
                        max="10"
                        value={settings.lockoutAttempts || 5}
                        onChange={(e) => setSettings({ ...settings, lockoutAttempts: parseInt(e.target.value) || 5 })}
                        className="w-full bg-slate-50 border border-zinc-200 focus:border-blue-500 rounded px-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white"
                      />
                    </div>

                    <div className="space-y-2 pt-1 border-t border-slate-100/70">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-700">Cykl zmiany hasła (dni)</label>
                        <span className="text-xs font-bold text-[#2170e4] font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-150">
                          {settings.passwordChangeInterval ? `${settings.passwordChangeInterval} dni` : 'Brak wygasania'}
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="365"
                        step="30"
                        value={settings.passwordChangeInterval || 0}
                        onChange={(e) => setSettings({ ...settings, passwordChangeInterval: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-50 border border-zinc-200 focus:border-blue-500 rounded px-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="p-4 border border-slate-200 rounded-xl space-y-4 bg-slate-50/40">
                    <span className="font-bold text-xs text-slate-900 uppercase tracking-wide block border-b border-slate-100 pb-2">
                      Kontrola sesji i autoryzacji
                    </span>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-700">Timeout bezczynności sesji</label>
                        <span className="text-xs font-bold text-[#2170e4] font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-150">
                          {settings.sessionTimeout || 30} min
                        </span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="120"
                        step="5"
                        value={settings.sessionTimeout || 30}
                        onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2170e4]"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg border border-slate-200">
                      <div className="space-y-0.5 pr-2">
                        <span className="font-bold text-slate-900 text-xs block">Dwuetapowa Autoryzacja MFA (2FA)</span>
                        <span className="text-[10px] text-slate-500 leading-normal block">Kod sms dla operatorów Admin i Kierownik.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.requireMfaForAdmins || false}
                        onChange={(e) => setSettings({ ...settings, requireMfaForAdmins: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500 cursor-pointer shrink-0"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg border border-slate-200">
                      <div className="space-y-0.5 pr-2">
                        <span className="font-bold text-slate-900 text-xs block">Samoobsługa terminali pracowników</span>
                        <span className="text-[10px] text-slate-500 leading-normal block">Zatwierdzaj nowych pickerów bezpośrednio na halach.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.allowStaffSelfRegistration || false}
                        onChange={(e) => setSettings({ ...settings, allowStaffSelfRegistration: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500 cursor-pointer shrink-0"
                      />
                    </div>

                    {settings.allowStaffSelfRegistration && (
                      <div className="space-y-1.5 animate-fadeIn">
                        <label className="text-xs font-bold text-slate-700 block">Domyślna rola po rejestracji</label>
                        <select
                          value={settings.defaultUserRole || 'Picker'}
                          onChange={(e) => setSettings({ ...settings, defaultUserRole: e.target.value as any })}
                          className="w-full bg-slate-50 border border-zinc-200 focus:border-blue-500 rounded px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-1"
                        >
                          <option value="Picker">Kompletujący (Picker)</option>
                          <option value="Packer">Pakowacz (Packer)</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50/60 rounded-xl border border-slate-200 p-4 mt-5 space-y-3">
                  <span className="text-xs font-bold text-slate-950 uppercase tracking-wider block font-mono">
                    Struktura Uprawnień Ról w Logistics-OS
                  </span>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-250">
                          <th className="py-2 px-3 font-bold">Rola systemowa</th>
                          <th className="py-2 px-3 font-bold text-center">Interfejs Admina</th>
                          <th className="py-2 px-3 font-bold text-center">Inwentaryzacja</th>
                          <th className="py-2 px-3 font-bold text-center">Kompletacja zamówień</th>
                          <th className="py-2 px-3 font-bold text-center">Modyfikacja klastra / API</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 font-medium text-slate-700 select-all">
                        <tr>
                          <td className="py-2 px-3 font-extrabold text-[#0052CC]">Super Admin</td>
                          <td className="py-2 px-3 text-center"><span className="text-emerald-600 font-black">TAK</span></td>
                          <td className="py-2 px-3 text-center"><span className="text-emerald-600 font-black">TAK</span></td>
                          <td className="py-2 px-3 text-center"><span className="text-emerald-600 font-black">TAK</span></td>
                          <td className="py-2 px-3 text-center"><span className="text-emerald-600 font-black">TAK</span></td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-bold text-[#0052CC]">Administrator</td>
                          <td className="py-2 px-3 text-center"><span className="text-emerald-600 font-black">TAK</span></td>
                          <td className="py-2 px-3 text-center"><span className="text-emerald-600 font-black">TAK</span></td>
                          <td className="py-2 px-3 text-center"><span className="text-emerald-600 font-black">TAK</span></td>
                          <td className="py-2 px-3 text-center"><span className="text-amber-600 font-black">Ograniczony</span></td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-semibold text-slate-800">Kierownik magazynu</td>
                          <td className="py-2 px-3 text-center"><span className="text-emerald-600 font-black">Ograniczony</span></td>
                          <td className="py-2 px-3 text-center"><span className="text-emerald-600 font-black">TAK</span></td>
                          <td className="py-2 px-3 text-center"><span className="text-emerald-600 font-black">TAK</span></td>
                          <td className="py-2 px-3 text-center"><span className="text-rose-500 font-bold">NIE</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}


            <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-bold text-red-650 hover:bg-red-50 bg-transparent border border-red-200 hover:border-red-300 rounded-lg cursor-pointer transition-all"
              >
                Domyślne ustawienia (Fabryczne)
              </button>

              <div className="flex items-center gap-3">
                {saveStatus === 'saved' && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-fadeIn">
                    <Check className="w-4 h-4 text-emerald-500" /> Zapisano pomyślnie!
                  </span>
                )}
                <button
                  type="submit"
                  disabled={saveStatus === 'saving'}
                  className="px-6 py-2 bg-[#2170e4] hover:bg-blue-600 disabled:opacity-70 text-white font-bold text-xs rounded-lg shadow-sm border-none cursor-pointer transition-all tracking-wider uppercase flex items-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saveStatus === 'saving' ? 'Trwa zapis...' : 'Zapisz zmiany'}
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

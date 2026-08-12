import React, { useState } from 'react';
import { 
  ShieldCheck, ShieldAlert, Key, FileSpreadsheet, Lock, Unlock, 
  AlertTriangle, RefreshCw, Plus, Trash2, CheckCircle2, Eye, EyeOff, 
  Download, Activity, Server, FileText, Check, Copy, Ban, Cpu
} from 'lucide-react';

interface SecurityAuditHubProps {
  addToast?: (title: string, text: string, type: 'error' | 'warning' | 'info' | 'success') => void;
  logActivity?: (msg: string, type: string, details?: string) => void;
}

export default function SecurityAuditHub({ addToast, logActivity }: SecurityAuditHubProps) {
  const [activeTab, setActiveTab] = useState<'write_off' | 'api_keys' | 'dlp_guard' | 'encryption'>('write_off');

  // ----------------------------------------------------
  // OPTION 520: Inventory Write-Off State
  // ----------------------------------------------------
  const [writeOffLogs, setWriteOffLogs] = useState([
    { id: 'PROTO-WO-2026-0801', sku: 'SKU-10492', productName: 'Płyn hamulcowy DOT-4', qty: 12, unitCost: 22.50, totalLoss: '270.00 PLN', reason: 'Uszkodzenie podczas rozładunku', date: '2026-08-01', approver: 'Jan Kowalski', status: 'Zatwierdzony' },
    { id: 'PROTO-WO-2026-0805', sku: 'FOOD-KAWA-001', productName: 'Kawa ziarnista Arabica 1kg', qty: 5, unitCost: 45.00, totalLoss: '225.00 PLN', reason: 'Upływ terminu ważności (Przeterminowanie)', date: '2026-08-05', approver: 'Marta Nowak', status: 'Zatwierdzony' },
    { id: 'PROTO-WO-2026-0811', sku: 'SKU-94021', productName: 'Akumulator VoltPro 74Ah', qty: 1, unitCost: 310.00, totalLoss: '310.00 PLN', reason: 'Wada fabryczna (Elektrolit)', date: '2026-08-11', approver: 'Piotr Wiśniewski', status: 'Weryfikacja Księgowa' }
  ]);
  const [newWriteSku, setNewWriteSku] = useState('SKU-20391');
  const [newWriteQty, setNewWriteQty] = useState<number>(2);
  const [newWriteReason, setNewWriteReason] = useState('Uszkodzenie w korytarzu regałowym');

  const handleCreateWriteOff = (e: React.FormEvent) => {
    e.preventDefault();
    const item = {
      id: `PROTO-WO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      sku: newWriteSku,
      productName: newWriteSku === 'SKU-20391' ? 'Reflektor LED H7 SuperVolt' : 'Olej silnikowy Syntetic',
      qty: newWriteQty,
      unitCost: 120.00,
      totalLoss: `${(newWriteQty * 120.00).toFixed(2)} PLN`,
      reason: newWriteReason,
      date: new Date().toISOString().slice(0, 10),
      approver: 'Administrator WMS',
      status: 'Zatwierdzony'
    };
    setWriteOffLogs([item, ...writeOffLogs]);
    if (addToast) addToast('Sporządzono Protokół Odpisu', `Zarejestrowano straty dla ${item.sku} na kwotę ${item.totalLoss}`, 'warning');
    if (logActivity) logActivity(`Sporządzono protokół odpisu strat ${item.id} (${item.sku})`, 'warning');
  };

  // ----------------------------------------------------
  // OPTION 533: API Keys & Webhook Rotator State
  // ----------------------------------------------------
  const [apiKeys, setApiKeys] = useState([
    { id: 'KEY-01', name: 'Integracja Allegro Broker', key: 'wms_live_sec_89f1a7b8c9d0e1f2a3b4', rateLimit: '1000 req/min', scope: 'Pełny Dostęp (Read/Write)', created: '2026-06-01', status: 'Aktywny' },
    { id: 'KEY-02', name: 'ERP Comarch Sync Key', key: 'wms_live_sec_11a22b33c44d55e66f77', rateLimit: '500 req/min', scope: 'Odczyt Zamówień i Zapasów', created: '2026-07-15', status: 'Aktywny' },
    { id: 'KEY-03', name: 'Aplikacja Mobilna Kurierów', key: 'wms_live_sec_99aa88bb77cc66dd55ee', rateLimit: '200 req/min', scope: 'Statusy Dostaw e-POD', created: '2026-08-01', status: 'Wymaga Rotacji' }
  ]);
  const [newKeyName, setNewKeyName] = useState('');

  const handleGenerateApiKey = () => {
    const randomHex = Array.from({ length: 20 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newKey = {
      id: `KEY-${String(apiKeys.length + 1).padStart(2, '0')}`,
      name: newKeyName || 'Nowa Integracja API',
      key: `wms_live_sec_${randomHex}`,
      rateLimit: '500 req/min',
      scope: 'Odczyt Zamówień',
      created: new Date().toISOString().slice(0, 10),
      status: 'Aktywny'
    };
    setApiKeys([newKey, ...apiKeys]);
    setNewKeyName('');
    if (addToast) addToast('Wygenerowano Klucz API', `Stworzono nowy klucz dostępowy dla ${newKey.name}`, 'success');
    if (logActivity) logActivity(`Wygenerowano nowy klucz API ${newKey.id}`, 'info');
  };

  const handleRotateKey = (id: string) => {
    const randomHex = Array.from({ length: 20 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, key: `wms_live_sec_${randomHex}`, status: 'Zrotowany' } : k));
    if (addToast) addToast('Zrotowano Klucz API', 'Wygenerowano nowy bezpieczny token i unieważniono stary.', 'info');
  };

  // ----------------------------------------------------
  // OPTION 535: DLP Data Loss Prevention State
  // ----------------------------------------------------
  const [dlpThreshold, setDlpThreshold] = useState<number>(500);
  const [dlpAlerts, setDlpAlerts] = useState([
    { id: 'DLP-8812', user: 'jan.kowalski@wms.local', action: 'Eksport 1,200 rekordów klientów do CSV', ip: '192.168.1.104', timestamp: 'Dzisiaj 10:45', threatLevel: 'Wysoki Alert', status: 'Zablokowano Eksport' },
    { id: 'DLP-8809', user: 'anon_api_service', action: 'Masowe zapytanie API o 4,500 rekordów RODO', ip: '89.161.42.12', timestamp: 'Wczoraj 23:12', threatLevel: 'Krytyczny Alert', status: 'Zbanowano IP' }
  ]);

  // ----------------------------------------------------
  // OPTION 537: AES-256 Column Encryption & Masking State
  // ----------------------------------------------------
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [encryptedRecords, setEncryptedRecords] = useState([
    { id: 'CUST-001', name: 'Janusz Kowalski', email: 'j.kowalski@firma-example.pl', phone: '+48 601 234 567', address: 'ul. Marszałkowska 14/2, Warszawa', nip: '5260214589' },
    { id: 'CUST-002', name: 'Anna Nowak', email: 'a.nowak@logistyka-test.pl', phone: '+48 502 987 654', address: 'ul. Piotrkowska 88, Łódź', nip: '7250012398' }
  ]);

  const toggleDecryption = () => {
    const nextState = !isDecrypted;
    setIsDecrypted(nextState);
    if (nextState) {
      if (addToast) addToast('Odszyfrowano Dane RODO', 'Dostęp autoryzowany. Zarejestrowano odczyt w dzienniku audytowym.', 'warning');
      if (logActivity) logActivity('Odszyfrowanie danych osobowych RODO (AES-256 Decrypt)', 'warning');
    } else {
      if (addToast) addToast('Zablokowano Wgląd', 'Dane osobowe zostały zaimplementowane pod maskę ochronną.', 'info');
    }
  };

  const maskString = (str: string, type: 'email' | 'phone' | 'address') => {
    if (isDecrypted) return str;
    if (type === 'email') {
      const [name, domain] = str.split('@');
      return `${name[0]}***@${domain}`;
    }
    if (type === 'phone') {
      return `${str.slice(0, 7)} *** ***`;
    }
    return `${str.slice(0, 6)} ******************`;
  };

  return (
    <div className="space-y-6 font-sans antialiased text-zinc-900 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#180909] via-[#2c0e0e] to-[#451414] text-white p-6 rounded-2xl shadow-md border border-red-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            <h1 className="text-xl font-black uppercase tracking-wider font-display">
              Security, DLP & Loss Prevention Engine (Opcje 520, 533, 535, 537)
            </h1>
          </div>
          <p className="text-xs text-red-200 mt-1 max-w-3xl leading-relaxed">
            Zarządzaj protokołami strat i odpisów magazynowych, rotacją kluczy API, ochroną przed wyciekiem danych (DLP) oraz kryptograficznym szyfrowaniem AES-256 danych RODO.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-red-400" />
            AES-256 & DLP Active
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('write_off')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border ${
            activeTab === 'write_off'
              ? 'bg-red-700 text-white border-red-700 shadow-sm'
              : 'bg-white text-zinc-600 hover:bg-zinc-50 border-zinc-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          520. Rejestr Strat & Odpisów SKU
        </button>

        <button
          onClick={() => setActiveTab('api_keys')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border ${
            activeTab === 'api_keys'
              ? 'bg-red-700 text-white border-red-700 shadow-sm'
              : 'bg-white text-zinc-600 hover:bg-zinc-50 border-zinc-200'
          }`}
        >
          <Key className="w-4 h-4" />
          533. Rotator Kluczy API & Webhook
        </button>

        <button
          onClick={() => setActiveTab('dlp_guard')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border ${
            activeTab === 'dlp_guard'
              ? 'bg-red-700 text-white border-red-700 shadow-sm'
              : 'bg-white text-zinc-600 hover:bg-zinc-50 border-zinc-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          535. Detekcja Wycieków DLP
        </button>

        <button
          onClick={() => setActiveTab('encryption')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border ${
            activeTab === 'encryption'
              ? 'bg-red-700 text-white border-red-700 shadow-sm'
              : 'bg-white text-zinc-600 hover:bg-zinc-50 border-zinc-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          537. Szyfrowanie RODO (AES-256)
        </button>
      </div>

      {/* TAB 1: OPTION 520 - INVENTORY WRITE-OFF LOG */}
      {activeTab === 'write_off' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900 font-display flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-red-600" />
                  Ewidencja Odpisów Księgowych i Strat Magazynowych (Option 520 Write-Off Log)
                </h3>
                <p className="text-xs text-zinc-500 font-sans mt-0.5">Rejestr towarów uszkodzonych, przeterminowanych oraz braków zbożowych z wyceną wartości ubytku.</p>
              </div>
            </div>

            <table className="w-full text-xs text-left border-collapse border border-zinc-200">
              <thead>
                <tr className="bg-zinc-100 font-bold font-mono text-zinc-700 uppercase border-b border-zinc-200">
                  <th className="p-2.5 border-r border-zinc-200">Nr Protokołu</th>
                  <th className="p-2.5 border-r border-zinc-200">Produkt / SKU</th>
                  <th className="p-2.5 border-r border-zinc-200 text-center">Ilość</th>
                  <th className="p-2.5 border-r border-zinc-200 font-mono text-right">Strata Razem</th>
                  <th className="p-2.5 border-r border-zinc-200">Przyczyna Odpisu</th>
                  <th className="p-2.5 text-center">Status Protokołu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 font-medium">
                {writeOffLogs.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50">
                    <td className="p-2.5 font-mono font-bold text-red-700 border-r border-zinc-200">{item.id}</td>
                    <td className="p-2.5 border-r border-zinc-200 font-bold text-zinc-900">
                      <div>{item.productName}</div>
                      <div className="text-[10px] font-mono text-zinc-500">{item.sku}</div>
                    </td>
                    <td className="p-2.5 border-r border-zinc-200 text-center font-mono font-bold">{item.qty} szt.</td>
                    <td className="p-2.5 border-r border-zinc-200 text-right font-mono font-bold text-red-700">{item.totalLoss}</td>
                    <td className="p-2.5 border-r border-zinc-200 text-zinc-700">{item.reason}</td>
                    <td className="p-2.5 text-center">
                      <span className="bg-red-100 text-red-800 border border-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-900 font-mono flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-red-600" />
              Sporządź Nowy Protokół Odpisu
            </h3>
            <form onSubmit={handleCreateWriteOff} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Wybierz SKU Produktu:</label>
                <select
                  value={newWriteSku}
                  onChange={(e) => setNewWriteSku(e.target.value)}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs bg-zinc-50 font-mono"
                >
                  <option value="SKU-20391">SKU-20391 - Reflektor LED H7</option>
                  <option value="SKU-50493">SKU-50493 - Olej silnikowy Syntetic</option>
                  <option value="SKU-73012">SKU-73012 - Klocki hamulcowe Carbon</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Ilość uszkodzona (szt.):</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newWriteQty}
                  onChange={(e) => setNewWriteQty(Number(e.target.value))}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-mono bg-zinc-50"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Powód odpisu księgowego:</label>
                <textarea
                  rows={2}
                  value={newWriteReason}
                  onChange={(e) => setNewWriteReason(e.target.value)}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs bg-zinc-50"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg text-xs cursor-pointer shadow transition-all uppercase tracking-wider"
              >
                Wygeneruj Protokół Odpisu
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: OPTION 533 - API KEYS & WEBHOOK ROTATOR */}
      {activeTab === 'api_keys' && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900 font-display flex items-center gap-2">
                <Key className="w-4 h-4 text-red-600" />
                Menedżer Kluczy API i Rotacji Webhooków (Option 533 API Rotator)
              </h3>
              <p className="text-xs text-zinc-500 font-sans mt-0.5">Zarządzanie tokenami bezpieczeństwa REST API oraz limitami zapytań (Rate Limiting).</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nazwa nowej integracji..."
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="px-3 py-1.5 border border-zinc-300 rounded-lg text-xs bg-zinc-50"
              />
              <button
                onClick={handleGenerateApiKey}
                className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white font-bold text-xs rounded-lg shadow cursor-pointer transition-all flex items-center gap-1.5 border-none"
              >
                <Plus className="w-3.5 h-3.5" />
                Generuj Token API
              </button>
            </div>
          </div>

          <table className="w-full text-xs text-left border-collapse border border-zinc-200">
            <thead>
              <tr className="bg-zinc-100 font-bold font-mono text-zinc-700 uppercase border-b border-zinc-200">
                <th className="p-2.5 border-r border-zinc-200">Nazwa Integracji</th>
                <th className="p-2.5 border-r border-zinc-200">Klucz Bezpieczeństwa API</th>
                <th className="p-2.5 border-r border-zinc-200 text-center">Limit Zapytań</th>
                <th className="p-2.5 border-r border-zinc-200">Uprawnienia Scope</th>
                <th className="p-2.5 text-center">Rotacja Tokena</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 font-medium">
              {apiKeys.map((k) => (
                <tr key={k.id} className="hover:bg-zinc-50">
                  <td className="p-2.5 font-bold text-zinc-900 border-r border-zinc-200">{k.name}</td>
                  <td className="p-2.5 border-r border-zinc-200 font-mono text-red-700 font-bold">{k.key}</td>
                  <td className="p-2.5 border-r border-zinc-200 text-center font-mono">{k.rateLimit}</td>
                  <td className="p-2.5 border-r border-zinc-200 font-mono text-zinc-700">{k.scope}</td>
                  <td className="p-2.5 text-center">
                    <button
                      onClick={() => handleRotateKey(k.id)}
                      className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[11px] rounded cursor-pointer shadow transition-all flex items-center gap-1 mx-auto border-none"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Zrotuj Klucz
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: OPTION 535 - DLP DATA LOSS PREVENTION */}
      {activeTab === 'dlp_guard' && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900 font-display flex items-center gap-2">
                <Activity className="w-4 h-4 text-red-600" />
                System Detekcji Wycieku Danych i Pobierania Masowego (Option 535 DLP Guard)
              </h3>
              <p className="text-xs text-zinc-500 font-sans mt-0.5">Automatyczne monitorowanie eksportów danych osobowych i natychmiastowe blokowanie ataków wyciekowych.</p>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-zinc-600 font-bold">Próg Alertowy:</span>
              <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-lg border border-red-200 font-bold">{dlpThreshold} wierszy / eksport</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-700 font-mono">Dziennik Alertów Zabezpieczeń DLP:</h4>
            <div className="space-y-2">
              {dlpAlerts.map((alert) => (
                <div key={alert.id} className="p-4 border border-red-200 bg-red-50/50 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-red-800 text-xs">{alert.id}</span>
                      <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">{alert.threatLevel}</span>
                      <span className="text-xs text-zinc-500 font-mono">{alert.timestamp}</span>
                    </div>
                    <p className="text-xs font-bold text-zinc-900 mt-1">{alert.action}</p>
                    <p className="text-[11px] text-zinc-600 font-mono">Użytkownik: {alert.user} | IP: {alert.ip}</p>
                  </div>
                  <span className="bg-red-800 text-white text-xs font-mono font-bold px-3 py-1 rounded-lg shadow-xs">
                    {alert.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: OPTION 537 - AES-256 COLUMN ENCRYPTION */}
      {activeTab === 'encryption' && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900 font-display flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-600" />
                Szyfrowanie i Maskowanie Danych Osobowych RODO (Option 537 AES-256 Encryption)
              </h3>
              <p className="text-xs text-zinc-500 font-sans mt-0.5">Szyfrowanie kolumnowe bazy danych z natychmiastowym maskowaniem wrażliwych danych kontaktowych.</p>
            </div>
            <button
              onClick={toggleDecryption}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border shadow-sm ${
                isDecrypted
                  ? 'bg-amber-600 text-white border-amber-700'
                  : 'bg-red-700 text-white border-red-700'
              }`}
            >
              {isDecrypted ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {isDecrypted ? 'Zablokuj & Zamaskuj RODO' : 'Odszyfruj Dane (Admin Auth)'}
            </button>
          </div>

          <table className="w-full text-xs text-left border-collapse border border-zinc-200 font-sans">
            <thead>
              <tr className="bg-zinc-100 font-bold font-mono text-zinc-700 uppercase border-b border-zinc-200">
                <th className="p-2.5 border-r border-zinc-200">ID Klienta</th>
                <th className="p-2.5 border-r border-zinc-200">Imię i Nazwisko / Firma</th>
                <th className="p-2.5 border-r border-zinc-200 font-mono">E-mail (AES-256)</th>
                <th className="p-2.5 border-r border-zinc-200 font-mono">Telefon Kontaktowy</th>
                <th className="p-2.5 border-r border-zinc-200">Adres Dostawy</th>
                <th className="p-2.5 text-center">Stan Szyfrowania</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 font-medium">
              {encryptedRecords.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-50">
                  <td className="p-2.5 font-mono font-bold text-zinc-700 border-r border-zinc-200">{r.id}</td>
                  <td className="p-2.5 border-r border-zinc-200 font-bold text-zinc-900">{r.name}</td>
                  <td className="p-2.5 border-r border-zinc-200 font-mono font-bold text-red-700">
                    {maskString(r.email, 'email')}
                  </td>
                  <td className="p-2.5 border-r border-zinc-200 font-mono">{maskString(r.phone, 'phone')}</td>
                  <td className="p-2.5 border-r border-zinc-200 text-zinc-700">{maskString(r.address, 'address')}</td>
                  <td className="p-2.5 text-center font-mono">
                    {isDecrypted ? (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Unlock className="w-3 h-3" /> Odszyfrowane
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Lock className="w-3 h-3" /> AES-256 Zabezpieczone
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

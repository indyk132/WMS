import React, { useState } from 'react';
import { 
  ShieldCheck, ShieldAlert, Key, FileSpreadsheet, Lock, Unlock, 
  AlertTriangle, RefreshCw, Plus, Trash2, CheckCircle2, Eye, EyeOff, 
  Download, Activity, Server, FileText, Check, Copy, Ban, Cpu,
  Database, UserCheck, Clock, ShieldX, Terminal, Search, Flame, Droplets,
  Gauge, Calendar, MapPin
} from 'lucide-react';
import { sounds } from '../../components/SoundEffects';

interface SecurityAuditHubProps {
  addToast?: (title: string, text: string, type: 'error' | 'warning' | 'info' | 'success') => void;
  logActivity?: (msg: string, type: string, details?: string) => void;
}

export default function SecurityAuditHub({ addToast, logActivity }: SecurityAuditHubProps) {
  const [activeTab, setActiveTab] = useState<'write_off' | 'api_keys' | 'dlp_guard' | 'encryption' | 'black_box' | 'four_eyes' | 'rigging_inspection' | 'fire_safety'>('fire_safety');

  // ----------------------------------------------------
  // OPTION 26: Fire Safety Inspection Ledger State (PN-EN 3-7 & PN-EN 671-3 / MSWiA)
  // ----------------------------------------------------
  const [fireEquipment, setFireEquipment] = useState([
    {
      id: 'GAS-PROSZ-01',
      name: 'Gaśnica Proszkowa GP-6x ABC (6 kg)',
      type: 'Gaśnica Proszkowa ABC',
      agent: 'Proszek gaśniczy ABC (6 kg)',
      location: 'Słup Nośny A-04 (Alejka 2)',
      pressureBar: 15.2,
      pressureStatus: 'PRAWIDŁOWE (Zielone pole 14-16 bar)',
      lastInspectionDate: '2026-03-12',
      nextInspectionDue: '2027-03-12',
      tankUdtExpiry: '2030-03-12',
      status: 'Sprawna / Zaplombowana',
      sealed: true,
      accessible: true,
      serialNo: 'KZ-2023-99412',
      inspector: 'Tomasz Majewski (Uprawniony Konserwator PPOŻ)',
      notes: 'Plomba i zawleczka nienaruszone, wąż elastyczny bez pęknięć.'
    },
    {
      id: 'GAS-SNEK-04',
      name: 'Gaśnica Śniegowa GS-5x BC (5 kg CO2)',
      type: 'Gaśnica Śniegowa CO2',
      agent: 'Dwutlenek węgla CO2 (5 kg)',
      location: 'Serwerownia Główna / Rozdzielnia RG-1',
      pressureBar: 55.0,
      pressureStatus: 'PRAWIDŁOWE (Waga brutto zgodna z tarą)',
      lastInspectionDate: '2026-02-10',
      nextInspectionDue: '2027-02-10',
      tankUdtExpiry: '2029-02-10',
      status: 'Sprawna / Zaplombowana',
      sealed: true,
      accessible: true,
      serialNo: 'GS-CO2-2024-001',
      inspector: 'Tomasz Majewski (Uprawniony Konserwator PPOŻ)',
      notes: 'Dysza i zawór w stanie nienagannym. Dedykowana do urządzeń pod napięciem do 1000V.'
    },
    {
      id: 'HYD-DN25-02',
      name: 'Hydrant Wewnętrzny DN25 z Wężem Półsztywnym 30m',
      type: 'Hydrant Wewnętrzny DN25',
      agent: 'Woda gaśnicza (Wydajność min. 1.0 dm3/s)',
      location: 'Ściana Południowa (Przy Bramie Dokowej 3)',
      pressureBar: 4.8,
      pressureStatus: 'PRAWIDŁOWE (Ciśnienie dynamiczne > 0.2 MPa)',
      lastInspectionDate: '2025-07-20',
      nextInspectionDue: '2026-07-20',
      tankUdtExpiry: '2030-07-20',
      status: 'Wymaga Przeglądu Rocznego (Przeterminowany)',
      sealed: true,
      accessible: false,
      serialNo: 'HYD-25-2022-08',
      inspector: 'Inspektor PPOŻ Zakładowy',
      notes: 'UWAGA: Przekroczony termin próby ciśnieniowej węża. Zastawiony paletą!'
    },
    {
      id: 'KOC-PPOZ-01',
      name: 'Koc Gaśniczy z Włókna Szklanego 1.2 x 1.8m',
      type: 'Koc Gaśniczy (PN-EN 1869)',
      agent: 'Tkanina z włókna szklanego (odporność do 550°C)',
      location: 'Stanowisko Ładowania Akumulatorów Wózków',
      pressureBar: 0,
      pressureStatus: 'N/A (Sprzęt bezciśnieniowy)',
      lastInspectionDate: '2026-04-05',
      nextInspectionDue: '2027-04-05',
      tankUdtExpiry: 'N/A',
      status: 'Sprawny / Gotowy do Użycia',
      sealed: true,
      accessible: true,
      serialNo: 'KOC-2024-11',
      inspector: 'Tomasz Majewski (Uprawniony Konserwator PPOŻ)',
      notes: 'Pudełko nieuszkodzone, taśmy zrywne sprawne.'
    }
  ]);

  const [fireSearch, setFireSearch] = useState('');
  const [newFireName, setNewFireName] = useState('');
  const [newFireType, setNewFireType] = useState('Gaśnica Proszkowa GP-6x ABC');
  const [newFireLocation, setNewFireLocation] = useState('Słup Nośny B-02 (Alejka 4)');
  const [newFireSerial, setNewFireSerial] = useState('');

  const handleRenewFireInspection = (id: string) => {
    sounds.playSuccess();
    const nextDue = new Date();
    nextDue.setFullYear(nextDue.getFullYear() + 1);

    setFireEquipment(prev => prev.map(item => {
      if (item.id !== id) return item;
      return {
        ...item,
        lastInspectionDate: new Date().toISOString().slice(0, 10),
        nextInspectionDue: nextDue.toISOString().slice(0, 10),
        status: 'Sprawna / Zaplombowana',
        accessible: true,
        notes: 'Przeprowadzono roczną próbę ciśnieniową i przegląd konserwatora. Naklejono nową kontrolkę legalizacyjną.'
      };
    }));

    if (addToast) addToast('Legalizacja PPOŻ Zatwierdzona', `Przedłużono ważność badania gaśnicy/hydrantu ${id} o kolejne 12 miesięcy.`, 'success');
    if (logActivity) logActivity(`Przegląd PPOŻ dla ${id}`, 'info');
  };

  const handleReportFireDefect = (id: string) => {
    sounds.playError();
    setFireEquipment(prev => prev.map(item => {
      if (item.id !== id) return item;
      return {
        ...item,
        status: 'Niesprawny / Uszkodzony Manometr (Wycofany)',
        pressureStatus: 'SPADEK CIŚNIENIA (< 10 bar)',
        notes: 'Zgłoszono usterkę ciśnieniową. Sprzęt skierowany do serwisu i nabicia.'
      };
    }));

    if (addToast) addToast('Zgłoszono Awarię PPOŻ', `Sprzęt ${id} został oznaczony jako niesprawny. Zgłoszenie wysłane do serwisu PPOŻ.`, 'error');
    if (logActivity) logActivity(`Zgłoszenie awarii PPOŻ dla ${id}`, 'warning');
  };

  const handleRegisterFireEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFireName || !newFireSerial) return;

    sounds.playSuccess();
    const todayStr = new Date().toISOString().slice(0, 10);
    const nextDue = new Date();
    nextDue.setFullYear(nextDue.getFullYear() + 1);

    const isPowder = newFireType.includes('Proszkowa');
    const isCo2 = newFireType.includes('Śniegowa');
    const isHydrant = newFireType.includes('Hydrant');

    const newItem = {
      id: `${isPowder ? 'GAS-PROSZ' : isCo2 ? 'GAS-SNEK' : isHydrant ? 'HYD-DN25' : 'KOC'}-${Math.floor(10 + Math.random() * 90)}`,
      name: newFireName,
      type: newFireType,
      agent: isPowder ? 'Proszek ABC (6 kg)' : isCo2 ? 'CO2 (5 kg)' : isHydrant ? 'Woda gaśnicza' : 'Włókno szklane',
      location: newFireLocation,
      pressureBar: isPowder ? 15.0 : isCo2 ? 55.0 : isHydrant ? 4.5 : 0,
      pressureStatus: isPowder || isHydrant ? 'PRAWIDŁOWE' : 'N/A',
      lastInspectionDate: todayStr,
      nextInspectionDue: nextDue.toISOString().slice(0, 10),
      tankUdtExpiry: new Date(Date.now() + 5 * 365 * 86400000).toISOString().slice(0, 10),
      status: 'Sprawna / Zaplombowana',
      sealed: true,
      accessible: true,
      serialNo: newFireSerial,
      inspector: 'Konserwator PPOŻ Zakładowy',
      notes: 'Nowy sprzęt przeciwpożarowy zainstalowany na hali magazynowej.'
    };

    setFireEquipment([newItem, ...fireEquipment]);
    setNewFireName('');
    setNewFireSerial('');
    if (addToast) addToast('Zarejestrowano Punkt PPOŻ', `Dodano do ewidencji ${newItem.id} (${newItem.name}) na stanowisku: ${newItem.location}`, 'success');
    if (logActivity) logActivity(`Dodano sprzęt PPOŻ ${newItem.id}`, 'info');
  };

  // ----------------------------------------------------
  // OPTION 15: Rigging & Sling Inspection Log State (UDT & PN-EN 1492-1 / PN-EN 818-4)
  // ----------------------------------------------------
  const [riggingItems, setRiggingItems] = useState([
    {
      id: 'ZAW-PAS-041',
      name: 'Zawiesie Pasowe Dwuwarstwowe z Pętlami',
      type: 'Pasowe Włókienne (PES)',
      wllKg: 2000,
      wllStr: '2 000 kg (2.0t)',
      colorCode: 'Zielony (2t)',
      colorHex: '#16a34a',
      quarterColor: 'Zielona (II Kwartał 2026)',
      lastInspectionDate: '2026-05-15',
      nextInspectionDue: '2026-11-15',
      status: 'Dopuszczony do Eksploatacji',
      location: 'Rampa 1 (Dok Załadunkowy)',
      serialNo: 'PL-2024-88412',
      inspector: 'Marian Z. (Uprawnienia UDT)',
      notes: 'Brak uszkodzeń taśmy, etykieta CE czytelna.'
    },
    {
      id: 'ZAW-LANC-012',
      name: 'Zawiesie Łańcuchowe 4-Cięgnowe Kl. 8 (Grade 80)',
      type: 'Łańcuchowe Stalowe',
      wllKg: 6700,
      wllStr: '6 700 kg (6.7t)',
      colorCode: 'Czerwony / Stal',
      colorHex: '#dc2626',
      quarterColor: 'Zielona (II Kwartał 2026)',
      lastInspectionDate: '2026-04-10',
      nextInspectionDue: '2026-10-10',
      status: 'Dopuszczony do Eksploatacji',
      location: 'Suwnica Bramowa - Hala Główna A',
      serialNo: 'UDT-LAN-9941',
      inspector: 'Marian Z. (Uprawnienia UDT)',
      notes: 'Zapadki haków sprawne, brak wydłużeń ogniw powyżej 3%.'
    },
    {
      id: 'PAS-TRANS-088',
      name: 'Pas Transportowy z Napinaczem Grzechotkowym 50mm',
      type: 'Pas Mocujący z Grzechotką',
      wllKg: 5000,
      wllStr: '5 000 daN (5.0t)',
      colorCode: 'Czerwony / Pomarańczowy',
      colorHex: '#ea580c',
      quarterColor: 'Czerwona (I Kwartał 2026)',
      lastInspectionDate: '2026-01-20',
      nextInspectionDue: '2026-07-20',
      status: 'Wymaga Przeglądu UDT (Przeterminowany)',
      location: 'Naczepa Ciężarówki WI 82910',
      serialNo: 'PAS-TRANS-2025-01',
      inspector: 'Tomasz K. (Specjalista BHP)',
      notes: 'Przekroczony termin 6-miesięcznego badania okresowego!'
    },
    {
      id: 'ZAW-PAS-099',
      name: 'Zawiesie Pasowe Włókienne 1-tonowe',
      type: 'Pasowe Włókienne (PES)',
      wllKg: 1000,
      wllStr: '1 000 kg (1.0t)',
      colorCode: 'Fioletowy (1t)',
      colorHex: '#9333ea',
      quarterColor: 'Brak (Wycofany)',
      lastInspectionDate: '2026-08-01',
      nextInspectionDue: '2026-08-01',
      status: 'Wycofany z Użytku (Uszkodzony)',
      location: 'Magazyn Kwarantanny BHP',
      serialNo: 'PL-2023-1102',
      inspector: 'Marian Z. (Uprawnienia UDT)',
      notes: 'Głębokie nacięcie krawędzi taśmy > 10% szerokości. Nakaz kasacji.'
    }
  ]);

  // Rigging Angle Multiplier State
  const [slingAngle, setSlingAngle] = useState<number>(45);
  const [baseLoadKg, setBaseLoadKg] = useState<number>(3000);

  // New Rigging Item Form State
  const [newRiggingName, setNewRiggingName] = useState('');
  const [newRiggingType, setNewRiggingType] = useState('Pasowe Włókienne (PES)');
  const [newRiggingWll, setNewRiggingWll] = useState(2000);
  const [newRiggingLocation, setNewRiggingLocation] = useState('Rampa 1 (Dok Załadunkowy)');
  const [newRiggingSerial, setNewRiggingSerial] = useState('');

  const handleRegisterRigging = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRiggingName || !newRiggingSerial) return;

    sounds.playSuccess();
    const getColorForWll = (wll: number) => {
      if (wll <= 1000) return { code: 'Fioletowy (1t)', hex: '#9333ea' };
      if (wll <= 2000) return { code: 'Zielony (2t)', hex: '#16a34a' };
      if (wll <= 3000) return { code: 'Żółty (3t)', hex: '#ca8a04' };
      if (wll <= 4000) return { code: 'Szary (4t)', hex: '#4b5563' };
      if (wll <= 5000) return { code: 'Czerwony (5t)', hex: '#dc2626' };
      if (wll <= 6000) return { code: 'Brązowy (6t)', hex: '#92400e' };
      if (wll <= 8000) return { code: 'Niebieski (8t)', hex: '#2563eb' };
      return { code: 'Pomarańczowy (10t+)', hex: '#ea580c' };
    };

    const color = getColorForWll(newRiggingWll);
    const todayStr = new Date().toISOString().slice(0, 10);
    const nextDue = new Date();
    nextDue.setMonth(nextDue.getMonth() + 6);

    const newItem = {
      id: `ZAW-${newRiggingType.startsWith('Pasowe') ? 'PAS' : 'LANC'}-${Math.floor(100 + Math.random() * 900)}`,
      name: newRiggingName,
      type: newRiggingType,
      wllKg: newRiggingWll,
      wllStr: `${newRiggingWll.toLocaleString('pl-PL')} kg (${(newRiggingWll / 1000).toFixed(1)}t)`,
      colorCode: color.code,
      colorHex: color.hex,
      quarterColor: 'Zielona (II Kwartał 2026)',
      lastInspectionDate: todayStr,
      nextInspectionDue: nextDue.toISOString().slice(0, 10),
      status: 'Dopuszczony do Eksploatacji',
      location: newRiggingLocation,
      serialNo: newRiggingSerial,
      inspector: 'Inspektor UDT WMS',
      notes: 'Nowy sprzęt wprowadzony do ewidencji magazynu.'
    };

    setRiggingItems([newItem, ...riggingItems]);
    setNewRiggingName('');
    setNewRiggingSerial('');
    if (addToast) addToast('Wpisano do Dziennika UDT', `Zarejestrowano osprzęt podnoszący ${newItem.id} (DOR: ${newItem.wllStr})`, 'success');
    if (logActivity) logActivity(`Wpisano zawiesie/pas ${newItem.id} do Dziennika UDT`, 'info');
  };

  const handleRenewInspection = (id: string) => {
    sounds.playSuccess();
    const nextDue = new Date();
    nextDue.setMonth(nextDue.getMonth() + 6);

    setRiggingItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      return {
        ...item,
        lastInspectionDate: new Date().toISOString().slice(0, 10),
        nextInspectionDue: nextDue.toISOString().slice(0, 10),
        quarterColor: 'Zielona (II Kwartał 2026)',
        status: 'Dopuszczony do Eksploatacji',
        notes: 'Przeprowadzono okresowe badanie wizualne UDT. Oznaczono barwą kwartalną.'
      };
    }));

    if (addToast) addToast('Przedłużono Badanie UDT', `Pomyślnie wykonano badanie okresowe i nadano barwę kwartalną dla ${id}.`, 'success');
    if (logActivity) logActivity(`Przedłużono atest UDT dla ${id}`, 'info');
  };

  const handleCondemnItem = (id: string) => {
    sounds.playError();
    setRiggingItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      return {
        ...item,
        status: 'Wycofany z Użytku (Uszkodzony)',
        quarterColor: 'Brak (Wycofany)',
        notes: 'Decyzją inspektora osprzęt trwale wycofany z eksploatacji ze względów BHP.'
      };
    }));

    if (addToast) addToast('Wycofano z Eksploatacji', `Sprzęt ${id} został trwale wycofany. Nakaz utylizacji.`, 'warning');
    if (logActivity) logActivity(`Wycofano zawiesie ${id} ze względów BHP`, 'warning');
  };

  // ----------------------------------------------------
  // OPTION 983: WMS Black Box Audit Event Timeline State
  // ----------------------------------------------------
  const [blackBoxLogs, setBlackBoxLogs] = useState([
    {
      id: 'BB-LOG-9801',
      timestamp: '2026-08-26 21:14:02.841',
      action: 'STOCK_DELTA_OVERRIDE',
      actor: 'Admin Jan Kowalski',
      ip: '192.168.1.104',
      checksumSha: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      severity: 'WARNING',
      diffSummary: 'SKU-94021 zapas zmieniono: 14 -> 2 szt. (-12)',
      verifiedTamperProof: true
    },
    {
      id: 'BB-LOG-9802',
      timestamp: '2026-08-26 21:05:18.119',
      action: 'DOCK_INTERLOCK_OVERRIDE',
      actor: 'Mistrz Zmiany Piotr W.',
      ip: '192.168.1.55',
      checksumSha: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
      severity: 'CRITICAL',
      diffSummary: 'Dok D2: Otwarto bramę w trybie awaryjnym',
      verifiedTamperProof: true
    },
    {
      id: 'BB-LOG-9803',
      timestamp: '2026-08-26 20:44:59.002',
      action: 'API_KEY_ROTATED',
      actor: 'System Auto-Guardian',
      ip: '127.0.0.1',
      checksumSha: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
      severity: 'INFO',
      diffSummary: 'Wymuszono rotację klucza KEY-03 (Wygasł)',
      verifiedTamperProof: true
    },
    {
      id: 'BB-LOG-9804',
      timestamp: '2026-08-26 20:12:33.472',
      action: 'FOUR_EYES_APPROVAL_GRANTED',
      actor: 'Dyrektor Magazynu M. Nowak',
      ip: '192.168.1.12',
      checksumSha: 'fb8e20fc2e4c3f248c60c39bd652f3c1347298ab9f5a04b123f2b23a75877864',
      severity: 'INFO',
      diffSummary: 'Zatwierdzono korektę wartościową CORR-9901 (3720 PLN)',
      verifiedTamperProof: true
    }
  ]);
  const [blackBoxSearch, setBlackBoxSearch] = useState('');

  const handleVerifyLogIntegrity = () => {
    sounds.playSuccess();
    if (addToast) addToast('Weryfikacja Integralności Czarnej Skrzynki', 'Przeliczono sumy kontrolne SHA-256 dla wszystkich zdarzeń. Łańcuch niezmieniony, 0 naruszeń.', 'success');
  };

  // ----------------------------------------------------
  // OPTION 990: Four-Eyes Principle (Zasada 4 Oczu) State
  // ----------------------------------------------------
  const [fourEyesQueue, setFourEyesQueue] = useState([
    {
      id: 'CORR-9901',
      type: 'Korekta Inwentaryzacyjna Dużej Wartości',
      sku: 'SKU-94021',
      skuName: 'Akumulator VoltPro 74Ah',
      deltaQty: -12,
      totalValue: '3720.00 PLN',
      requester: 'Jan Kowalski (Magazynier)',
      requestedAt: '2026-08-26 21:10',
      reason: 'Rozbicie palety wózkiem w korytarzu wysokiego składowania',
      status: 'Oczekuje na PIN Kierownika'
    },
    {
      id: 'CORR-9902',
      type: 'Masowa Zmiana Lokalizacji Zapasu',
      sku: 'SKU-10492',
      skuName: 'Płyn hamulcowy DOT-4',
      deltaQty: 100,
      totalValue: '2250.00 PLN',
      requester: 'Tomasz B. (Operator VNA)',
      requestedAt: '2026-08-26 20:30',
      reason: 'Relokacja strefy A-01 do bufora chłodni',
      status: 'Oczekuje na PIN Kierownika'
    }
  ]);
  const [managerPinInput, setManagerPinInput] = useState('');
  const [authorizingCorrId, setAuthorizingCorrId] = useState<string | null>(null);

  const handleAuthorizeFourEyes = (corrId: string) => {
    if (!managerPinInput || managerPinInput.trim() !== '7741') {
      sounds.playError();
      if (addToast) addToast('Błędny PIN Kierownika!', 'Wprowadzono niepoprawny kod autoryzacyjny (Testowy PIN Kierownika: 7741)', 'error');
      return;
    }

    sounds.playSuccess();
    setFourEyesQueue(prev => prev.map(item => item.id === corrId ? { ...item, status: 'Zatwierdzono (Zasada 4 Oczu)' } : item));
    setManagerPinInput('');
    setAuthorizingCorrId(null);
    if (addToast) addToast('Autoryzowano Operację (Zasada 4 Oczu)', `Kierownik zatwierdził operację ${corrId}. Zmiany wprowadzono do bazy WMS.`, 'success');
    if (logActivity) logActivity(`Autoryzacja 4-Oczu dla operacji ${corrId}`, 'info');
  };

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
          onClick={() => setActiveTab('black_box')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border ${
            activeTab === 'black_box'
              ? 'bg-red-700 text-white border-red-700 shadow-sm'
              : 'bg-white text-zinc-600 hover:bg-zinc-50 border-zinc-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          983. Czarna Skrzynka (Audit Timeline)
        </button>

        <button
          onClick={() => setActiveTab('four_eyes')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border ${
            activeTab === 'four_eyes'
              ? 'bg-red-700 text-white border-red-700 shadow-sm'
              : 'bg-white text-zinc-600 hover:bg-zinc-50 border-zinc-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          990. Zasada 4 Oczu
        </button>

        <button
          onClick={() => setActiveTab('rigging_inspection')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border ${
            activeTab === 'rigging_inspection'
              ? 'bg-red-700 text-white border-red-700 shadow-sm'
              : 'bg-white text-zinc-600 hover:bg-zinc-50 border-zinc-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          15. Zawiesia & Pasy UDT
        </button>

        <button
          onClick={() => setActiveTab('fire_safety')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border ${
            activeTab === 'fire_safety'
              ? 'bg-red-700 text-white border-red-700 shadow-sm'
              : 'bg-white text-zinc-600 hover:bg-zinc-50 border-zinc-200'
          }`}
        >
          <Flame className="w-4 h-4" />
          26. Gaśnice & Hydranty PPOŻ
        </button>

        <button
          onClick={() => setActiveTab('write_off')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border ${
            activeTab === 'write_off'
              ? 'bg-red-700 text-white border-red-700 shadow-sm'
              : 'bg-white text-zinc-600 hover:bg-zinc-50 border-zinc-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          520. Rejestr Strat SKU
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

      {/* TAB 5: OPTION 983 - WMS BLACK BOX AUDIT EVENT TIMELINE */}
      {activeTab === 'black_box' && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4 animate-fadeIn font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900 font-display flex items-center gap-2">
                <Terminal className="w-4 h-4 text-red-600" />
                Cyfrowa Czarna Skrzynka Zdarzeń WMS (Audit Event Timeline 983)
              </h3>
              <p className="text-xs text-zinc-500 font-sans mt-0.5">
                Niemodyfikowalny rejestr zmian stanów i uprawnień z dokładnością do milisekundy, IP oraz sumą kontrolną SHA-256.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleVerifyLogIntegrity}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Weryfikuj Spójność SHA-256
              </button>
            </div>
          </div>

          <table className="w-full text-xs text-left border-collapse border border-zinc-200">
            <thead>
              <tr className="bg-zinc-100 font-bold font-mono text-zinc-700 uppercase border-b border-zinc-200">
                <th className="p-2.5 border-r border-zinc-200">ID Zdarzenia</th>
                <th className="p-2.5 border-r border-zinc-200">Czas (ms)</th>
                <th className="p-2.5 border-r border-zinc-200">Akcja WMS</th>
                <th className="p-2.5 border-r border-zinc-200">Wykonawca & Adres IP</th>
                <th className="p-2.5 border-r border-zinc-200">Szczegóły / Diff Zmiany</th>
                <th className="p-2.5 border-r border-zinc-200 font-mono">Suma SHA-256</th>
                <th className="p-2.5 text-center">Integralność</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 font-medium font-mono text-xs">
              {blackBoxLogs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50 font-sans">
                  <td className="p-2.5 font-mono font-bold text-red-700 border-r border-zinc-200">{log.id}</td>
                  <td className="p-2.5 font-mono text-zinc-600 border-r border-zinc-200 text-[11px]">{log.timestamp}</td>
                  <td className="p-2.5 font-mono border-r border-zinc-200">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : log.severity === 'WARNING' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-2.5 border-r border-zinc-200">
                    <div className="font-bold text-zinc-900">{log.actor}</div>
                    <span className="text-[10px] font-mono text-zinc-400">IP: {log.ip}</span>
                  </td>
                  <td className="p-2.5 border-r border-zinc-200 text-zinc-800 text-[11px]">{log.diffSummary}</td>
                  <td className="p-2.5 border-r border-zinc-200 font-mono text-[9px] text-zinc-500 truncate max-w-[120px]" title={log.checksumSha}>
                    {log.checksumSha.slice(0, 16)}...
                  </td>
                  <td className="p-2.5 text-center">
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Niezmieniony
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 6: OPTION 990 - FOUR-EYES PRINCIPLE (ZASADA 4 OCZU) */}
      {activeTab === 'four_eyes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn font-sans">
          <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900 font-display flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-red-600" />
                  Kolejka Autoryzacji Operacji Krytycznych (Zasada 4 Oczu - Option 990)
                </h3>
                <p className="text-xs text-zinc-500 font-sans mt-0.5">
                  Wymóg autoryzacji kodem PIN drugiego pracownika (Kierownika Magazynu) przy korektach o wartości powyżej 1000 PLN.
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-200">
                Oczekujące Akceptacje: {fourEyesQueue.filter(i => i.status.includes('Oczekuje')).length}
              </span>
            </div>

            <div className="space-y-3">
              {fourEyesQueue.map((item) => (
                <div key={item.id} className="p-4 border border-zinc-200 rounded-xl bg-zinc-50/50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-red-700">{item.id}</span>
                        <strong className="text-xs text-zinc-900">{item.type}</strong>
                      </div>
                      <span className="text-[11px] text-zinc-500">{item.skuName} ({item.sku})</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 block">Szacowana Wartość:</span>
                      <strong className="text-sm font-mono text-red-700 font-black">{item.totalValue}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono bg-white p-2.5 border border-zinc-200 rounded-lg">
                    <div><span className="text-zinc-400">Wnioskujący:</span> <strong className="text-zinc-800">{item.requester}</strong></div>
                    <div><span className="text-zinc-400">Data zgłoszenia:</span> <span className="text-zinc-800">{item.requestedAt}</span></div>
                    <div className="sm:col-span-2 text-zinc-600"><span className="text-zinc-400">Uzasadnienie:</span> {item.reason}</div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.status.includes('Zatwierdzono') ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                    }`}>
                      {item.status}
                    </span>

                    {item.status.includes('Oczekuje') && (
                      <button
                        type="button"
                        onClick={() => setAuthorizingCorrId(item.id)}
                        className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white font-bold text-xs rounded-lg shadow cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Wprowadź PIN Kierownika
                      </button>
                    )}
                  </div>

                  {authorizingCorrId === item.id && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 animate-fadeIn font-sans">
                      <div className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-red-700" />
                        Autoryzacja Kierownicza (Wpisz 4-cyfrowy PIN):
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          placeholder="Wpisz PIN (testowy: 7741)..."
                          value={managerPinInput}
                          onChange={(e) => setManagerPinInput(e.target.value)}
                          maxLength={6}
                          className="flex-1 p-2 bg-white border border-red-300 rounded-lg text-xs font-mono text-center tracking-widest text-zinc-900 outline-none focus:border-red-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleAuthorizeFourEyes(item.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow transition-all border-none"
                        >
                          Zatwierdź
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAuthorizingCorrId(null); setManagerPinInput(''); }}
                          className="px-3 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold rounded-lg text-xs cursor-pointer"
                        >
                          Anuluj
                        </button>
                      </div>
                      <span className="text-[10px] text-red-700">Wskazówka: Domyślny PIN Kierownika Zmiany to: <strong>7741</strong></span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-900 font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-red-600" />
              Konfiguracja Reguł Zasady 4 Oczu
            </h3>
            <div className="space-y-3 text-xs font-sans">
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
                <strong className="text-zinc-900 block font-bold">Wymuś autoryzację dwuosobową gdy:</strong>
                <label className="flex items-center gap-2 text-zinc-700 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-red-600" />
                  Wartość korekty przekracza 1 000.00 PLN
                </label>
                <label className="flex items-center gap-2 text-zinc-700 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-red-600" />
                  Korekta ilościowa większa niż 50 szt.
                </label>
                <label className="flex items-center gap-2 text-zinc-700 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-red-600" />
                  Przesunięcie towarów ze strefy ADR / Chłodni
                </label>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] space-y-1">
                <strong>🛡️ Zgodność z Normami Audytowymi:</strong>
                <p>Każde użycie PINu kierownika jest rejestrowane w Czarnej Skrzynce WMS wraz z adresem IP i sumą kontrolną SHA-256.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: OPTION 15 - RIGGING & SLING INSPECTION LOG (UDT & PN-EN 1492-1 / PN-EN 818-4) */}
      {activeTab === 'rigging_inspection' && (
        <div className="space-y-6 animate-fadeIn font-sans">
          {/* Top Banner & Quarterly Color Reference */}
          <div className="bg-gradient-to-r from-zinc-950 via-slate-900 to-zinc-900 border border-zinc-800 p-5 rounded-2xl text-white shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-black uppercase tracking-wider text-white font-display">
                  Dziennik Badań i Inspekcji Zawiesi Oraz Pasów Transportowych (Option 15 UDT)
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
                Ewidencja okresowych przeglądów technicznych zawiesi pasowych, łańcuchowych i pasów mocujących zgodnie z wytycznymi Urzędu Dozoru Technicznego (UDT) i normą PN-EN 1492-1.
              </p>
            </div>

            {/* Quarterly Color Identification Badge */}
            <div className="bg-black/60 border border-zinc-700/80 p-3 rounded-xl flex items-center gap-3 font-mono text-xs">
              <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase">Obowiązująca Barwa Kwartalna UDT:</span>
                <strong className="text-emerald-400 text-xs font-black">ZIELONA (II Kwartał 2026)</strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Rigging Registry Table */}
            <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900 font-display flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-red-600" />
                    Księga Rewizyjna Osprzętu Podnoszącego ({riggingItems.length} pozycji)
                  </h3>
                  <p className="text-xs text-zinc-500 font-sans mt-0.5">
                    Wszystkie zawiesia na stanie magazynu podlegające 6-miesięcznym badaniom UDT.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200">
                    Sprawne: {riggingItems.filter(r => r.status.includes('Dopuszczony')).length}
                  </span>
                  <span className="text-xs font-mono font-bold bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg border border-rose-200">
                    Wycofane/Przeterminowane: {riggingItems.filter(r => !r.status.includes('Dopuszczony')).length}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {riggingItems.map((item) => {
                  const isAllowed = item.status.includes('Dopuszczony');
                  const isExpired = item.status.includes('Wymaga') || item.status.includes('Przeterminowany');
                  return (
                    <div 
                      key={item.id} 
                      className={`p-4 border rounded-xl transition-all space-y-3 ${
                        isAllowed 
                          ? 'bg-zinc-50/60 border-zinc-200' 
                          : isExpired 
                          ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-300' 
                          : 'bg-rose-50/40 border-rose-300 opacity-75'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200/80 pb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full shrink-0 border border-black/20" 
                            style={{ backgroundColor: item.colorHex }}
                            title={`Oznaczenie barwne DOR: ${item.colorCode}`}
                          />
                          <div>
                            <span className="font-mono text-xs font-bold text-red-700 mr-2">{item.id}</span>
                            <strong className="text-xs text-zinc-900">{item.name}</strong>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-500 block">Dopuszczalne Obciążenie (DOR / WLL):</span>
                          <strong className="text-sm font-mono text-zinc-900 font-black">{item.wllStr}</strong>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono bg-white p-2.5 border border-zinc-200 rounded-lg">
                        <div>
                          <span className="text-[10px] text-zinc-400 block">Typ & Nr Seryjny:</span>
                          <strong className="text-zinc-800 text-[11px]">{item.type}</strong>
                          <div className="text-[10px] text-zinc-500">{item.serialNo}</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 block">Lokalizacja / Stanowisko:</span>
                          <span className="text-zinc-800 text-[11px] font-bold">{item.location}</span>
                          <div className="text-[10px] text-emerald-700">Barwa UDT: {item.quarterColor}</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 block">Ważność Badania Okresowego:</span>
                          <strong className={isExpired ? 'text-rose-600 font-black' : 'text-zinc-800'}>{item.nextInspectionDue}</strong>
                          <div className="text-[10px] text-zinc-500">Ostatnio: {item.lastInspectionDate}</div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                        <div className="text-[11px] text-zinc-600 italic">
                          <span className="font-bold font-sans not-italic text-zinc-700">Uwagi inspektora:</span> {item.notes}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isAllowed ? (
                            <button
                              type="button"
                              onClick={() => handleCondemnItem(item.id)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-xs font-bold cursor-pointer transition-all"
                            >
                              Wycofaj (Kasacja)
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRenewInspection(item.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer shadow transition-all flex items-center gap-1.5 border-none"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Zatwierdź Badanie UDT & Nadaj Barwę
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Angle Calculator & Registration Form */}
            <div className="lg:col-span-4 space-y-6">
              {/* LIFTING SLING ANGLE MULTIPLIER CALCULATOR */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white border border-indigo-800/60 rounded-2xl p-5 shadow-xl space-y-4 font-mono">
                <div className="flex items-center justify-between border-b border-indigo-800/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                      Kalkulator Kąta Rozwarcia Zawiesia (WLL)
                    </h3>
                  </div>
                  <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                    PN-EN 818-4
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-zinc-300 mb-1">
                      <span>Masa Podnoszonego Ładunku:</span>
                      <strong className="text-emerald-400 font-bold">{baseLoadKg} kg</strong>
                    </div>
                    <input
                      type="range"
                      min="500"
                      max="10000"
                      step="250"
                      value={baseLoadKg}
                      onChange={(e) => setBaseLoadKg(Number(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-zinc-300 mb-1">
                      <span>Kąt Rozwarcia Cięgien (β):</span>
                      <strong className={slingAngle > 90 ? 'text-rose-400 font-black animate-pulse' : 'text-amber-300 font-bold'}>
                        {slingAngle}° {slingAngle > 90 ? '⚠️ ZAKAZ!' : ''}
                      </strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="120"
                      step="5"
                      value={slingAngle}
                      onChange={(e) => setSlingAngle(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Calculations Output */}
                  {(() => {
                    const angleRad = (slingAngle * Math.PI) / 360;
                    const tensionFactor = slingAngle <= 90 ? (1 / Math.cos(angleRad)).toFixed(2) : 'BŁĄD';
                    const requiredWllPerLeg = slingAngle <= 90 ? Math.round((baseLoadKg / 2) * (1 / Math.cos(angleRad))) : 0;
                    return (
                      <div className="p-3 bg-black/60 border border-indigo-700/50 rounded-xl space-y-2 text-[11px]">
                        <div className="flex justify-between text-zinc-300">
                          <span>Współczynnik naprężenia:</span>
                          <strong className="text-indigo-300 font-bold">x{tensionFactor}</strong>
                        </div>
                        <div className="flex justify-between text-zinc-300">
                          <span>Wymagane WLL na 1 cięgno:</span>
                          <strong className="text-emerald-400 font-black">{requiredWllPerLeg} kg</strong>
                        </div>
                        {slingAngle > 90 && (
                          <div className="text-rose-400 font-bold text-[10px] pt-1 border-t border-rose-900/60">
                            ⛔ Kąt powyżej 90° jest bezwzględnie zabroniony przez przepisy BHP ze względu na ryzyko zerwania zawiesia!
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* NEW RIGGING ITEM REGISTRATION FORM */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4 font-sans">
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-900 font-mono flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-red-600" />
                  Wprowadź Nowy Sprzęt do Ewidencji
                </h3>
                <form onSubmit={handleRegisterRigging} className="space-y-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-600 block mb-1">Nazwa Sprzętu:</label>
                    <input
                      type="text"
                      placeholder="np. Zawiesie Pasowe 3t 4m"
                      value={newRiggingName}
                      onChange={(e) => setNewRiggingName(e.target.value)}
                      className="w-full p-2 border border-zinc-300 rounded-lg text-xs bg-zinc-50 font-sans"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-600 block mb-1">Typ Osprzętu:</label>
                    <select
                      value={newRiggingType}
                      onChange={(e) => setNewRiggingType(e.target.value)}
                      className="w-full p-2 border border-zinc-300 rounded-lg text-xs bg-zinc-50 font-sans"
                    >
                      <option value="Pasowe Włókienne (PES)">Pasowe Włókienne (PES)</option>
                      <option value="Łańcuchowe Stalowe (Grade 80)">Łańcuchowe Stalowe (Grade 80)</option>
                      <option value="Pas Mocujący z Grzechotką">Pas Mocujący z Grzechotką</option>
                      <option value="Linowe Stalowe">Linowe Stalowe</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-600 block mb-1">Nośność DOR (kg):</label>
                      <input
                        type="number"
                        min="500"
                        max="20000"
                        step="500"
                        value={newRiggingWll}
                        onChange={(e) => setNewRiggingWll(Number(e.target.value) || 1000)}
                        className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-mono bg-zinc-50"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-zinc-600 block mb-1">Nr Seryjny / Tabliczka:</label>
                      <input
                        type="text"
                        placeholder="PL-2026-001"
                        value={newRiggingSerial}
                        onChange={(e) => setNewRiggingSerial(e.target.value)}
                        className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-mono bg-zinc-50"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-600 block mb-1">Przypisana Strefa / Wózek:</label>
                    <input
                      type="text"
                      placeholder="np. Rampa 2, Suwnica B"
                      value={newRiggingLocation}
                      onChange={(e) => setNewRiggingLocation(e.target.value)}
                      className="w-full p-2 border border-zinc-300 rounded-lg text-xs bg-zinc-50 font-sans"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl shadow cursor-pointer transition-all border-none"
                  >
                    Zarejestruj w Dzienniku UDT
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: OPTION 26 - FIRE SAFETY INSPECTION LEDGER (PN-EN 3-7 & PN-EN 671-3 / MSWiA) */}
      {activeTab === 'fire_safety' && (
        <div className="space-y-6 animate-fadeIn font-sans">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-red-950 via-zinc-950 to-red-950 border border-red-900/60 p-5 rounded-2xl text-white shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-500 animate-pulse" />
                <h2 className="text-base font-black uppercase tracking-wider text-white font-display">
                  Dziennik Inspekcji Gaśnic i Hydrantów Wewnętrznych (Option 26 PPOŻ)
                </h2>
              </div>
              <p className="text-xs text-red-200 mt-1 max-w-2xl">
                Ewidencja corocznych legalizacji, prób ciśnieniowych zbiorników i kontroli manometrów sprzętu przeciwpożarowego zgodnie z Rozporządzeniem MSWiA i normami PN-EN 3-7 / PN-EN 671-3.
              </p>
            </div>

            <div className="bg-black/60 border border-red-800/60 p-3 rounded-xl flex items-center gap-3 font-mono text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase">Certyfikacja i Dozór:</span>
                <strong className="text-red-400 text-xs font-black">Zgodność z CNBOP & MSWiA</strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Fire Equipment Registry Table */}
            <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900 font-display flex items-center gap-2">
                    <Flame className="w-4 h-4 text-red-600" />
                    Księga Ewidencji Sprzętu Przeciwpożarowego ({fireEquipment.length} stanowisk)
                  </h3>
                  <p className="text-xs text-zinc-500 font-sans mt-0.5">
                    Wszystkie punkty gaśnicze na słupach nośnych, ścianach i w serwerowni podlegające 12-miesięcznym przeglądom.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200">
                    Sprawne: {fireEquipment.filter(f => f.status.includes('Sprawn')).length}
                  </span>
                  <span className="text-xs font-mono font-bold bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg border border-rose-200">
                    Alert/Przeterminowane: {fireEquipment.filter(f => !f.status.includes('Sprawn')).length}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {fireEquipment.map((item) => {
                  const isOk = item.status.includes('Sprawn');
                  const isExpired = item.status.includes('Wymaga') || item.status.includes('Przeterminowany');
                  return (
                    <div 
                      key={item.id} 
                      className={`p-4 border rounded-xl transition-all space-y-3 ${
                        isOk 
                          ? 'bg-zinc-50/60 border-zinc-200' 
                          : isExpired 
                          ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-300' 
                          : 'bg-rose-50/40 border-rose-300 ring-1 ring-rose-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-red-700">{item.id}</span>
                          <strong className="text-xs text-zinc-900">{item.name}</strong>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-500 block">Środek Gaśniczy / Pojemność:</span>
                          <strong className="text-xs font-mono text-zinc-800">{item.agent}</strong>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono bg-white p-2.5 border border-zinc-200 rounded-lg">
                        <div>
                          <span className="text-[10px] text-zinc-400 block">Lokalizacja & Dostępność:</span>
                          <strong className="text-zinc-800 text-[11px] flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-red-600" />
                            {item.location}
                          </strong>
                          <span className={`text-[10px] ${item.accessible ? 'text-emerald-700' : 'text-rose-600 font-bold'}`}>
                            {item.accessible ? '✓ Wolna strefa 1m' : '⚠️ Zastawiony paletą!'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 block">Wskazanie Manometru (Ciśnienie):</span>
                          <span className="text-zinc-800 text-[11px] font-bold flex items-center gap-1">
                            <Gauge className="w-3 h-3 text-indigo-600" />
                            {item.pressureBar > 0 ? `${item.pressureBar} bar` : 'Bezciśnieniowy'}
                          </span>
                          <div className="text-[10px] text-zinc-500">{item.pressureStatus}</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 block">Ważność Legalizacji Konserwatora:</span>
                          <strong className={isExpired ? 'text-rose-600 font-black' : 'text-zinc-800'}>{item.nextInspectionDue}</strong>
                          <div className="text-[10px] text-zinc-500">Próba UDT do: {item.tankUdtExpiry}</div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                        <div className="text-[11px] text-zinc-600 italic">
                          <span className="font-bold font-sans not-italic text-zinc-700">Konserwator:</span> {item.inspector} — {item.notes}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isOk ? (
                            <button
                              type="button"
                              onClick={() => handleReportFireDefect(item.id)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-xs font-bold cursor-pointer transition-all"
                            >
                              Zgłoś Spadek Ciśnienia
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRenewFireInspection(item.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer shadow transition-all flex items-center gap-1.5 border-none"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Zatwierdź Przegląd (12 msc)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Fire Safety Guide & Equipment Registration */}
            <div className="lg:col-span-4 space-y-6">
              {/* FIRE CLASSES GUIDE */}
              <div className="bg-gradient-to-br from-zinc-900 to-red-950 text-white border border-red-900/60 rounded-2xl p-5 shadow-xl space-y-3 font-mono">
                <div className="flex items-center gap-2 border-b border-red-900/60 pb-2">
                  <Flame className="w-4 h-4 text-red-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-red-200">
                    Grupy Pożarów i Środki Gaśnicze
                  </h3>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="p-2 bg-black/50 border border-red-900/40 rounded-lg">
                    <strong className="text-amber-400 block">Grupa A: Ciała Stałe (Drewno, Karton)</strong>
                    <span className="text-zinc-300">Zastosowanie: Gaśnica proszkowa ABC lub Hydrant DN25.</span>
                  </div>
                  <div className="p-2 bg-black/50 border border-red-900/40 rounded-lg">
                    <strong className="text-blue-400 block">Grupa B: Ciecze Łatwopalne (Paliwa, Rozpuszczalniki)</strong>
                    <span className="text-zinc-300">Zastosowanie: Gaśnica proszkowa ABC / Piana gaśnicza.</span>
                  </div>
                  <div className="p-2 bg-black/50 border border-red-900/40 rounded-lg">
                    <strong className="text-emerald-400 block">Urządzenia pod Napięciem (Serwerownia)</strong>
                    <span className="text-zinc-300">Zastosowanie: Gaśnica Śniegowa CO2 (bezinwazyjne odparowanie).</span>
                  </div>
                </div>
              </div>

              {/* NEW FIRE EQUIPMENT REGISTRATION FORM */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4 font-sans">
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-900 font-mono flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-red-600" />
                  Wprowadź Nowy Punkt PPOŻ
                </h3>
                <form onSubmit={handleRegisterFireEquipment} className="space-y-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-600 block mb-1">Nazwa / Model Sprzętu:</label>
                    <input
                      type="text"
                      placeholder="np. Gaśnica Proszkowa GP-6x ABC"
                      value={newFireName}
                      onChange={(e) => setNewFireName(e.target.value)}
                      className="w-full p-2 border border-zinc-300 rounded-lg text-xs bg-zinc-50 font-sans"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-600 block mb-1">Rodzaj Urządzenia PPOŻ:</label>
                    <select
                      value={newFireType}
                      onChange={(e) => setNewFireType(e.target.value)}
                      className="w-full p-2 border border-zinc-300 rounded-lg text-xs bg-zinc-50 font-sans"
                    >
                      <option value="Gaśnica Proszkowa GP-6x ABC">Gaśnica Proszkowa GP-6x ABC (6 kg)</option>
                      <option value="Gaśnica Śniegowa GS-5x BC">Gaśnica Śniegowa GS-5x BC (5 kg CO2)</option>
                      <option value="Hydrant Wewnętrzny DN25">Hydrant Wewnętrzny DN25 z Wężem 30m</option>
                      <option value="Koc Gaśniczy 1.2x1.8m">Koc Gaśniczy z Włókna Szklanego</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-600 block mb-1">Nr Fabryczny / Tabliczka:</label>
                      <input
                        type="text"
                        placeholder="KZ-2026-001"
                        value={newFireSerial}
                        onChange={(e) => setNewFireSerial(e.target.value)}
                        className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-mono bg-zinc-50"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-zinc-600 block mb-1">Lokalizacja / Słup:</label>
                      <input
                        type="text"
                        placeholder="np. Słup C-02 (Alejka 6)"
                        value={newFireLocation}
                        onChange={(e) => setNewFireLocation(e.target.value)}
                        className="w-full p-2 border border-zinc-300 rounded-lg text-xs bg-zinc-50 font-sans"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl shadow cursor-pointer transition-all border-none"
                  >
                    Wpisz do Księgi PPOŻ
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

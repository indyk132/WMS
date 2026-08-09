import React, { useState } from 'react';
import { 
  FileText, Printer, Mail, MessageSquare, ShieldAlert, Truck, 
  CheckCircle2, Copy, Eye, Download, Code, ArrowRight, Package, 
  QrCode, Barcode, ShieldCheck, MapPin, ExternalLink, Calendar, Search, RefreshCw, Send, DollarSign, Edit3,
  Monitor, Tv, Smartphone, User, ShoppingCart, Layers, Tag, Grid, Clock, Check
} from 'lucide-react';

interface TemplatesCenterProps {
  addToast?: (title: string, text: string, type: 'error' | 'warning' | 'info' | 'success') => void;
  logActivity?: (msg: string, type: string, details?: string) => void;
}

export default function TemplatesCenter({ addToast, logActivity }: TemplatesCenterProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>(1);
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  // Editable sample data state
  const [sampleCustomer, setSampleCustomer] = useState('Tech-Corp Sp. z o.o.');
  const [sampleOrderNo, setSampleOrderNo] = useState('ORD-98421');
  const [sampleTrackingNo, setSampleTrackingNo] = useState('PL68492019482INP');
  const [sampleCarrier, setSampleCarrier] = useState('InPost Paczkomaty 24/7');
  const [sampleAmount, setSampleAmount] = useState('458.50 PLN');

  const templatesList = [
    { id: 1, name: '1. Dokument Wydań WZ / List CMR', category: 'Dokumenty Magazynowe', icon: FileText, tag: 'PDF / Druk' },
    { id: 2, name: '2. Etykieta Kurierska Termiczna (100x150mm)', category: 'Dokumenty Magazynowe', icon: Printer, tag: 'Zebra / Sato' },
    { id: 3, name: '3. Etykieta Paletowa GS1-128 / LPN', category: 'Dokumenty Magazynowe', icon: Tag, tag: 'GS1-128' },
    { id: 4, name: '4. Etykieta Adresowa Regału (Bin Location)', category: 'Dokumenty Magazynowe', icon: Barcode, tag: 'Rack Label' },
    { id: 5, name: '5. Faktura VAT & Pro-Forma B2B', category: 'Dokumenty Magazynowe', icon: DollarSign, tag: 'PDF Invoice' },
    { id: 6, name: '6. Formularz Protokołu Reklamacji RMA', category: 'Dokumenty Magazynowe', icon: RefreshCw, tag: 'RMA Form' },
    { id: 7, name: '7. Bilecik Imienny & Podziękowanie', category: 'Dokumenty Magazynowe', icon: Check, tag: 'Insert Card' },
    { id: 8, name: '8. E-mail: Paczka Wysłana z Śledzeniem', category: 'Powiadomienia E-mail', icon: Mail, tag: 'HTML Mail' },
    { id: 9, name: '9. E-mail: Potwierdzenie Zamówienia B2B/B2C', category: 'Powiadomienia E-mail', icon: Mail, tag: 'HTML Mail' },
    { id: 10, name: '10. E-mail: Uznanie Zwrotu i Refundacja RMA', category: 'Powiadomienia E-mail', icon: Mail, tag: 'HTML Mail' },
    { id: 11, name: '11. SMS: Paczka Czeka w Punkcie / Paczkomacie', category: 'Wiadomości SMS', icon: MessageSquare, tag: 'SMS Text' },
    { id: 12, name: '12. E-mail: Awizacja Dostawy w Doku (YMS)', category: 'Powiadomienia E-mail', icon: Calendar, tag: 'Dock Email' },
    { id: 13, name: '13. E-mail: Alert Bezpieczeństwa IT (Nowe IP)', category: 'Powiadomienia E-mail', icon: ShieldAlert, tag: 'Security Alert' },
    { id: 14, name: '14. Ekran TV Magazynu (Large Screen)', category: 'Ekran & UI Layout', icon: Tv, tag: 'TV Dashboard' },
    { id: 15, name: '15. Terminal Zbieracza RF (Mały Ekran)', category: 'Ekran & UI Layout', icon: Smartphone, tag: 'RF Handheld' },
    { id: 16, name: '16. Stacja Pakowania (Dual-Monitor)', category: 'Ekran & UI Layout', icon: Monitor, tag: 'Packer UI' },
    { id: 17, name: '17. Raport Analityczny Dyrekcji (KPI)', category: 'Ekran & UI Layout', icon: FileText, tag: 'Executive Board' },
    { id: 18, name: '18. Karta Produktu SKU Specyfikacja', category: 'Ekran & UI Layout', icon: Package, tag: 'SKU Spec' },
    { id: 19, name: '19. Koszyk Hurtowy B2B (Quick Grid)', category: 'Interfejs Klienta', icon: Grid, tag: 'B2B Table' },
    { id: 20, name: '20. Strona Śledzenia Statusu Zamówienia', category: 'Interfejs Klienta', icon: ExternalLink, tag: 'Storefront View' },
    { id: 21, name: '21. Modal Wyboru Punktu Odbioru (BOPIS)', category: 'Interfejs Klienta', icon: MapPin, tag: 'Pickup Modal' },
    { id: 22, name: '22. Kaflowy Wybór Kuriera w Koszyku', category: 'Interfejs Klienta', icon: Truck, tag: 'Checkout Widget' },
    { id: 23, name: '23. Reguła Przydziału Fali Zbiórkowej', category: 'Reguły WMS', icon: Layers, tag: 'Wave Preset' },
    { id: 24, name: '24. Reguła Wyboru Najtańszego Kuriera', category: 'Reguły WMS', icon: Code, tag: 'Rate Engine' },
    { id: 25, name: '25. Plan Inwentaryzacji Ciągłej', category: 'Reguły WMS', icon: Clock, tag: 'Cycle Schedule' },
  ];

  const handleCopyCode = (codeText: string, label: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedStatus(label);
    if (addToast) addToast('Skopiowano do schowka', `Skopiowano szablon: ${label}`, 'success');
    setTimeout(() => setCopiedStatus(null), 3000);
  };

  const handlePrintTemplate = () => {
    window.print();
    if (addToast) addToast('Wysłano do druku', 'Generowanie wydruku szablonu...', 'info');
  };

  const currentTemplate = templatesList.find(t => t.id === selectedTemplateId) || templatesList[0];

  return (
    <div className="space-y-6 font-sans antialiased text-zinc-900 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0b1c30] to-[#132742] text-white p-6 rounded-2xl shadow-md border border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-black uppercase tracking-wider font-display">
              Kompletne Centrum 25 Szablonów (Full Templates Hub)
            </h1>
          </div>
          <p className="text-xs text-zinc-300 mt-1 max-w-2xl leading-relaxed">
            Zarządzaj, podglądaj i edytuj kompletny pakiet 25 szablonów dokumentów WMS, etykiet, maili HTML, powiadomień SMS, ekranów dyspozytorskich oraz reguł automatyzacji.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrintTemplate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow cursor-pointer transition-all flex items-center gap-2 uppercase tracking-wider border-none"
          >
            <Printer className="w-4 h-4" />
            Drukuj Wybrany Szablon
          </button>
        </div>
      </div>

      {/* Grid Layout: Template Selector Sidebar + Preview Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Sidebar: Select Template */}
        <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 font-mono">
              Wszystkie Szablony (25/25)
            </h2>
            <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
              Aktywny: #{currentTemplate.id}
            </span>
          </div>

          <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-1">
            {templatesList.map((tpl) => {
              const IconComp = tpl.icon;
              const isSelected = selectedTemplateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => {
                    setSelectedTemplateId(tpl.id);
                    if (logActivity) logActivity(`Wybrano podgląd szablonu ${tpl.name}`, 'info');
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected 
                      ? 'bg-blue-50/90 border-blue-500 text-blue-900 shadow-sm font-bold' 
                      : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <IconComp className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-zinc-400'}`} />
                    <span className="text-[11px] truncate">{tpl.name}</span>
                  </div>
                  <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                    isSelected ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                  }`}>
                    {tpl.tag}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Data Customizer */}
          <div className="pt-3 border-t border-zinc-100 space-y-2 font-sans">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block font-mono flex items-center gap-1">
              <Edit3 className="w-3 h-3 text-blue-600" />
              Testowe Dane Szablonu:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[9px] text-zinc-400 block font-bold">Klient:</label>
                <input 
                  value={sampleCustomer} 
                  onChange={(e) => setSampleCustomer(e.target.value)} 
                  className="w-full p-1 border border-zinc-200 rounded text-[11px] text-zinc-800 font-medium bg-zinc-50"
                />
              </div>
              <div>
                <label className="text-[9px] text-zinc-400 block font-bold">Nr Zamówienia:</label>
                <input 
                  value={sampleOrderNo} 
                  onChange={(e) => setSampleOrderNo(e.target.value)} 
                  className="w-full p-1 border border-zinc-200 rounded text-[11px] font-mono text-zinc-800 font-bold bg-zinc-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Main Panel: Live Template Display */}
        <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm min-h-[640px] flex flex-col justify-between">
          
          {/* TEMPLATE 1: Dokument Wydań WZ / List CMR */}
          {selectedTemplateId === 1 && (
            <div className="space-y-6 animate-fadeIn font-sans">
              <div className="flex justify-between items-start border-b border-zinc-200 pb-4">
                <div>
                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 font-mono text-[10px] font-bold rounded uppercase">
                    Szablon #1 • Dokument WZ / CMR
                  </span>
                  <h2 className="text-lg font-black text-zinc-900 mt-1 uppercase font-display">
                    DOKUMENT WYDANIA ZEWNĘTRZNEGO (WZ / CMR)
                  </h2>
                  <p className="text-xs text-zinc-500 font-mono">Kod identyfikacyjny: WZ-2026/08/89402 • Data wystawienia: 2026-08-05</p>
                </div>
                <QrCode className="w-16 h-16 text-zinc-900 p-1 border border-zinc-300 rounded" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                <div>
                  <strong className="text-zinc-500 block uppercase text-[10px]">Wystawca (Magazyn):</strong>
                  <span className="font-extrabold text-zinc-900 block">Logistics-OS Central WMS</span>
                  <span>Ul. Magazynowa 14, 05-800 Pruszków</span><br />
                  <span>NIP: 525-28-40-192 • REGON: 384029102</span>
                </div>
                <div>
                  <strong className="text-zinc-500 block uppercase text-[10px]">Odbiorca Towaru:</strong>
                  <span className="font-extrabold text-blue-700 block">{sampleCustomer}</span>
                  <span>Ul. Przemysłowa 8/12, 00-950 Warszawa</span><br />
                  <span>Zamówienie: <strong>{sampleOrderNo}</strong></span>
                </div>
              </div>

              <table className="w-full text-xs text-left border-collapse border border-zinc-200">
                <thead>
                  <tr className="bg-zinc-100 font-bold font-mono text-zinc-700 uppercase border-b border-zinc-200">
                    <th className="p-2 border-r border-zinc-200">Lp.</th>
                    <th className="p-2 border-r border-zinc-200">Kod SKU / Nazwa Produktu</th>
                    <th className="p-2 border-r border-zinc-200 text-center">Ilość</th>
                    <th className="p-2 border-r border-zinc-200 text-right">Cena Netto</th>
                    <th className="p-2 text-right">Wartość Netto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-medium">
                  <tr>
                    <td className="p-2 font-mono border-r border-zinc-200">1</td>
                    <td className="p-2 border-r border-zinc-200"><strong>SKU-104</strong> - Skaner Kodów Kreskowych Zebra DS2208</td>
                    <td className="p-2 border-r border-zinc-200 text-center font-mono font-bold">2 szt.</td>
                    <td className="p-2 border-r border-zinc-200 text-right font-mono">180.00 PLN</td>
                    <td className="p-2 text-right font-mono font-bold">360.00 PLN</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono border-r border-zinc-200">2</td>
                    <td className="p-2 border-r border-zinc-200"><strong>SKU-209</strong> - Etykiety Termiczne 100x150mm (Zestaw 5 rolek)</td>
                    <td className="p-2 border-r border-zinc-200 text-center font-mono font-bold">1 op.</td>
                    <td className="p-2 border-r border-zinc-200 text-right font-mono">98.50 PLN</td>
                    <td className="p-2 text-right font-mono font-bold">98.50 PLN</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* TEMPLATE 2: Etykieta Kurierska Termiczna */}
          {selectedTemplateId === 2 && (
            <div className="space-y-4 animate-fadeIn font-sans max-w-sm mx-auto">
              <div className="border-2 border-zinc-900 p-4 rounded-lg bg-white space-y-3 shadow-md font-mono text-zinc-900">
                <div className="flex justify-between items-center border-b-2 border-zinc-900 pb-2">
                  <span className="font-black text-xl tracking-tighter">INPOST</span>
                  <span className="text-xs font-bold bg-zinc-900 text-white px-2 py-0.5 rounded">PACZKOMAT A</span>
                </div>
                <div className="text-xs space-y-0.5">
                  <div className="text-[9px] text-zinc-500 uppercase font-bold">ODDAWCA:</div>
                  <div className="font-bold">LOGISTICS-OS MAGAZYN WMS</div>
                </div>
                <div className="border-t border-dashed border-zinc-400 pt-2 text-xs space-y-0.5">
                  <div className="text-[9px] text-zinc-500 uppercase font-bold">ODBIORCA:</div>
                  <div className="font-bold text-sm text-blue-900">{sampleCustomer}</div>
                  <div className="font-bold">Paczkomat WAW942M</div>
                </div>
                <div className="bg-zinc-100 p-2 text-center border border-zinc-300 rounded space-y-1">
                  <span className="text-[9px] block uppercase font-bold">Numer Przesyłki:</span>
                  <span className="text-xs font-black block tracking-widest">{sampleTrackingNo}</span>
                  <div className="flex justify-center py-1">
                    <Barcode className="w-48 h-12 text-zinc-900" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 3: Etykieta Paletowa GS1-128 / LPN */}
          {selectedTemplateId === 3 && (
            <div className="space-y-4 animate-fadeIn font-mono border-2 border-zinc-900 p-5 rounded-xl bg-white max-w-md mx-auto shadow-md text-xs">
              <div className="flex justify-between items-center border-b-2 border-zinc-900 pb-2">
                <span className="font-black text-lg">GS1-128 PALLET LABEL</span>
                <span className="bg-zinc-900 text-white px-2 py-0.5 text-[10px] font-bold">LPN-98204-EPAL</span>
              </div>
              <div><strong>TOWAR:</strong> Panele Fotowoltaiczne Monokrystaliczne 450W</div>
              <div><strong>KOD SSCC:</strong> (00) 3 5901234 509204918 2</div>
              <div><strong>ILOŚĆ SKU:</strong> 24 szt. • <strong>WAGA:</strong> 540.0 kg</div>
              <div className="flex justify-center py-3 bg-zinc-50 border border-zinc-300 rounded">
                <Barcode className="w-64 h-16 text-zinc-900" />
              </div>
            </div>
          )}

          {/* TEMPLATE 4: Etykieta Adresowa Regału */}
          {selectedTemplateId === 4 && (
            <div className="space-y-3 animate-fadeIn border-4 border-amber-400 p-6 rounded-2xl bg-amber-50 max-w-sm mx-auto text-center font-mono shadow-sm">
              <span className="text-xs font-bold text-amber-800 uppercase block tracking-widest">STREFA KOMPLETACJI A</span>
              <h2 className="text-4xl font-black text-zinc-950 tracking-tight">A-02-14-C</h2>
              <p className="text-[10px] text-zinc-600 font-bold uppercase">KORYTARZ 2 • REGAŁ 14 • POZIOM C</p>
              <div className="flex justify-center pt-2">
                <Barcode className="w-56 h-14 text-zinc-900" />
              </div>
            </div>
          )}

          {/* TEMPLATE 5: Faktura VAT & Pro-Forma B2B */}
          {selectedTemplateId === 5 && (
            <div className="space-y-4 animate-fadeIn font-sans text-xs bg-white p-4 border border-zinc-200 rounded-xl">
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <h3 className="font-black text-base text-zinc-900">FAKTURA VAT NR FV/2026/08/1049</h3>
                  <span className="text-[10px] text-zinc-500 font-mono">Data sprzedaży: 2026-08-05 • Sposób płatności: Przelew 14 dni</span>
                </div>
                <strong className="text-emerald-700 text-sm font-mono">{sampleAmount}</strong>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-3 rounded font-mono text-[11px]">
                <div><strong>Sprzedawca:</strong> Logistics-OS Sp. z o.o. NIP 5252840192</div>
                <div><strong>Nabywca:</strong> {sampleCustomer} NIP 9512049182</div>
              </div>
            </div>
          )}

          {/* TEMPLATE 6: Formularz Protokołu Reklamacji RMA */}
          {selectedTemplateId === 6 && (
            <div className="space-y-4 animate-fadeIn font-sans text-xs border border-purple-200 p-5 rounded-xl bg-purple-50/40">
              <h3 className="font-black text-sm text-purple-900 uppercase tracking-wide">FORMULARZ ZGŁOSZENIA ZWROTU / REKLAMACJI (RMA)</h3>
              <p className="text-[11px] text-purple-800">Dołącz ten formularz do zwracanej paczki na adres magazynu zwrotów.</p>
              <div className="bg-white p-3 rounded border border-purple-200 space-y-2 font-mono text-[11px]">
                <div>Numer zamówienia: <strong>{sampleOrderNo}</strong></div>
                <div>Powód zwrotu: [ ] Uszkodzony w transporcie [ ] Błędny rozmiar [ ] Inny</div>
                <div>Numer konta do zwrotu PLN: ____ ____ ____ ____ ____ ____</div>
              </div>
            </div>
          )}

          {/* TEMPLATE 7: Bilecik Imienny & Podziękowanie */}
          {selectedTemplateId === 7 && (
            <div className="space-y-3 animate-fadeIn font-serif p-6 rounded-2xl bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200 text-center max-w-sm mx-auto shadow-sm">
              <span className="text-xs italic text-rose-700 font-sans font-bold">Dziękujemy za zakupy!</span>
              <h3 className="text-base font-bold text-zinc-900">Drogi Kliencie z {sampleCustomer},</h3>
              <p className="text-xs text-zinc-600 leading-relaxed font-sans">
                Cieszymy się, że wybrałeś nasz sklep. Odbierz -10% rabatu na kolejne zamówienie z kodem: <strong className="font-mono text-rose-800">WMS10-DZIĘKUJEMY</strong>.
              </p>
            </div>
          )}

          {/* TEMPLATE 8: E-mail: Paczka Wysłana z Śledzeniem */}
          {selectedTemplateId === 8 && (
            <div className="space-y-4 animate-fadeIn max-w-lg mx-auto border border-zinc-200 rounded-xl overflow-hidden shadow-sm bg-white font-sans text-xs">
              <div className="bg-[#0052CC] text-white p-6 text-center space-y-2">
                <Package className="w-10 h-10 mx-auto text-blue-200" />
                <h3 className="text-lg font-black uppercase tracking-wide">Twoja paczka jest w drodze!</h3>
                <p className="text-xs text-blue-100">Zamówienie {sampleOrderNo} zostało spakowane i wydane kurierowi.</p>
              </div>
              <div className="p-6 space-y-4 text-zinc-700">
                <p>Witaj <strong>{sampleCustomer}</strong>,</p>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-150 space-y-2 font-mono">
                  <div><strong className="text-zinc-500">Numer śledzenia:</strong> <span className="text-blue-700 font-bold">{sampleTrackingNo}</span></div>
                  <div><strong className="text-zinc-500">Przewoźnik:</strong> {sampleCarrier}</div>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 9: E-mail: Potwierdzenie Zamówienia B2B/B2C */}
          {selectedTemplateId === 9 && (
            <div className="space-y-4 animate-fadeIn max-w-lg mx-auto border border-zinc-200 rounded-xl overflow-hidden shadow-sm bg-white font-sans text-xs">
              <div className="bg-emerald-600 text-white p-5 text-center space-y-1">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-100" />
                <h3 className="text-base font-black uppercase tracking-wide">Dziękujemy za złożenie zamówienia!</h3>
              </div>
              <div className="p-5 space-y-3 text-zinc-700">
                <p>Witaj <strong>{sampleCustomer}</strong>, Twoje zamówienie zostało przyjęte w magazynie.</p>
                <div className="border border-zinc-200 rounded-lg p-3 space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between"><span>Suma zamówienia:</span> <strong className="text-zinc-900">{sampleAmount}</strong></div>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 10: E-mail: Uznanie Zwrotu RMA */}
          {selectedTemplateId === 10 && (
            <div className="space-y-4 animate-fadeIn max-w-lg mx-auto border border-zinc-200 rounded-xl overflow-hidden shadow-sm bg-white font-sans text-xs">
              <div className="bg-purple-700 text-white p-5 text-center space-y-1">
                <RefreshCw className="w-8 h-8 mx-auto text-purple-200" />
                <h3 className="text-base font-black uppercase tracking-wide">Reklamacja RMA Zaakceptowana</h3>
              </div>
              <div className="p-5 space-y-3 text-zinc-700 font-mono">
                <div>Kwota zwrotu: <strong className="text-purple-800 font-bold">{sampleAmount}</strong></div>
              </div>
            </div>
          )}

          {/* TEMPLATE 11: SMS: Paczka Czeka w Punkcie / Paczkomacie */}
          {selectedTemplateId === 11 && (
            <div className="space-y-4 animate-fadeIn max-w-sm mx-auto font-sans">
              <div className="bg-zinc-900 text-white p-4 rounded-2xl shadow-xl space-y-2 border border-zinc-700 text-xs font-mono">
                Paczka {sampleOrderNo} czeka w Paczkomacie WAW942M. Kod odbioru: <strong className="text-amber-400">894 201</strong>. Odbierz do jutra do 16:00.
              </div>
            </div>
          )}

          {/* TEMPLATE 12: E-mail: Awizacja Dostawy w Doku (YMS) */}
          {selectedTemplateId === 12 && (
            <div className="space-y-3 animate-fadeIn font-sans text-xs border border-blue-200 p-5 rounded-xl bg-blue-50/50">
              <h3 className="font-bold text-blue-900 uppercase">AWIZACJA DOSTAWY W DOKU #04 (YMS BOOKING)</h3>
              <div className="bg-white p-3 rounded border border-blue-200 font-mono text-[11px] space-y-1">
                <div>Dostawca: <strong>Dachser Freight / Raben</strong></div>
                <div>Przydzielona brama: <strong>Dok #04 - Przyjęcia Inbound</strong></div>
                <div>Slot czasowy: <strong>2026-08-06 09:30 - 10:30</strong></div>
              </div>
            </div>
          )}

          {/* TEMPLATE 13: E-mail: Alert Bezpieczeństwa IT (Nowe IP) */}
          {selectedTemplateId === 13 && (
            <div className="space-y-4 animate-fadeIn max-w-lg mx-auto border border-red-200 rounded-xl overflow-hidden shadow-sm bg-white font-sans text-xs">
              <div className="bg-red-700 text-white p-5 text-center space-y-1">
                <ShieldAlert className="w-8 h-8 mx-auto text-red-200 animate-pulse" />
                <h3 className="text-base font-black uppercase tracking-wide">Alert Bezpieczeństwa IT: Nowe Logowanie</h3>
              </div>
              <div className="p-5 space-y-3 font-mono text-[11px]">
                <div>Adres IP: <strong className="text-red-700">185.220.101.5 (WAN)</strong></div>
              </div>
            </div>
          )}

          {/* TEMPLATE 14: Ekran TV Magazynu (Large Screen) */}
          {selectedTemplateId === 14 && (
            <div className="space-y-4 animate-fadeIn font-sans bg-zinc-950 text-white p-6 rounded-2xl border border-zinc-800">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <h3 className="font-black text-base text-blue-400 uppercase font-mono">STATUS DOKÓW I FALI LIVE TV</h3>
                <span className="text-xs font-mono text-emerald-400 animate-pulse">● LIVE OPERATIONAL STREAM</span>
              </div>
              <div className="grid grid-cols-3 gap-3 font-mono text-center text-xs">
                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800"><span className="text-zinc-500 block">DOK #01</span><strong className="text-emerald-400 text-base">ZAKOŃCZONO</strong></div>
                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800"><span className="text-zinc-500 block">DOK #02</span><strong className="text-amber-400 text-base">ZAŁADUNEK</strong></div>
                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800"><span className="text-zinc-500 block">DOK #03</span><strong className="text-blue-400 text-base">WOLNY</strong></div>
              </div>
            </div>
          )}

          {/* TEMPLATE 15: Terminal Zbieracza RF (Mały Ekran) */}
          {selectedTemplateId === 15 && (
            <div className="space-y-3 animate-fadeIn max-w-xs mx-auto bg-black text-green-400 p-4 rounded-xl font-mono text-xs border border-green-500 shadow-2xl">
              <div className="border-b border-green-500 pb-1 font-bold text-center uppercase">RF TERMINAL v4.2</div>
              <div>REGAŁ: <strong className="text-white text-base">A-02-14-C</strong></div>
              <div>SKU: <strong className="text-white">SKU-104 (Skaner Zebra)</strong></div>
              <div className="bg-green-950 p-2 rounded text-center text-white font-black text-sm">POBIERZ: 2 SZT.</div>
            </div>
          )}

          {/* TEMPLATE 16: Stacja Pakowania (Dual-Monitor) */}
          {selectedTemplateId === 16 && (
            <div className="space-y-4 animate-fadeIn font-sans text-xs bg-zinc-900 text-zinc-100 p-4 rounded-xl border border-zinc-700">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-blue-400 font-mono">WIDOK STACJI PAKOWACZA (PACKER DUAL-MONITOR SCREEN)</h3>
              <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
                <div className="bg-zinc-800 p-3 rounded border border-zinc-700">Monitor #1: Skanowanie SKU & Weryfikacja Paczki</div>
                <div className="bg-zinc-800 p-3 rounded border border-zinc-700">Monitor #2: Waga Tenzometryczna & Etykiety Kuriera</div>
              </div>
            </div>
          )}

          {/* TEMPLATE 17: Raport Analityczny Dyrekcji (KPI) */}
          {selectedTemplateId === 17 && (
            <div className="space-y-4 animate-fadeIn font-sans text-xs border border-zinc-200 p-5 rounded-xl bg-white">
              <h3 className="font-black text-sm uppercase font-display text-zinc-900">PODSUMOWANIE EXEC KPI DLA ZARZĄDU (MONTHLY EXECUTIVE REPORT)</h3>
              <div className="grid grid-cols-3 gap-3 font-mono text-center">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200"><span className="text-[10px] text-zinc-500 block">Wydane Zamówienia</span><strong className="text-blue-900 text-sm">4,892 szt.</strong></div>
                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200"><span className="text-[10px] text-zinc-500 block">Średni Czas Zbiórki</span><strong className="text-emerald-900 text-sm">142 sek.</strong></div>
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200"><span className="text-[10px] text-zinc-500 block">Accuracy SLA</span><strong className="text-purple-900 text-sm">99.8%</strong></div>
              </div>
            </div>
          )}

          {/* TEMPLATE 18: Karta Produktu SKU Specyfikacja */}
          {selectedTemplateId === 18 && (
            <div className="space-y-3 animate-fadeIn font-sans text-xs border border-zinc-200 p-4 rounded-xl bg-white">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-bold text-sm text-zinc-900">SPECYFIKACJA TECHNICZNA SKU-104</h3>
                <span className="font-mono text-[10px] bg-zinc-100 px-2 py-0.5 rounded">EAN: 5901234567890</span>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div>Wymiary: 18 x 12 x 8 cm</div>
                <div>Waga brutto: 0.45 kg</div>
                <div>Klasa rotacji: A (Fast-Pick)</div>
                <div>Główny regał: A-02-14-C</div>
              </div>
            </div>
          )}

          {/* TEMPLATE 19: Koszyk Hurtowy B2B (Quick Grid) */}
          {selectedTemplateId === 19 && (
            <div className="space-y-3 animate-fadeIn font-sans text-xs border border-zinc-200 p-4 rounded-xl bg-white">
              <h3 className="font-bold text-xs uppercase tracking-wider text-blue-900 font-mono">B2B QUICK ORDER GRID (SZYBKIE ZAMAWIANIE HURTOWE)</h3>
              <table className="w-full text-left font-mono text-[11px] border border-zinc-200">
                <thead className="bg-zinc-50 border-b">
                  <tr><th className="p-2">Kod SKU</th><th className="p-2">Produkt</th><th className="p-2">Cena Netto</th><th className="p-2 text-center">Ilość Kartonów</th></tr>
                </thead>
                <tbody>
                  <tr className="border-b"><td className="p-2 font-bold">SKU-104</td><td className="p-2">Skaner Zebra DS2208</td><td className="p-2">180.00 PLN</td><td className="p-2 text-center"><input defaultValue="10" className="w-12 border p-0.5 text-center font-bold" /></td></tr>
                </tbody>
              </table>
            </div>
          )}

          {/* TEMPLATE 20: Strona Śledzenia Statusu Zamówienia */}
          {selectedTemplateId === 20 && (
            <div className="space-y-6 animate-fadeIn font-sans">
              <div className="border-b border-zinc-200 pb-4">
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 font-mono text-[10px] font-bold rounded uppercase">
                  Szablon #20 • Publiczna Strona Śledzenia Zamówienia
                </span>
                <h2 className="text-lg font-black text-zinc-900 mt-1 uppercase font-display">
                  Śledzenie Statusu Zamówienia {sampleOrderNo}
                </h2>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold">✓ 1. Złożone</div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold">✓ 2. Zbierane</div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold">✓ 3. Spakowane</div>
                <div className="p-3 bg-blue-600 text-white rounded-xl font-bold shadow animate-pulse">🚚 4. W drodze</div>
              </div>
            </div>
          )}

          {/* TEMPLATE 21: Modal Wyboru Punktu Odbioru (BOPIS) */}
          {selectedTemplateId === 21 && (
            <div className="space-y-3 animate-fadeIn max-w-sm mx-auto border border-blue-300 p-5 rounded-2xl bg-white shadow-xl text-xs font-sans">
              <h3 className="font-bold text-sm text-blue-900 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-blue-600" /> WYBIERZ PUNKT ODBIORU OSOBISTEGO (BOPIS)</h3>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1 font-mono text-[11px]">
                <strong className="text-zinc-900 block">Magazyn Główny Pruszków</strong>
                <p>ul. Magazynowa 14 • Odbiór dzisiaj do godz. 18:00</p>
                <span className="text-emerald-700 font-bold block">✓ Towar dostępny od ręki</span>
              </div>
            </div>
          )}

          {/* TEMPLATE 22: Kaflowy Wybór Kuriera w Koszyku */}
          {selectedTemplateId === 22 && (
            <div className="space-y-4 animate-fadeIn font-sans">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">
                Wybierz metodę dostawy w koszyku:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 border-2 border-blue-600 rounded-xl bg-blue-50/50 shadow-sm space-y-1 cursor-pointer">
                  <div className="font-bold text-xs text-blue-900 flex justify-between">
                    <span>InPost Paczkomat 24/7</span>
                    <span className="text-blue-700">12.99 PLN</span>
                  </div>
                  <p className="text-[10px] text-zinc-500">Przewidywana dostawa: Jutro</p>
                </div>
                <div className="p-4 border border-zinc-200 rounded-xl bg-white space-y-1 cursor-pointer">
                  <div className="font-bold text-xs text-zinc-900 flex justify-between">
                    <span>DPD Express</span>
                    <span>18.50 PLN</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 23: Reguła Przydziału Fali Zbiórkowej */}
          {selectedTemplateId === 23 && (
            <div className="space-y-3 animate-fadeIn font-sans text-xs border border-zinc-200 p-4 rounded-xl bg-white">
              <h3 className="font-bold text-xs uppercase tracking-wider text-purple-900 font-mono">REGUŁA AUTOMATYCZNEGO TWORZENIA FALI ZBIÓRKOWEJ (WAVE PRESET)</h3>
              <div className="bg-purple-50 border border-purple-200 p-3 rounded font-mono text-[11px] space-y-1">
                <div>Grupuj zamówienia według: <strong>Ten sam SKU + Ten sam korytarz</strong></div>
                <div>Maksymalna liczba zlokalizowanych paczek w fali: <strong>12 kartonów</strong></div>
              </div>
            </div>
          )}

          {/* TEMPLATE 24: Reguła Wyboru Najtańszego Kuriera */}
          {selectedTemplateId === 24 && (
            <div className="space-y-4 animate-fadeIn font-sans">
              <div className="border-b border-zinc-200 pb-3">
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-mono text-[10px] font-bold rounded uppercase">
                  Szablon #24 • Automatyczny Silnik Wyboru Kuriera
                </span>
                <h2 className="text-base font-black text-zinc-900 uppercase font-display mt-1">
                  Matryca Reguł Kosztowych i Wymiarowych Spedycji WMS
                </h2>
              </div>
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 font-mono text-xs space-y-2">
                <div className="p-2 bg-white border border-zinc-200 rounded flex justify-between items-center">
                  <span>Paczka &lt; 2kg i wymiary &lt; 38x41x64cm</span>
                  <strong className="text-blue-700">→ InPost Paczkomaty (12.99 PLN)</strong>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 25: Plan Inwentaryzacji Ciągłej */}
          {selectedTemplateId === 25 && (
            <div className="space-y-3 animate-fadeIn font-sans text-xs border border-zinc-200 p-4 rounded-xl bg-white">
              <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-900 font-mono">HARMONOGRAM INWENTARYZACJI CIĄGŁEJ (CYCLE COUNT PRESET)</h3>
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded font-mono text-[11px] space-y-1">
                <div>Strefa A (Towary A-rotujące): <strong>Co 14 dni</strong></div>
                <div>Strefa B (Towary B-rotujące): <strong>Co 30 dni</strong></div>
                <div>Strefa C (Towary C-rotujące): <strong>Co 90 dni</strong></div>
              </div>
            </div>
          )}

          {/* Footer Action Controls */}
          <div className="pt-6 border-t border-zinc-200 flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 font-mono">
              Status: Szablon #{currentTemplate.id} Aktywny w Klastrze WMS
            </span>
            <button
              onClick={() => handleCopyCode(JSON.stringify(currentTemplate), `Kod Szablonu #${currentTemplate.id}`)}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-lg cursor-pointer transition-all shadow flex items-center gap-1.5 uppercase tracking-wider border-none"
            >
              <Copy className="w-3.5 h-3.5" />
              Kopiuj Kod Szablonu
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

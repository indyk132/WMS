import React, { useState } from 'react';
import { 
  Globe, Share2, DollarSign, Languages, ShieldAlert, FileText, 
  CheckCircle2, RefreshCw, Copy, Plus, Trash2, ArrowRight, Layers,
  ShoppingBag, Check, AlertTriangle, Search, Calculator, Tag, Percent,
  Clock, Star, ThumbsUp
} from 'lucide-react';

interface OmnichannelHubProps {
  addToast?: (title: string, text: string, type: 'error' | 'warning' | 'info' | 'success') => void;
  logActivity?: (msg: string, type: string, details?: string) => void;
}

export default function OmnichannelHub({ addToast, logActivity }: OmnichannelHubProps) {
  const [activeTab, setActiveTab] = useState<'referral' | 'mapper' | 'currencies' | 'languages' | 'eu_restrictions' | 'vat_oss' | 'delivery_slots' | 'reviews'>('referral');

  // ----------------------------------------------------
  // OPTION 477: Scheduled Delivery Slots State
  // ----------------------------------------------------
  const [scheduledDeliveryOrders, setScheduledDeliveryOrders] = useState([
    { orderId: 'ORD-94012', customer: 'Jan Kowalski', slotDate: 'Jutro (13 Sie)', slotTime: '14:00 - 16:00', courier: 'DHL Express', status: 'Potwierdzone Okno' },
    { orderId: 'ORD-94015', customer: 'Marta Nowak', slotDate: 'Jutro (13 Sie)', slotTime: '18:00 - 20:00', courier: 'DPD Evening VIP', status: 'Potwierdzone Okno' },
    { orderId: 'ORD-94020', customer: 'TechCorp Sp. z o.o.', slotDate: 'Pojutrze (14 Sie)', slotTime: '08:00 - 10:00', courier: 'InPost Kurier', status: 'Oczekuje na Zbiórkę' }
  ]);

  // ----------------------------------------------------
  // OPTION 478: Verified Purchase Reviews State
  // ----------------------------------------------------
  const [reviews, setReviews] = useState([
    { id: 'REV-101', sku: 'SKU-10492', productName: 'Płyn hamulcowy DOT-4', customer: 'Piotr W.', rating: 5, comment: 'Produkt najwyższej jakości. Szybka dostawa w wybranym oknie czasowym.', verified: true, date: '2026-08-10', status: 'Zatwierdzony' },
    { id: 'REV-102', sku: 'SKU-20391', productName: 'Reflektor LED H7 SuperVolt', customer: 'Tomasz B.', rating: 5, comment: 'Świetnie świeci, bardzo starannie spakowane w folie bąbelkową.', verified: true, date: '2026-08-11', status: 'Zatwierdzony' },
    { id: 'REV-103', sku: 'SKU-50493', productName: 'Olej silnikowy Syntetic 5W30', customer: 'Karol M.', rating: 4, comment: 'Dobra cena, oryginalne fabryczne opakowanie.', verified: true, date: '2026-08-12', status: 'Oczekuje na Moderację' }
  ]);

  const handleApproveReview = (id: string) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'Zatwierdzony' } : r));
    if (addToast) addToast('Zatwierdzono opinię', 'Opinia z flagą Zweryfikowany Zakup została opublikowana w sklepie.', 'success');
  };

  // ----------------------------------------------------
  // OPTION 363: Referral Program State
  // ----------------------------------------------------
  const [referralCodes, setReferralCodes] = useState([
    { code: 'REF-MARIUSZ-15', owner: 'Mariusz K.', discountPct: 15, uses: 14, rewardEarned: '210 PLN', status: 'Aktywny' },
    { code: 'REF-TECHCORP-20', owner: 'Tech-Corp Sp. z o.o.', discountPct: 20, uses: 48, rewardEarned: '1440 PLN', status: 'Aktywny' },
    { code: 'REF-JANUSZ-10', owner: 'Janusz Kowalski', discountPct: 10, uses: 3, rewardEarned: '45 PLN', status: 'Aktywny' }
  ]);
  const [newRefCode, setNewRefCode] = useState('');
  const [newRefOwner, setNewRefOwner] = useState('');
  const [newRefDiscount, setNewRefDiscount] = useState(15);

  const handleCreateReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRefCode || !newRefOwner) return;
    const item = {
      code: newRefCode.toUpperCase().startsWith('REF-') ? newRefCode.toUpperCase() : `REF-${newRefCode.toUpperCase()}`,
      owner: newRefOwner,
      discountPct: Number(newRefDiscount) || 15,
      uses: 0,
      rewardEarned: '0 PLN',
      status: 'Aktywny'
    };
    setReferralCodes([item, ...referralCodes]);
    setNewRefCode('');
    setNewRefOwner('');
    if (addToast) addToast('Stworzono kod polecający', `Kod ${item.code} przypisany do ${item.owner}`, 'success');
    if (logActivity) logActivity(`Utworzono kod polecający ${item.code}`, 'info');
  };

  // ----------------------------------------------------
  // OPTION 369: Marketplace Category & Param Mapper
  // ----------------------------------------------------
  const [categoryMappings, setCategoryMappings] = useState([
    { wmsCategory: 'Elektronika & Skanery', channel: 'Allegro', externalCat: 'Elektronika > Sprzęt Studyjny i Biurowy > Skanery', status: 'Zmapowane', autoSync: true },
    { wmsCategory: 'Materiały Eksploatacyjne', channel: 'Amazon FBA', externalCat: 'Office Products > Label Tape & Roll', status: 'Zmapowane', autoSync: true },
    { wmsCategory: 'Oprogramowanie WMS', channel: 'BaseLinker', externalCat: 'Oprogramowanie Biznesowe / Licencje', status: 'Zmapowane', autoSync: true },
    { wmsCategory: 'Wyposażenie Regałowe', channel: 'Google Shopping', externalCat: 'Business & Industrial > Material Handling', status: 'Weryfikacja', autoSync: false }
  ]);

  // ----------------------------------------------------
  // OPTION 370: NBP Currency Exchange Rates State
  // ----------------------------------------------------
  const [currencyRates, setCurrencyRates] = useState([
    { code: 'PLN', name: 'Złoty Polski', rate: 1.0000, symbol: 'zł', nbpDate: '2026-08-12', marginPct: 0 },
    { code: 'EUR', name: 'Euro', rate: 4.2850, symbol: '€', nbpDate: '2026-08-12 (Tabela NBP 154/A/NBP/2026)', marginPct: 1.5 },
    { code: 'USD', name: 'Dolar Amerykański', rate: 3.9210, symbol: '$', nbpDate: '2026-08-12 (Tabela NBP 154/A/NBP/2026)', marginPct: 1.5 },
    { code: 'GBP', name: 'Funt Brytyjski', rate: 5.0420, symbol: '£', nbpDate: '2026-08-12 (Tabela NBP 154/A/NBP/2026)', marginPct: 2.0 }
  ]);
  const [isFetchingNbp, setIsFetchingNbp] = useState(false);

  const handleFetchNBP = () => {
    setIsFetchingNbp(true);
    setTimeout(() => {
      setIsFetchingNbp(false);
      setCurrencyRates(prev => prev.map(c => {
        if (c.code === 'EUR') return { ...c, rate: 4.2910, nbpDate: 'Aktualny kurs NBP na żywo (Dziś 11:00)' };
        if (c.code === 'USD') return { ...c, rate: 3.9305, nbpDate: 'Aktualny kurs NBP na żywo (Dziś 11:00)' };
        if (c.code === 'GBP') return { ...c, rate: 5.0510, nbpDate: 'Aktualny kurs NBP na żywo (Dziś 11:00)' };
        return c;
      }));
      if (addToast) addToast('Pobrano kursy NBP', 'Zaktualizowano tabelę kursów walut NBP dla EUR, USD, GBP.', 'success');
      if (logActivity) logActivity('Pobranie najnowszych kursów walut NBP na żywo', 'info');
    }, 600);
  };

  // ----------------------------------------------------
  // OPTION 371: Multi-Language Dictionary (PL, EN, DE)
  // ----------------------------------------------------
  const [languageDictionary, setLanguageDictionary] = useState([
    { key: 'btn_add_to_cart', pl: 'Dodaj do koszyka', en: 'Add to Cart', de: 'In den Warenkorb' },
    { key: 'btn_checkout', pl: 'Przejdź do kasy', en: 'Proceed to Checkout', de: 'Zur Kasse gehen' },
    { key: 'label_search_sku', pl: 'Szukaj towarów SKU...', en: 'Search SKU items...', de: 'SKU-Artikel suchen...' },
    { key: 'header_order_status', pl: 'Status Zamówienia', en: 'Order Status', de: 'Bestellstatus' },
    { key: 'badge_in_stock', pl: 'Dostępny w magazynie', en: 'In Stock', de: 'Auf Lager' }
  ]);

  // ----------------------------------------------------
  // OPTION 373: EU Shipping & Sales Restrictions Manager
  // ----------------------------------------------------
  const [euRestrictions, setEuRestrictions] = useState([
    { country: 'DE (Niemcy)', restrictedCategory: 'Chemia i Płyny ADR', rule: 'Wymagana deklaracja materiałów niebezpiecznych w kurierze DPD', status: 'Rygorystyczny Alert' },
    { country: 'IT (Włochy)', restrictedCategory: 'Akumulatory Li-Ion', rule: 'Wysyłka wyłącznie transportem lądowym (Zaznaczyć ADR Class 9)', status: 'Rygorystyczny Alert' },
    { country: 'FR (Francja)', restrictedCategory: 'Sprzęt Radiowy 5GHz', rule: 'Wymagany certyfikat CE na liście przewozowym', status: 'Ostrzeżenie' },
    { country: 'AT (Austria)', restrictedCategory: 'Produkty Łatwopsujące', rule: 'Wysyłka wyłącznie przesyłką chłodniczą Express', status: 'Blokada Automatyczna' }
  ]);
  const [newEuCountry, setNewEuCountry] = useState('ES (Hiszpania)');
  const [newEuCategory, setNewEuCategory] = useState('Płyny ADR');
  const [newEuRule, setNewEuRule] = useState('Wymagany certyfikat transportu morskiego');

  const handleAddEuRestriction = (e: React.FormEvent) => {
    e.preventDefault();
    const item = { country: newEuCountry, restrictedCategory: newEuCategory, rule: newEuRule, status: 'Rygorystyczny Alert' };
    setEuRestrictions([...euRestrictions, item]);
    if (addToast) addToast('Dodano restrykcję EU', `Dodano nową regułę dla ${newEuCountry}`, 'warning');
    if (logActivity) logActivity(`Dodano restrykcję handlową EU dla ${newEuCountry}`, 'warning');
  };

  // ----------------------------------------------------
  // OPTION 374: VAT OSS Registry & Calculator
  // ----------------------------------------------------
  const [vatOssRates, setVatOssRates] = useState([
    { country: 'PL (Polska)', standardRate: 23, reducedRate: 8, ossStatus: 'Kraj Siedziby' },
    { country: 'DE (Niemcy)', standardRate: 19, reducedRate: 7, ossStatus: 'Aktywny OSS' },
    { country: 'FR (Francja)', standardRate: 20, reducedRate: 5.5, ossStatus: 'Aktywny OSS' },
    { country: 'IT (Włochy)', standardRate: 22, reducedRate: 10, ossStatus: 'Aktywny OSS' },
    { country: 'ES (Hiszpania)', standardRate: 21, reducedRate: 10, ossStatus: 'Aktywny OSS' },
    { country: 'SE (Szwecja)', standardRate: 25, reducedRate: 12, ossStatus: 'Aktywny OSS' },
    { country: 'AT (Austria)', standardRate: 20, reducedRate: 10, ossStatus: 'Aktywny OSS' }
  ]);
  const [calcAmountNet, setCalcAmountNet] = useState<number>(1000);
  const [selectedVatCountry, setSelectedVatCountry] = useState<string>('DE (Niemcy)');

  const selectedCountryVatObj = vatOssRates.find(v => v.country === selectedVatCountry) || vatOssRates[1];
  const vatAmount = (calcAmountNet * (selectedCountryVatObj.standardRate / 100));
  const amountGross = calcAmountNet + vatAmount;

  return (
    <div className="space-y-6 font-sans antialiased text-zinc-900 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0b1c30] via-[#162b48] to-[#1e3a5f] text-white p-6 rounded-2xl shadow-md border border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-black uppercase tracking-wider font-display">
              Omnichannel & Global Trade Hub (Opcje 363, 369, 370, 371, 373, 374)
            </h1>
          </div>
          <p className="text-xs text-zinc-300 mt-1 max-w-3xl leading-relaxed">
            Zarządzaj programem poleceń klientów, mapowaniem marketplace, wielowalutowością NBP, tłumaczem PL/EN/DE, restrykcjami wysyłkowymi EU oraz rozliczeniami procedury VAT OSS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            WMS Trade Engine Active
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('referral')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border ${
            activeTab === 'referral'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-zinc-600 hover:bg-zinc-50 border-zinc-200'
          }`}
        >
          <Share2 className="w-4 h-4" />
          363. System Poleceń (Referral)
        </button>

        <button
          onClick={() => setActiveTab('mapper')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border ${
            activeTab === 'mapper'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-zinc-600 hover:bg-zinc-50 border-zinc-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          369. Mapowanie Marketplace
        </button>

        <button
          onClick={() => setActiveTab('currencies')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border ${
            activeTab === 'currencies'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-zinc-600 hover:bg-zinc-50 border-zinc-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          370. Waluty & Kursy NBP
        </button>

        <button
          onClick={() => setActiveTab('languages')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border ${
            activeTab === 'languages'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-zinc-600 hover:bg-zinc-50 border-zinc-200'
          }`}
        >
          <Languages className="w-4 h-4" />
          371. Tłumaczenia (PL / EN / DE)
        </button>

        <button
          onClick={() => setActiveTab('eu_restrictions')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border ${
            activeTab === 'eu_restrictions'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-zinc-600 hover:bg-zinc-50 border-zinc-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          373. Restrykcje Wysyłkowe EU
        </button>

        <button
          onClick={() => setActiveTab('vat_oss')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border ${
            activeTab === 'vat_oss'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-zinc-600 hover:bg-zinc-50 border-zinc-200'
          }`}
        >
          <Calculator className="w-4 h-4" />
          374. Stawki VAT OSS EU
        </button>

        <button
          onClick={() => setActiveTab('delivery_slots')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border ${
            activeTab === 'delivery_slots'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-zinc-600 hover:bg-zinc-50 border-zinc-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          477. Okna Czasowe Dostaw
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border ${
            activeTab === 'reviews'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-zinc-600 hover:bg-zinc-50 border-zinc-200'
          }`}
        >
          <Star className="w-4 h-4" />
          478. Recenzje (Verified Purchase)
        </button>
      </div>

      {/* TAB CONTENT 1: OPTION 363 - REFERRAL PROGRAM */}
      {activeTab === 'referral' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900 font-display flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-blue-600" />
                  Kody Polecające i Program Lojalnościowy Kancelarii KONTRAHENTÓW
                </h3>
                <p className="text-xs text-zinc-500 font-sans mt-0.5">Zarządzanie wygenerowanymi kodami rabatowymi za polecenie klienta.</p>
              </div>
              <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200">
                Aktywne kody: {referralCodes.length}
              </span>
            </div>

            <table className="w-full text-xs text-left border-collapse border border-zinc-200">
              <thead>
                <tr className="bg-zinc-100 font-bold font-mono text-zinc-700 uppercase border-b border-zinc-200">
                  <th className="p-2.5 border-r border-zinc-200">Kod Polecający</th>
                  <th className="p-2.5 border-r border-zinc-200">Właściciel Kodu</th>
                  <th className="p-2.5 border-r border-zinc-200 text-center">Rabat</th>
                  <th className="p-2.5 border-r border-zinc-200 text-center">Użycia</th>
                  <th className="p-2.5 border-r border-zinc-200 text-right">Zarobiono</th>
                  <th className="p-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 font-medium">
                {referralCodes.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="p-2.5 font-mono font-bold text-blue-700 border-r border-zinc-200">{item.code}</td>
                    <td className="p-2.5 border-r border-zinc-200 font-bold text-zinc-900">{item.owner}</td>
                    <td className="p-2.5 border-r border-zinc-200 text-center font-mono font-bold text-emerald-700">-{item.discountPct}%</td>
                    <td className="p-2.5 border-r border-zinc-200 text-center font-mono">{item.uses} raz(y)</td>
                    <td className="p-2.5 border-r border-zinc-200 text-right font-mono font-bold text-zinc-900">{item.rewardEarned}</td>
                    <td className="p-2.5 text-center">
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
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
              <Plus className="w-4 h-4 text-blue-600" />
              Wygeneruj Nowy Kod Polecający
            </h3>
            <form onSubmit={handleCreateReferral} className="space-y-3 font-sans text-xs">
              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Kod (np. REF-PRO-15):</label>
                <input
                  type="text"
                  placeholder="REF-KLIENT-15"
                  value={newRefCode}
                  onChange={(e) => setNewRefCode(e.target.value)}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-mono uppercase bg-zinc-50"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Właściciel / Klient:</label>
                <input
                  type="text"
                  placeholder="Jan Kowalski lub Firma Sp. z o.o."
                  value={newRefOwner}
                  onChange={(e) => setNewRefOwner(e.target.value)}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs bg-zinc-50"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Zniżka dla poleconego (%):</label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={newRefDiscount}
                  onChange={(e) => setNewRefDiscount(Number(e.target.value))}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-mono bg-zinc-50"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow transition-all uppercase tracking-wider"
              >
                Stwórz Kod Polecający
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: OPTION 369 - MARKETPLACE MAPPER */}
      {activeTab === 'mapper' && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900 font-display flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                Matryca Mapowania Kategorii i Parametrów SKU z Zewnętrznymi Kanałami Sales
              </h3>
              <p className="text-xs text-zinc-500 font-sans mt-0.5">Automatyczne dopasowanie taksonomii WMS do Allegro, Amazon FBA, BaseLinker i Google Shopping.</p>
            </div>
            <button 
              onClick={() => addToast && addToast('Uruchomiono auto-mapowanie', 'Zmapowano 100% kategorii z Allegro i Amazon.', 'success')}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg shadow cursor-pointer transition-all flex items-center gap-1.5 border-none"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Auto-Mapuj Wszystkie SKU
            </button>
          </div>

          <table className="w-full text-xs text-left border-collapse border border-zinc-200 font-sans">
            <thead>
              <tr className="bg-zinc-100 font-bold font-mono text-zinc-700 uppercase border-b border-zinc-200">
                <th className="p-2.5 border-r border-zinc-200">Kategoria WMS Logistics-OS</th>
                <th className="p-2.5 border-r border-zinc-200">Kanał Zewnętrzny</th>
                <th className="p-2.5 border-r border-zinc-200">Ścieżka Kategorii Docelowej (External Taxonomy)</th>
                <th className="p-2.5 border-r border-zinc-200 text-center">Status Synchronizacji</th>
                <th className="p-2.5 text-center">Automatyczna Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 font-medium">
              {categoryMappings.map((row, idx) => (
                <tr key={idx} className="hover:bg-zinc-50">
                  <td className="p-2.5 font-bold text-zinc-900 border-r border-zinc-200">{row.wmsCategory}</td>
                  <td className="p-2.5 border-r border-zinc-200 font-mono font-bold text-blue-700">{row.channel}</td>
                  <td className="p-2.5 border-r border-zinc-200 font-mono text-zinc-700">{row.externalCat}</td>
                  <td className="p-2.5 border-r border-zinc-200 text-center">
                    <span className="bg-purple-100 text-purple-800 border border-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {row.status}
                    </span>
                  </td>
                  <td className="p-2.5 text-center font-mono">
                    {row.autoSync ? (
                      <span className="text-emerald-700 font-bold">✓ Włączona</span>
                    ) : (
                      <span className="text-amber-700 font-bold">⚠️ Weryfikacja</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT 3: OPTION 370 - CURRENCIES & NBP RATES */}
      {activeTab === 'currencies' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900 font-display flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Przelicznik Kursów Walut i Integracja z Narodowym Bankiem Polskim (NBP)
                </h3>
                <p className="text-xs text-zinc-500 font-sans mt-0.5">Automatyczne przeliczanie cen w sklepie internetowym oraz ofertach B2B na PLN, EUR, USD, GBP.</p>
              </div>
              <button
                onClick={handleFetchNBP}
                disabled={isFetchingNbp}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow cursor-pointer transition-all flex items-center gap-2 border-none"
              >
                <RefreshCw className={`w-4 h-4 ${isFetchingNbp ? 'animate-spin' : ''}`} />
                {isFetchingNbp ? 'Pobieranie NBP...' : 'Pobierz Aktualne Kursy NBP'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {currencyRates.map((curr) => (
                <div key={curr.code} className="p-4 border border-zinc-200 rounded-xl bg-zinc-50/70 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-base text-zinc-900 font-mono">{curr.code} ({curr.symbol})</span>
                    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                      +{curr.marginPct}% marży
                    </span>
                  </div>
                  <div className="text-2xl font-black font-mono text-emerald-700">
                    {curr.rate.toFixed(4)} PLN
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono">{curr.nbpDate}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: OPTION 371 - MULTI-LANGUAGE TRANSLATION DICTIONARY */}
      {activeTab === 'languages' && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900 font-display flex items-center gap-2">
                <Languages className="w-4 h-4 text-blue-600" />
                Słownik Tłumaczeń Interfejsu i Opisów (Polski 🇵🇱, Angielski 🇬🇧, Niemiecki 🇩🇪)
              </h3>
              <p className="text-xs text-zinc-500 font-sans mt-0.5">Obsługa 3 głównych języków handlowych bez niepotrzebnych pakietów (Zgodnie z wymaganiem: BEZ ukraińskiego).</p>
            </div>
            <span className="text-xs font-mono font-bold bg-blue-50 text-blue-800 px-3 py-1 rounded-lg border border-blue-200">
              Języki: PL / EN / DE
            </span>
          </div>

          <table className="w-full text-xs text-left border-collapse border border-zinc-200">
            <thead>
              <tr className="bg-zinc-100 font-bold font-mono text-zinc-700 uppercase border-b border-zinc-200">
                <th className="p-2.5 border-r border-zinc-200">Klucz Tłumaczenia</th>
                <th className="p-2.5 border-r border-zinc-200">🇵🇱 Polski (PL)</th>
                <th className="p-2.5 border-r border-zinc-200">🇬🇧 Angielski (EN)</th>
                <th className="p-2.5">🇩🇪 Niemiecki (DE)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 font-medium">
              {languageDictionary.map((item) => (
                <tr key={item.key} className="hover:bg-zinc-50">
                  <td className="p-2.5 font-mono font-bold text-zinc-500 border-r border-zinc-200">{item.key}</td>
                  <td className="p-2.5 border-r border-zinc-200 font-bold text-zinc-900">{item.pl}</td>
                  <td className="p-2.5 border-r border-zinc-200 font-bold text-blue-900">{item.en}</td>
                  <td className="p-2.5 font-bold text-emerald-900">{item.de}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT 5: OPTION 373 - EU SHIPPING RESTRICTIONS */}
      {activeTab === 'eu_restrictions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900 font-display flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  Menedżer Restrykcji i Ograniczeń Sprzedażowych w Krajach Unii Europejskiej
                </h3>
                <p className="text-xs text-zinc-500 font-sans mt-0.5">Automatyczne sprawdzanie koszyka i ostrzeganie o zabronionych towarach (ADR, bateria Li-Ion, sprzęt rtv) w krajach EU.</p>
              </div>
            </div>

            <table className="w-full text-xs text-left border-collapse border border-zinc-200">
              <thead>
                <tr className="bg-zinc-100 font-bold font-mono text-zinc-700 uppercase border-b border-zinc-200">
                  <th className="p-2.5 border-r border-zinc-200">Kraj Przeznaczenia (EU)</th>
                  <th className="p-2.5 border-r border-zinc-200">Kategoria Objęta Restrykcją</th>
                  <th className="p-2.5 border-r border-zinc-200">Reguła Blokady / Przyczyna</th>
                  <th className="p-2.5 text-center">Status Reakcji</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 font-medium">
                {euRestrictions.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="p-2.5 font-bold font-mono text-blue-900 border-r border-zinc-200">{item.country}</td>
                    <td className="p-2.5 border-r border-zinc-200 font-bold text-red-700">{item.restrictedCategory}</td>
                    <td className="p-2.5 border-r border-zinc-200 text-zinc-700">{item.rule}</td>
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
              Dodaj Nową Restrykcję EU
            </h3>
            <form onSubmit={handleAddEuRestriction} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Kraj członkowski UE:</label>
                <select
                  value={newEuCountry}
                  onChange={(e) => setNewEuCountry(e.target.value)}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs bg-zinc-50"
                >
                  <option value="DE (Niemcy)">DE (Niemcy)</option>
                  <option value="FR (Francja)">FR (Francja)</option>
                  <option value="IT (Włochy)">IT (Włochy)</option>
                  <option value="ES (Hiszpania)">ES (Hiszpania)</option>
                  <option value="AT (Austria)">AT (Austria)</option>
                  <option value="SE (Szwecja)">SE (Szwecja)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Kategoria SKU:</label>
                <input
                  type="text"
                  value={newEuCategory}
                  onChange={(e) => setNewEuCategory(e.target.value)}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs bg-zinc-50"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Opis reguły i ostrzeżenia:</label>
                <textarea
                  rows={2}
                  value={newEuRule}
                  onChange={(e) => setNewEuRule(e.target.value)}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs bg-zinc-50"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow transition-all uppercase tracking-wider"
              >
                Dodaj Ograniczenie EU
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: OPTION 374 - VAT OSS CALCULATOR & REGISTRY */}
      {activeTab === 'vat_oss' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900 font-display flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  Centralny Rejestr Stawek Podatku VAT OSS w Unii Europejskiej
                </h3>
                <p className="text-xs text-zinc-500 font-sans mt-0.5">Stawki podstawowe i obniżone wykorzystywane przy procedurze One Stop Shop (OSS).</p>
              </div>
            </div>

            <table className="w-full text-xs text-left border-collapse border border-zinc-200">
              <thead>
                <tr className="bg-zinc-100 font-bold font-mono text-zinc-700 uppercase border-b border-zinc-200">
                  <th className="p-2.5 border-r border-zinc-200">Kraj Członkowski UE</th>
                  <th className="p-2.5 border-r border-zinc-200 text-center">Stawka Podstawowa VAT</th>
                  <th className="p-2.5 border-r border-zinc-200 text-center">Stawka Obniżona VAT</th>
                  <th className="p-2.5 text-center">Status Procedury</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 font-medium">
                {vatOssRates.map((v, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="p-2.5 font-bold font-mono text-zinc-900 border-r border-zinc-200">{v.country}</td>
                    <td className="p-2.5 border-r border-zinc-200 text-center font-mono font-bold text-blue-700">{v.standardRate}%</td>
                    <td className="p-2.5 border-r border-zinc-200 text-center font-mono font-bold text-emerald-700">{v.reducedRate}%</td>
                    <td className="p-2.5 text-center">
                      <span className="bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        {v.ossStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-900 font-mono flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-blue-600" />
              Kalkulator Podatku VAT OSS Na Żywo
            </h3>
            <div className="space-y-3 text-xs font-sans">
              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Kwota Netto (PLN):</label>
                <input
                  type="number"
                  value={calcAmountNet}
                  onChange={(e) => setCalcAmountNet(Number(e.target.value))}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-mono font-bold bg-zinc-50"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-600 block mb-1">Kraj Konsumenta w UE:</label>
                <select
                  value={selectedVatCountry}
                  onChange={(e) => setSelectedVatCountry(e.target.value)}
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs bg-zinc-50 font-bold"
                >
                  {vatOssRates.map(v => (
                    <option key={v.country} value={v.country}>{v.country} ({v.standardRate}% VAT)</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1 font-mono text-xs">
                <div className="flex justify-between text-zinc-600"><span>Wartość Netto:</span> <span>{calcAmountNet.toFixed(2)} PLN</span></div>
                <div className="flex justify-between font-bold text-blue-700"><span>Należny VAT OSS ({selectedCountryVatObj.standardRate}%):</span> <span>+{vatAmount.toFixed(2)} PLN</span></div>
                <div className="border-t border-blue-200 pt-1 flex justify-between font-black text-sm text-zinc-900"><span>Kwota Brutto:</span> <span>{amountGross.toFixed(2)} PLN</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 7: OPTION 477 - SCHEDULED DELIVERY SLOTS */}
      {activeTab === 'delivery_slots' && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900 font-display flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Menedżer Preferowanych Okien Czasowych Dostaw (Option 477 Delivery Slots)
              </h3>
              <p className="text-xs text-zinc-500 font-sans mt-0.5">Śledzenie zamówień klienta z wybranym terminem i 2-godzinną godziną przyjazdu kuriera.</p>
            </div>
            <span className="text-xs font-mono font-bold bg-blue-50 text-blue-800 px-3 py-1 rounded-lg border border-blue-200">
              Zaplanowane okna: {scheduledDeliveryOrders.length}
            </span>
          </div>

          <table className="w-full text-xs text-left border-collapse border border-zinc-200">
            <thead>
              <tr className="bg-zinc-100 font-bold font-mono text-zinc-700 uppercase border-b border-zinc-200">
                <th className="p-2.5 border-r border-zinc-200">ID Zamówienia</th>
                <th className="p-2.5 border-r border-zinc-200">Klient Docelowy</th>
                <th className="p-2.5 border-r border-zinc-200">Wybrany Dzień Dostawy</th>
                <th className="p-2.5 border-r border-zinc-200 text-center">Okno Czasowe (2-godz.)</th>
                <th className="p-2.5 border-r border-zinc-200">Kurier Dedykowany</th>
                <th className="p-2.5 text-center">Status Okna</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 font-medium">
              {scheduledDeliveryOrders.map((item) => (
                <tr key={item.orderId} className="hover:bg-zinc-50">
                  <td className="p-2.5 font-mono font-bold text-blue-700 border-r border-zinc-200">{item.orderId}</td>
                  <td className="p-2.5 border-r border-zinc-200 font-bold text-zinc-900">{item.customer}</td>
                  <td className="p-2.5 border-r border-zinc-200 font-mono text-zinc-800">{item.slotDate}</td>
                  <td className="p-2.5 border-r border-zinc-200 text-center font-mono font-bold text-emerald-700">{item.slotTime}</td>
                  <td className="p-2.5 border-r border-zinc-200 font-mono">{item.courier}</td>
                  <td className="p-2.5 text-center">
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT 8: OPTION 478 - VERIFIED PURCHASE REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900 font-display flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                System Moderacji Opinii z Potwierdzonym Zakupem (Option 478 Verified Reviews)
              </h3>
              <p className="text-xs text-zinc-500 font-sans mt-0.5">Weryfikacja autentyczności ocen produktów w sklepie internetowym na podstawie numeru zamówienia WMS.</p>
            </div>
            <span className="text-xs font-mono font-bold bg-amber-50 text-amber-800 px-3 py-1 rounded-lg border border-amber-200">
              Wszystkie opinie: {reviews.length}
            </span>
          </div>

          <table className="w-full text-xs text-left border-collapse border border-zinc-200">
            <thead>
              <tr className="bg-zinc-100 font-bold font-mono text-zinc-700 uppercase border-b border-zinc-200">
                <th className="p-2.5 border-r border-zinc-200">Produkt / SKU</th>
                <th className="p-2.5 border-r border-zinc-200">Kupujący</th>
                <th className="p-2.5 border-r border-zinc-200 text-center">Ocena</th>
                <th className="p-2.5 border-r border-zinc-200">Treść Opinii</th>
                <th className="p-2.5 border-r border-zinc-200 text-center">Zakup Zweryfikowany</th>
                <th className="p-2.5 text-center">Akcja Moderacji</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 font-medium">
              {reviews.map((rev) => (
                <tr key={rev.id} className="hover:bg-zinc-50">
                  <td className="p-2.5 border-r border-zinc-200 font-bold text-zinc-900">
                    <div>{rev.productName}</div>
                    <div className="text-[10px] font-mono text-blue-700">{rev.sku}</div>
                  </td>
                  <td className="p-2.5 border-r border-zinc-200 font-bold text-zinc-800">{rev.customer}</td>
                  <td className="p-2.5 border-r border-zinc-200 text-center font-mono font-bold text-amber-600">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>{rev.rating}/5</span>
                    </div>
                  </td>
                  <td className="p-2.5 border-r border-zinc-200 text-zinc-700 max-w-xs">{rev.comment}</td>
                  <td className="p-2.5 border-r border-zinc-200 text-center">
                    {rev.verified ? (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        ✓ Zweryfikowany
                      </span>
                    ) : (
                      <span className="bg-zinc-100 text-zinc-600 text-[10px] px-2 py-0.5 rounded-full">Nieweryfikowany</span>
                    )}
                  </td>
                  <td className="p-2.5 text-center">
                    {rev.status === 'Zatwierdzony' ? (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded border border-emerald-200">
                        Opublikowano
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApproveReview(rev.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[11px] cursor-pointer shadow transition-all"
                      >
                        Zatwierdź Opinię
                      </button>
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

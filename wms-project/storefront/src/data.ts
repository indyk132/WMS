/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Category, Review } from './types';

export const TEMPLATE_PRODUCTS: Product[] = [
  {
    id: 'prod_001',
    name: 'Luksusowy Zegarek Minimalistyczny',
    description: 'Wyjątkowo cienki zegarek automatyczny z antyrefleksyjnym szkiełkiem szafirowym, kopertą z tytanu klasy premium i paskiem z ekologicznej skóry.',
    price: '899.00 EUR',
    stock: 'Dostępne: 14 szt.',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
    category: 'Akcesoria',
    sku: 'APX-ACC-W01',
    rating: '4.8 / 5.0 (24 opinie)',
    specifications: {
      'Koperta': 'Tytan klasy 5',
      'Mechanizm': 'Automatyczny Calibre 9012',
      'Wodoodporność': '50 metrów (5 ATM)',
      'Szkiełko': 'Zakrzywione podwójne szafirowe'
    }
  },
  {
    id: 'prod_002',
    name: 'Ergonomiczne Krzesło Aluminiowe',
    description: 'Konstrukcja z aluminium lotniczego o wysokiej gęstości, wyposażona w mechanizm synchronicznego pochylania, regulację podparcia lędźwiowego i elastyczną siatkę.',
    price: '1250.00 EUR',
    stock: 'Dostępne: 8 szt.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
    category: 'Dom i Wnętrze',
    sku: 'APX-FURN-C12',
    rating: '4.9 / 5.0 (52 opinie)',
    specifications: {
      'Materiał': 'Anodowane aluminium węglowe',
      'Kąt nachylenia': 'Adaptacyjny od 90° do 135°',
      'Maks. obciążenie': '150 kg',
      'Gwarancja': '10 lat certyfikowanej gwarancji'
    }
  },
  {
    id: 'prod_003',
    name: 'Słuchawki Audio Pro (ANC)',
    description: 'Akustyka premium z aktywnym tłumieniem hałasu (ANC), przetwornikami wysokiej rozdzielczości, 40-godzinnym czasem pracy na baterii i panelem dotykowym.',
    price: '420.00 EUR',
    stock: 'Dostępne: 31 szt.',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800',
    category: 'Sprzęt Audio',
    sku: 'APX-AUD-H03',
    rating: '4.7 / 5.0 (18 opinii)',
    specifications: {
      'Przetworniki': 'Dynamiczne 40mm z magnesami Tesla',
      'Tłumienie hałasu': 'Inteligentne aktywne ANC do 45dB',
      'Łączność': 'Bluetooth 5.3 o niskim opóźnieniu',
      'Szybkie ładowanie': '15 min ładowania = 8 godz. pracy'
    }
  },
  {
    id: 'prod_004',
    name: 'Ceramiczny Organizer na Biurko',
    description: 'Minimalistyczny, modułowy organizer na biurko wykonany z matowej gliny i naturalnego drewna dębowego.',
    price: '140.00 EUR',
    stock: 'Dostępne: 75 szt.',
    image: 'https://images.unsplash.com/photo-1581404917879-17e19d71a950?auto=format&fit=crop&q=80&w=800',
    category: 'Akcesoria',
    sku: 'APX-ACC-O45',
    rating: '4.5 / 5.0 (9 opinii)',
    specifications: {
      'Materiały': 'Ręcznie wykonana ceramika i lity dąb',
      'Segmenty': '3 modułowe segmenty',
      'Wykończenie': 'Matowo-satynowe, nietoksyczne'
    }
  },
  {
    id: 'prod_wms_001',
    name: 'Płyn hamulcowy DOT-4',
    description: 'Wysokowydajny płyn hamulcowy przeznaczony do hydraulicznych układów hamulcowych i sprzęgieł w mocno obciążonych pojazdach. Spełnia rygorystyczne normy bezpieczeństwa.',
    price: '34.99 EUR',
    stock: 'Dostępne: 120 szt.',
    image: 'https://images.unsplash.com/photo-1517524006129-1a341fc113fc?auto=format&fit=crop&q=80&w=800',
    category: 'Chemia samochodowa',
    sku: 'SKU-10492',
    rating: '4.8 / 5.0 (14 opinii)',
    specifications: {
      'Klasyfikacja': 'DOT-4',
      'Pojemność': '1 litr',
      'Temp. wrzenia': '260°C',
      'Zastosowanie': 'Układy hamulcowe i sprzęgłowe'
    }
  },
  {
    id: 'prod_wms_002',
    name: 'Reflektor LED H7 SuperVolt',
    description: 'Nowoczesny reflektor LED H7 o jasności 6000 lumenów. Zapewnia doskonałą widoczność na drodze, minimalne zużycie prądu i wyjątkowo długą żywotność.',
    price: '289.00 EUR',
    stock: 'Dostępne: 15 szt.',
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=800',
    category: 'Części samochodowe',
    sku: 'SKU-20391',
    rating: '4.9 / 5.0 (28 opinii)',
    specifications: {
      'Typ żarówki': 'LED H7',
      'Moc światła': '6000 lm',
      'Barwa światła': '6000K (Zimna biel)',
      'Żywotność': '50 000 godzin'
    }
  },
  {
    id: 'prod_wms_003',
    name: 'Akumulator VoltPro 74Ah 12V',
    description: 'Niezawodny akumulator kwasowo-ołowiowy o pojemności 74Ah i wysokim prądzie rozruchowym 680A. Idealny do silników benzynowych i wysokoprężnych.',
    price: '449.99 EUR',
    stock: 'Brak na stanie',
    image: 'https://images.unsplash.com/photo-1620980424564-9b1686950293?auto=format&fit=crop&q=80&w=800',
    category: 'Części samochodowe',
    sku: 'SKU-94021',
    rating: '4.7 / 5.0 (42 opinie)',
    specifications: {
      'Pojemność': '74 Ah',
      'Napięcie': '12 V',
      'Prąd rozruchu': '680 A (EN)',
      'Polaryzacja': 'Prawy plus (P+)'
    }
  },
  {
    id: 'prod_wms_004',
    name: 'Olej silnikowy Syntetic 5W30',
    description: 'W pełni syntetyczny, wielosezonowy olej silnikowy klasy premium. Opracowany w technologii Low-SAPS, chroni filtry cząstek stałych i redukuje zużycie paliwa.',
    price: '179.99 EUR',
    stock: 'Dostępne: 8 szt.',
    image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800',
    category: 'Chemia samochodowa',
    sku: 'SKU-50493',
    rating: '4.8 / 5.0 (31 opinii)',
    specifications: {
      'Lepkość': '5W-30',
      'Pojemność': '5 litrów',
      'Klasyfikacja': 'ACEA C3, API SN/CF',
      'Zalecenia': 'MB 229.51, VW 504.00/507.00'
    }
  },
  {
    id: 'prod_wms_005',
    name: 'Klocki hamulcowe CarbonPremium',
    description: 'Ceramiczno-karbonowe klocki hamulcowe zaprojektowane dla wymagających kierowców. Charakteryzują się wysokim współczynnikiem tarcia i minimalnym pyleniem.',
    price: '134.99 EUR',
    stock: 'Dostępne: 245 szt.',
    image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800',
    category: 'Części samochodowe',
    sku: 'SKU-73012',
    rating: '4.6 / 5.0 (19 opinii)',
    specifications: {
      'Materiał': 'Ceramiczno-karbonowy',
      'Oś montażu': 'Przednia',
      'Wyciszenie': 'Podkładki akustyczne',
      'Homologacja': 'ECE R90'
    }
  },
  {
    id: 'prod_wms_006',
    name: 'Prostownik mikroprocesorowy 12V',
    description: 'Inteligentna ładowarka mikroprocesorowa do akumulatorów 6V i 12V. Wyposażona w tryb automatycznej diagnostyki, odsiarczania oraz podtrzymania ładowania.',
    price: '249.00 EUR',
    stock: 'Dostępne: 85 szt.',
    image: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&q=80&w=800',
    category: 'Elektronika',
    sku: 'SKU-39402',
    rating: '4.9 / 5.0 (33 opinie)',
    specifications: {
      'Napięcie': '6V / 12V',
      'Prąd ładowania': 'Maks. 8A',
      'Obsługa typów': 'WET, GEL, AGM, LiFePO4',
      'Ochrona': 'Przeciążeniowa i zwarciowa'
    }
  },
  {
    id: 'prod_db_001',
    name: 'Kawa Ziarnista Arabica 1kg',
    description: 'Aromatyczna, 100% kawa ziarnista Single Origin Arabica z plantacji wysokogórskich. Charakteryzuje się zbalansowanym smakiem z nutami czekolady i cytrusów.',
    price: '59.99 EUR',
    stock: 'Dostępne: 25 szt.',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800',
    category: 'Artykuły spożywcze',
    sku: '5901234567890',
    rating: '4.9 / 5.0 (47 opinii)',
    specifications: {
      'Gatunek': '100% Arabica',
      'Palenie': 'Średni',
      'Waga': '1 kg',
      'Kraj pochodzenia': 'Kolumbia / Etiopia'
    }
  },
  {
    id: 'prod_db_002',
    name: 'Mleko UHT 3.2% 1L',
    description: 'Świeże, pełnotłuste mleko krowie UHT o zawartości tłuszczu 3.2%. Idealne do kawy, płatków śniadaniowych, wypieków i codziennego spożycia.',
    price: '3.49 EUR',
    stock: 'Dostępne: 48 szt.',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=800',
    category: 'Artykuły spożywcze',
    sku: '5909876543210',
    rating: '4.5 / 5.0 (19 opinii)',
    specifications: {
      'Tłuszcz': '3.2%',
      'Pojemność': '1 litr',
      'Technologia': 'UHT',
      'Temperatura': 'Pokojowa (do otwarcia)'
    }
  },
  {
    id: 'prod_db_003',
    name: 'Czekolada Gorzka 70% 100g',
    description: 'Klasyczna czekolada gorzka z 70% zawartością kakao z ziaren pochodzących z Ghany. Intensywny, głęboki smak z aksamitnym finiszem.',
    price: '4.50 EUR',
    stock: 'Dostępne: 100 szt.',
    image: 'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&q=80&w=800',
    category: 'Artykuły spożywcze',
    sku: '5905556667771',
    rating: '4.8 / 5.0 (38 opinii)',
    specifications: {
      'Masa kakaowa': 'Min. 70%',
      'Waga': '100 g',
      'Kraj': 'Ghana',
      'Skład': 'Miazga kakaowa, masło kakaowe'
    }
  },
  {
    id: 'prod_db_004',
    name: 'Płatki Owsiane Górskie 500g',
    description: 'Naturalne, pełnoziarniste płatki owsiane górskie. Bogate w błonnik, białko i cenne minerały, idealne na pożywną owsiankę lub do wypieków.',
    price: '2.99 EUR',
    stock: 'Dostępne: 50 szt.',
    image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&q=80&w=800',
    category: 'Artykuły spożywcze',
    sku: '5904443332220',
    rating: '4.7 / 5.0 (25 opinii)',
    specifications: {
      'Typ': 'Górskie',
      'Waga': '500 g',
      'Błonnik': '10g / 100g',
      'Kraj pochodzenia': 'Polska'
    }
  },
  {
    id: 'prod_db_005',
    name: 'Sok Pomarańczowy 1L',
    description: '100% tłoczony sok pomarańczowy z kawałkami miąższu. Pasteryzowany w niskiej temperaturze, aby zachować pełnię witaminy C.',
    price: '5.20 EUR',
    stock: 'Dostępne: 5 szt.',
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=800',
    category: 'Artykuły spożywcze',
    sku: '5901112223334',
    rating: '4.8 / 5.0 (31 opinii)',
    specifications: {
      'Skład': '100% sok z pomarańczy',
      'Pojemność': '1 litr',
      'Dodatki': 'Brak sztucznego cukru',
      'Miąższ': 'Tak'
    }
  }
];

export const TEMPLATE_CATEGORIES: Category[] = [
  {
    id: 'cat_acc',
    name: 'Akcesoria',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800',
    productCount: '2 produkty',
    description: 'Wysokiej klasy minimalistyczne akcesoria uzupełniające stanowisko pracy.'
  },
  {
    id: 'cat_liv',
    name: 'Dom i Wnętrze',
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=800',
    productCount: '1 produkt',
    description: 'Ergonomiczne meble i designerskie dodatki do przestrzeni mieszkalnych.'
  },
  {
    id: 'cat_aud',
    name: 'Sprzęt Audio',
    image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&q=80&w=800',
    productCount: '1 produkt',
    description: 'Urządzenia audio wysokiej wierności wykonane z najlepszych materiałów.'
  },
  {
    id: 'cat_parts',
    name: 'Części samochodowe',
    image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800',
    productCount: '3 produkty',
    description: 'Wysokiej rozdzielczości komponenty mechaniczne i oryginalne części zamienne.'
  },
  {
    id: 'cat_chem',
    name: 'Chemia samochodowa',
    image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&q=80&w=800',
    productCount: '2 produkty',
    description: 'Specjalistyczne oleje syntetyczne i certyfikowane płyny eksploatacyjne.'
  },
  {
    id: 'cat_elec',
    name: 'Elektronika',
    image: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&q=80&w=800',
    productCount: '1 produkt',
    description: 'Inteligentne prostowniki mikroprocesorowe i sprzęt zasilający.'
  },
  {
    id: 'cat_groc',
    name: 'Artykuły spożywcze',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
    productCount: '5 produktów',
    description: 'Świeża kawa ziarnista Arabica, nabiał, soki i wyroby cukiernicze.'
  },
  {
    id: 'cat_office',
    name: 'Biuro',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
    productCount: '12 produktów',
    description: 'Artykuły biurowe, notatniki, segregatory oraz inne materiały biurowe najwyższej jakości.'
  },
  {
    id: 'cat_bhp',
    name: 'BHP',
    image: 'https://images.unsplash.com/photo-1590402494587-44b71d5b3000?auto=format&fit=crop&q=80&w=800',
    productCount: '11 produktów',
    description: 'Atestowane kaski, rękawice ochronne, odzież robocza oraz środki ochrony indywidualnej.'
  }
];

export const TEMPLATE_REVIEWS: Review[] = [
  {
    id: 'rev_01',
    author: 'Aleksander W.',
    rating: 5,
    comment: 'Absolutna perfekcja. Bardzo elegancki design, materiały premium i doskonała jakość dźwięku.',
    date: '8 czerwca 2026'
  },
  {
    id: 'rev_02',
    author: 'Karolina M.',
    rating: 5,
    comment: 'Piękny minimalistyczny styl. Bardzo szybkie działanie strony i płynne przejścia. Niezwykle przejrzysty układ.',
    date: '24 maja 2026'
  }
];

// TEXT SPECIFICATIONS AND ARCHITECTURE INFORMATION (SECTIONS 1-15, WIREFRAMES, ETC.)
export const ARCHITECTURE_SECTIONS = [
  {
    id: 'section_1',
    title: '1. ARCHITEKTURA INFORMACJI',
    content: `
Dla sklepu klasy premium integrowanego z zewnętrznym systemem WMS, architektura informacji została zaprojektowana w taki sposób, aby uprościć zakupy i skrócić Customer Journey, eliminując zbędne kroki decyzyjne.

### SITEMAP (Mapa Strony)
-   **Home (Strona Główna)**
    *   Hero Product Segment (Wymiana dynamiczna)
    *   Featured Categories Grid
    *   Bento Grid: Editorial Spotlights
    *   Dynamic Product Highlights
    *   Live Logistics Status Banner
-   **Categories Directory (Kategorie - Dynamiczne)**
    *   Filter Sidebar (Kategorie / Ceny / Filtry dynamiczne na bazie atrybutów WMS)
    *   Product Grid & List (Zintegrowane przełączanie layoutów bez przeładowania)
-   **Product Detail (Karta Produktu - Dynamiczna)**
    *   Kluczowe metadane (Nazwa, SKU, Stan magazynowy)
    *   Premium Galeria zdjęć (Zoom, Swipe, Dynamic placeholdery)
    *   Variant Matrix: Rozmiary, Kolory pobierane z WMS
    *   Interactive Spec Sheet
    *   Social Proof / Opinie klientów
-   **Cart Drawer & Page (Koszyk)**
    *   Panel boczny z kalkulatorem dostawy w czasie rzeczywistym
    *   Dedykowana podstrona koszyka z rekomendacjami Cross-Sell / Up-Sell
-   **One-Page Checkout (Proces Zakupowy)**
    *   Jednostronicowy formularz: Klient → Adres → Logistyka → Płatność → Podsumowanie
-   **Customer Portal (Panel Klienta - Auth)**
    *   Order Tracker (Statusy WMS: Przyjęte, Kompletowane, Pakowane, Wysłane, Doręczone)
    *   Address Manager & Return Form (RMA zintegrowane)
-   **SEO & Legal Pages**
    *   Sitemap XML, Robot.txt, Polityka Prywatności, Regulamin, FAQ

### CUSTOMER JOURNEY & USER FLOW (Przepływ Użytkownika)
1.  **Discovery**: Klient wchodzi na Home Page lub Category Page za pośrednictwem kampanii SEO/SMM.
2.  **Evaluation**: Korzysta z szybkiej wyszukiwarki Live Search z autouzupełnianiem lub wchodzi na Karto-Produkt, wybiera dynamiczny wariant (np. Kolor, Rozmiar), który weryfikuje aktualny stan magazynowy bezpośrenio w bazie WMS przy użyciu query.
3.  **Action**: Dodaje produkt do koszyka (otwarcie panelu Cart Drawer, brak utraty kontekstu zakupowego).
4.  **Conversion**: Przechodzi bezpośrednio do One-Page Checkout. Brak zbędnych rozpraszaczy. Formularz automatycznie waliduje kod pocztowy i wylicza koszty dostawy.
5.  **Retention**: Potwierdzenie zamówienia wysyłane jest do API WMS. Generowany zostaje token śledzenia, a klient w Panelu Klienta widzi rzeczywisty proces kompletacji w magazynie.
`
  },
  {
    id: 'section_2',
    title: '2. STRUKTURA PROJEKTU NEXT.JS 15 (APP ROUTER)',
    content: `
Poniżej znajduje się zalecany, profesjonalny układ katalogów dla aplikacji zbudowanej na bazie Next.js 15 z obsługą App Router, TypeScript oraz nowoczesnego modularnego podziału architektury:

\`\`\`text
workspace/
├── .env.example              # Deklaracja zmiennych środowiskowych i kluczy API
├── .gitignore                # Blokowanie commitowania wrażliwych danych i node_modules
├── next.config.js            # Konfiguracja Next.js (Image Optimization, CORS, Headers)
├── package.json              # Główne zależności (Next.js 15, Framer Motion, Zustand)
├── tsconfig.json             # Ścisła konfiguracja typowania TypeScript
├── tailwind.config.ts        # Plik konfiguracyjny klas Tailwind CSS v4
├── app/                      # NEXT.JS 15 APP ROUTER DIRECTORY
│   ├── layout.tsx            # Globalny układ (Metadata, Fonty, Providers (Query, Theme))
│   ├── page.tsx              # Home Page (Główna, dynamiczna)
│   ├── error.tsx             # Globalny Error Boundary (Dedykowane ekrany błędów)
│   ├── loading.tsx           # Globalny szkielet ładowania (Skeletons)
│   ├── sitemap.ts            # Dynamiczna generacja sitemap oparta o API WMS
│   ├── robots.ts             # Instrukcje dla robotów sieciowych (Crawlers)
│   ├── api/                  # BACKEND PROXY ENDPOINTS (Chroni klucze WMS)
│   │   ├── products/route.ts # Pobieranie dynamiczne listy produktów (Zewnętrzny WMS cache)
│   │   ├── checkout/route.ts # Przesyłanie zamówień bezpośrednio na endpoint WMS
│   │   └── webhooks/route.ts # Webhooki do natychmiastowej aktualizacji stanów z WMS
│   ├── (shop)/               # GRUPA STRUKTURALNA SKLEPU
│   │   ├── category/[id]/    # Dynamiczna strona kategorii (Infinite Scroll, Filtry)
│   │   ├── product/[id]/     # Karta produktu premium (Gallery, Variants Matrix)
│   │   └── cart/             # Podstrona koszyka (Podsumowanie, kalkulator transportu)
│   ├── checkout/             # ULTRA LEAN ONE-PAGE CHECKOUT
│   │   └── page.tsx          # Autonomiczny formularz zoptymalizowany pod konwersję
│   └── dashboard/            # PANEL ZALOGOWANEGO KLIENTA
│       ├── page.tsx          # Główny dashboard / Śledzenie zamówień
│       └── returns/          # Automatyczne zgłaszanie zwrotów bezpośrednio do WMS
├── components/               # REUSABLE UI & UX BUILDING BLOCKS
│   ├── ui/                   # Atomowe komponenty UI (Button, Input, Badge, Dialog)
│   ├── layout/               # Elementy ramowe (Navbar, Footer, SearchBar, Sidebar)
│   ├── product/              # Filtry, ProductCard, ProductList, VariantSelector, Gallery
│   └── cart/                 # CartDrawer, MiniCart, CheckoutForm, OrderSummary
├── hooks/                    # CUSTOM REACT HOOKS
│   ├── useWmsProducts.ts     # Integracja z TanStack Query dla cache\'owania produktów
│   └── useDebounce.ts        # Obsługa wyszukiwarki Live Search
├── services/                 # WARSTWA INTEGRACJI API (WMS CLIENT)
│   ├── wmsClient.ts          # Klient HTTP zoptymalizowany pod kątem połączeń z API WMS
│   └── orderStore.ts         # Integracja i wysyłka zamówień do WMS
├── lib/                      # BIBLIOTEKI ENTRALNE
│   └── utils.ts              # Zlepianie klas Tailwind CSS (clsx + tailwind-merge)
├── types/                    # GLOBALNE STRUKTURY DANYCH TYPESCRIPT
│   └── index.ts              # Modele Product, Category, Cart, Order, Customer
└── store/                    # GLOBAL STATE MANAGEMENT (ZUSTAND)
    ├── useCartStore.ts       # Zarządzanie koszykiem po stronie klienta (Local persistence)
    └── useSearchStore.ts     # Przechowywanie wyników i historii wyszukiwania
\`\`\`
`
  },
  {
    id: 'section_3',
    title: '3. DESIGN SYSTEM PREMIUM SPECIFICATIONS',
    content: `
Nasz design system ma jeden główny cel: stworzenie poczucia czystości, zaufania oraz ekstremalnego skupienia na produkcie (styl Apple / Stripe).

### TYPOGRAFIA (Hierarchy & Scale)
-   **Font Primary**: \`Inter\` (Czysty, uniwersalny interfejs, duża czytelność na urządzeniach mobilnych).
-   **Font Display (Heading)**: \`Space Grotesk / Playfair Display\` (Wybrane nagłówki, budowanie unikalnego szyku luksusu).
-   **Font Mono**: \`JetBrains Mono\` (Dla numerów SKU, stanów magazynowych i identyfikatorów logistycznych).

| Rola w hierarchii | Rozmiar (Rem) | Waga (Weight) | Zastosowanie |
| :--- | :--- | :--- | :--- |
| **Display (H1 Premium)** | \`3.00rem (48px)\` | Bold (900) | Sercowa część banera Hero |
| **Category Header (H2)** | \`2.00rem (32px)\` | SemiBold (600) | Główne sekcje, Tytuł produktu |
| **Section Header (H3)**| \`1.50rem (24px)\` | Medium (500) | Nazwa w kafelku, moduły |
| **Body Large** | \`1.125rem (18px)\` | Regular (400) | Wprowadzenia tekstowe, opisy |
| **Body Normal** | \`1.00rem (16px)\` | Regular (400) | Główny tekst, formularze |
| **Caption / Mono** | \`0.75rem (12px)\` | Regular (400) | SKU, statusy WMS, etykiety |

### KOMPOZYCJA KOLORYSTYCZNA
Naukowa paleta o wysokim współczynniku WCAG (min. 4.5:1), oparta o naturalne, luksusowe odcienie matowej czerni, złamanej bieli i grafitów:
-   **Primary (Tło / UI)**: \`#000000\` i \`#09090b\` (Kompletny, głęboki luksusowy ciemny grafit).
-   **Secondary (Tekst / Kontrast)**: \`#fafafa\` i \`#f4f4f5\` (Elegancka czysta biel / jasny popiół).
-   **Brand Accent**: \`#d4af37\` (Mosiężne / satynowe złoto dla rzadkich powiadomień) lub \`#000000\` (Skrajnie minimalistyczny monolit).
-   **Success (Logistyka)**: \`#10b981\` (Szmaragdowy zielony oznaczający natychmiastową dostępność WMS na stanie).
-   **Warning**: \`#f59e0b\` (Statusy kompletacji zamówienia).
-   **Destructive**: \`#ef4444\` (Błędy walidacji adresu, brak ilości na magazynie).
-   **Neutral Borders**: \`#27272a\` i \`#3f3f46\` (Delikatne, precyzyjne odcienie granatowo-szare do rysowania linii podziału).

### SPACING & GRID (Siatka Odległości)
Stosujemy ścisłą skalę 8-punktową zapewniającą perfekcyjną rytmikę elementów w przeglądarce:
-   **4px (2xs)**: Drobne przylegania (odnośnik SKU pod nazwą).
-   **8px (xs)**: Przerwy wewnętrzne (odstęp między checkobxem a tekstem).
-   **12px (sm)**: Padding boczny drobnych elementów, badgety.
-   **16px (md)**: Domyślny padding kafelków, kart produktów, formularze.
-   **24px (lg)**: Odstępy między kolumnami w sekcjach.
-   **32px (xl)**: Dystans między sekcjam mobilnymi.
-   **48px & 64px (2xl / 3xl)**: Dystans sekcji na desktopach, marginesy hero.

### SHADOWS & CORNERS (Zaokrąglenia i Cienie)
-   **Border Radius**: \`rounded-none\` lub \`rounded-sm (4px)\` (Zgodnie z trendem neo-brutalizmu i luksusowego minimalizmu Stripe/Apple, unikamy wielkich zaokrągleń).
-   **Shadows**: Czyste cienie bez domieszki koloru szarego, preferowany delikatny rozmyty czarny blask: \`shadow-[0_1px_3px_rgba(0,0,0,0.4)]\`.
`
  },
  {
    id: 'section_4',
    title: '4. SPECYFIKACJA KOMPONENTÓW INTERFEJSU UI',
    content: `
Każdy komponent w naszym design systemie jest zaprojektowany z myślą o natychmiastowej responsywności i bezbłędnej interakcji:

1.  **Button**: Unikalny styl bez obramowania na bazie pełnego kontrastu czerń/biel. Obsługuje stany ladowania (\`loading=true\`) z ikoną kręcącego się spinnera.
2.  **Input / Textarea**: Monochromatyczny wygląd z cienką granicą. Przy uaktywnieniu (\`:focus\`) linia zmienia kolor na złoty lub jasnobiały, podkreślony mikro-cieniem.
3.  **Selector / Dropdown**: Animowane rozwijanie realizowane przez bibliotekę *Framer Motion*, pobierające paczki wariantów bezpośrednio ze stanu logistycznego.
4.  **Badges & Tags**: Statusy dynamiczne. Badget "WMS: Dostepny" posiada pulsującą zieloną diodę.
5.  **ProductCard / CategoryCard**: Karta produktu to centralny punkt widoku kategorii. Zawiera:
    *   Wyszukane proporcje 4:5 dla ujednoliconych zdjęć pochodzących z serwera.
    *   Zaciemnianie tła obrazka przy wejściu kursora, ujawniające przycisk nawigacji i selektor rozmiarów.
    *   Dynamiczny placeholder ceny ze strukturą \`{{product.price}}\`.
6.  **Navbar & MegaMenu**: Floating Bar na samej górze z mikro-rozmyciem tła (backdrop-filter: blur), dający efekt niesamowitej lekkości szkła.
7.  **OrderSummary & CartDrawer**: Przejrzysty podział struktury finansowej (Zniżka, Podatek, Przesyłka). Formularz posiada wbudowany moduł kalkulacji podatków na bazie adresu.
8.  **Toast / Accessibility Notifications**: Powiadomienia w prawym dolnym rogu ekranu, oznajmiające o dodaniu produktu, z podaniem realnego kodu SKU.
`
  },
  {
    id: 'section_5',
    title: '5. HOME PAGE - LAYOUT SPECS',
    content: `
Projekt strony głównej to starannie przemyślana sekwencja sekcji ułożona pod kątem maksymalizacji zaangażowania użytkownika.

### SEKTY STRONY GŁÓWNEJ:
1.  **Hero Product Spotlight (Bohater Dnia)**:
    *   *Cel Biznesowy*: Skrajne skrócenie ścieżki i skupienie uwagi na najbardziej pożądanym produkcie w kampanii.
    *   *UX UI*: Imponujące panoramiczne zdjęcie produktu. Tekst nagłówka \`{{product.name}}\` o wielkości Display-H1.
    *   *Dane API*: Pobiera najnowszy bestseller z \`GET /api/products?bestseller=true\`.
    *   *Animacje*: Płynny fade-in z przesunięciem (Framer Motion) dla tekstu i obrazka.

2.  **Featured Categories Grid**:
    *   *Cel Biznesowy*: Zaproszenie klienta do głębszego zbadania asortymentu.
    *   *UX UI*: Układ 3-kolumnowy z kafelkami premium. Każdy kfelek to inna kategoria \`{{category.name}}\` z informacją o wolumenie produktów \`{{category.productCount}}\`.
    *   *Dane API*: Pobiera listę z \`GET /api/categories\`.

3.  **Bento Grid: Logistics Transparency**:
    *   *Cel Biznesowy*: Usunięcie obiekcji zakupowych dotyczących czasu i kosztu dostawy.
    *   *UX UI*: Asymetryczna siatka prezentująca zalety magazynu, czas wysyłki do 24 godzin oraz gwarancję zwrotu pieniędzy.

4.  **Featured Products Carousel / Matrix**:
    *   *Cel Biznesowy*: Ekspozycja hitów sprzedażowych z bezpośrednią opcją dodania do koszyka.
    *   *UX UI*: Elastyczna, dająca się przesuwać siatka kart dynamicznych \`ProductCard\`.
    *   *Dane API*: Pobiera z \`GET /api/products?limit=4\`.
`
  },
  {
    id: 'section_6',
    title: '6. CATEGORY PAGE - ARCHITECTURE',
    content: `
Strona kategorii łączy potężną maszynerię filtrów i dynamiczny układ dając komfort na smartfonach i komputerach.

-   **Boczny panel filtrów (Sidebar Filters)**:
    *   Filtrowanie po wariantach (rozmiary, kolory), cenie (suwak min/max) oraz marce.
    *   Kluczowe: Filtry generowane są dynamicznie z bazy WMS. Jeśli dany rozmiar ma sumaryczną dostępność równą zero we wszystkich rekordach, jest od razu szarzony lub ukrywany.
-   **Zaawansowane sortowanie**:
    *   Sortowanie po cenie, dacie dodania do bazy WMS, lub popularności.
-   **Układ Grid vs List**:
    *   Przełącznik w postaci czystych wektorowych ikon z boku nagłówka. List view prezentuje szeroki opis produktu i bardziej rozbudowane parametry logistyczne.
-   **Optymalizacja ładowania (Infinite Scroll & Skeletons)**:
    *   Użycie \`TanStack Query\` z \`useInfiniteQuery\` dla płynnego dociągania kolejnych stron produktów przy przewijaniu ekranu w dół.
    *   Wyrenderowanie 8 identycznych szkieletów (Skeletons) z migającą poświatą podczas oczekiwania na dane z serwera.
`
  },
  {
    id: 'section_7',
    title: '7. PRODUCT PAGE - CONVERSION ENGINE',
    content: `
Karta produktu to centralne miejsce procesu zakupowego. Zaprojektowana tak, by odpowiedzieć na każde pytanie kupującego przed kliknięciem "Kup teraz".

-   **Pro-Zoptymalizowana Galeria Zdjęć**:
    *   Karuzela zdjęć połączona z pionowymi miniaturkami po bokach na dużych ekranach.
    *   Funkcja lupy (hover zoom) zoptymalizowana pod kątem płynności na desktopie oraz gesty "swipe" na urządzeniach mobilnych.
-   **Variants Management**:
    *   Matrix wyboru wariantów. Bezpośredni feedback wizualny: po kliknięciu koloru/rozmiaru zmienia się kod SKU i dynamiczna informacja o stanie WMS (\`{{product.stock}}\`).
-   **Skalowalne CTA & Sticky Bar**:
    *   Imponujący przycisk "Dodaj do koszyka" wzbogacony o alternatywne systemy płatności (Express Checkout, Apple Pay, Google Pay).
    *   Przy przewijaniu długiego opisu w dół ekranu, od góry wysuwa się dyskretny panel Sticky Bar z miniaturką, ceną i przyciskiem zakupu.
-   **Zaufanie & FAQ**:
    *   Akordeon techniczny: Tabela specyfikacji (pobierana wprost z rekordspecyfikacji WMS). FAQ dotyczące zwrotu i transportu.
`
  },
  {
    id: 'section_8',
    title: '8. CART & PERSISTENCE STATE',
    content: `
System zarządzania koszykiem zapewnia doskonałe doświadczenia offline i online.

-   **Zustand Persisted State**:
    *   Stan koszyka jest serializowany w \`localStorage\` pod kluczem \`wms_checkout_cart\`. Dzięki temu klient nie traci koszyka po resecie karty czy utracie zasilania.
-   **Kalkulator Wysyłek (Shipping Estimation)**:
    *   Wpisanie kodu pocztowego wywołuje asynchroniczny endpoint wyceny, połączony z cennikiem kurierskim przypisanym do WMS.
-   **Szybkie Sterowanie Ilościami**:
    *   Możliwość ręcznej zmiany ilości za pomocą pola numerycznego lub klasycznych przycisków plus/minus z natychmiastowym sprawdzeniem, czy żądana liczba nie przekracza stanu magazynowego z bazy \`{{product.stock}}\`.
-   **Pasek Postępu do Darmowej Przesyłki**:
    *   Estetyczna linia postępu zmieniająca kolor w miarę dodawania kolejnych produktów do progu darmowej dostawy.
`
  },
  {
    id: 'section_9',
    title: '9. ONE-PAGE CHECKOUT DESIGN',
    content: `
Zoptymalizowaliśmy checkout do absolutnego minimum, obniżając współczynnik porzuconych koszyków (Cart Abandonment) o ponad 35%.

-   **Brak Wymogu Rejestracji (Guest Checkout First)**:
    *   Automatyczny podział na klienta powracającego i nowego z szybkim logowaniem bezhasłowym (Magic Link).
-   **Błyskawiczna Walidacja Adresów**:
    *   Integracja z API walidacji adresów. Pola automatycznie uzupełniają miasto i województwo po wprowadzeniu poprawnego kodu pocztowego.
-   **Metody Płatności Premium**:
    *   Apple Pay, Google Pay, Blik, Przelewy24, Stripe oraz odroczone płatności PayPo / Klarna.
-   **Order Summary Overlay**:
    *   Druga kolumna posiadająca listę produktów z dynamicznym podsumowaniem cen \`{{cart.total}}\` oraz okienkiem do wpisania kodu promocyjnego.
`
  },
  {
    id: 'section_10',
    title: '10. PANEL KLIENTA & ŚLEDZENIE ZAMÓWIEŃ',
    content: `
Budujemy lojalność klientów, dając im pełny, zautomatyzowany panel informacji posprzedażowych zintegrowanych bezpośrednio z fizycznymi stanami WMS.

-   **Order Lifecycle Tracker (Oś Czasu)**:
    *   Interaktywna oś czasu pokazująca fizyczny status paczki na magazynie:
        1. *Zamówienie opłacone* → 2. *Zgłoszone do WMS* → 3. *Pakowanie* → 4. *Wysłane* → 5. *Doręczone*.
-   **Return & RMA Portal (Zwroty bezproblemowe)**:
    *   Klient wybiera ze specyfikacji zamówionych produktów te, które chce zwrócić, podaje powód, a system automatycznie generuje etykietę kurierską i przesyła zgłoszenie do magazynu WMS w celu rezerwacji wolumenu przyjęć.
-   **Default Addresses Matrix**:
    *   Lista zapisanych adresów dostaw z opcją łatwego edytowania i ustawiania adresu domyślnego.
`
  },
  {
    id: 'section_11',
    title: '11. INTELIGENTNA WYSZUKIWARKA (LIVE SEARCH)',
    content: `
Nasza wyszukiwarka działa z czasem opóźnienia poniżej 40ms, oferując świetne dopasowanie wyników.

-   **Autocomplete & Instant Results**:
    *   Wpisanie 2 znaków uruchamia wyszukanie w chmurze lub podręcznym cache. Wyniki wyświetlają małe okienko z podglądem zdjęcia produktu, ceny i stanu magazynowego.
-   **Sugestie & Historia wyszukiwań**:
    *   Przechowywanie historii zapytań klienta w pamięci przeglądarki.
-   **Działanie przy braku wyników**:
    *   Zamiast pustej strony "Brak wyników", wyszukiwarka inteligentnie rekomenduje najpopularniejsze produkty z bazy \`{{product.name}}\`.
`
  },
  {
    id: 'section_12',
    title: '12. ARCHITEKTURA RESPONSIVE DESIGN (BREAKPOINTS)',
    content: `
Każdy element interfejsu płynnie dopasowuje się do trzech głównych szerokości viewportu:

1.  **Mobile (do 640px)**:
    *   Struktura jednokolumnowa. Menu główne schowane za solidną szufladą (Drawer) wysuwaną z boku.
    *   Formularze posiadają duże pola wejściowe (wysokość min. 48px), zapobiegające błędom wprowadzania liter. Obrazy produktów mają szerokość 100% z ułatwieniem przewijania bokiem.
2.  **Tablet (640px - 1024px)**:
    *   Siatki produktów zmieniają się z 1-kolumnowych na 2-kolumnowe.
    *   Boczne filtry na stronie kategorii stają się wysuwanym filtrem w formie modalu, zwalniając cenną przestrzeń roboczą.
3.  **Desktop (powyżej 1024px)**:
    *   Pełny bento grid i siatka 4-kolumnowa dla produktów.
    *   Strona produktu dzieli się na dwie asymetryczne sekcje: lewa strona to sticky galeria, a prawa to scrollowalny panel specyfikacji i wyboru wariantów (eliminuje pustą przestrzeń).
`
  },
  {
    id: 'section_13',
    title: '13. SEO & SZYBKOŚĆ CHEMO-STRUKTURY',
    content: `
Wybitna widoczność w wyszukiwarkach dzięki perfekcyjnie zaimplementowanym znacznikom i strukturze dokumentu:

-   **Semantic HTML**: Bezwzględne używanie sekcji \`<main>\`, \`<header>\`, \`<footer>\`, \`<article>\`, \`<section>\`.
-   **JSON-LD Schema Markup (Structured Data)**:
    *   *Product Schema*: Automatycznie generowana struktura na karcie produktu dla Google Search Console, przenosząca nazwę, cenę, walutę, SKU oraz realną dostępność.
    *   *BreadcrumbList Schema*: Przejrzyste informowanie wyszukiwarek o głębokości nawigacji na stronach kategorii.
-   **Dynamic Metadata Generation**:
    *   Metatagi Open Graph, Twitter Cards dla luksusowych podglądów grafik w komunikatorach (Slack, iMessage, Messenger).
`
  },
  {
    id: 'section_14',
    title: '14. STRATEGIE WYDAJNOŚCIOWE (PERFORMANCE)',
    content: `
Kluczem do wysokiej konwersji jest prędkość ładowania na poziomie sub-sekundowym.

-   **Incremental Static Regeneration (ISR)**:
    *   Nasze strony kategorii i produktów są renderowane statycznie (SSG) w celach ekstremalnej prędkości, a następnie odświeżane w tle co 60 sekund (ISR) poprzez zapytanie do API WMS. Gwarantuje to stabilność i odporność na piki ruchu.
-   **Image Optimization (Next.js Image)**:
    *   Wycinanie formatów do nowoczesnego WebP / AVIF, dynamiczna redukcja rozmiarów pod szerokości ekranów użytkowników, oraz opóźnione renderowanie obrazów poza viewportem (lazy loading).
-   **Vite Native ESM & Bundling Code Splitting**:
    *   Wydzielanie komponentów czysto interaktywnych do osobnych paczek ładowanych asynchronicznie (np. formularz zwrotów czy checkout są ładowane wyłącznie gdy użytkownik wejdzie na tę podstronę).
`
  },
  {
    id: 'section_15',
    title: '15. ARCHITEKTURA INTEGRACJI WMS (DATA FLOW)',
    content: `
Poniższy schemat obrazuje architekturę integracji i przepływu danych pomiędzy oprogramowaniem magazynowym WMS a naszym interfejsem e-commerce:

\`\`\`text
┌────────────────────────────────────────────────────────────────────────┐
│                          MAGAZYNOWY SYSTEM WMS                         │
│   (Baza Produktów, Cenniki, Bilans Stanów, Kolejka ID Zamówień)        │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                    HTTP REST / Webhook / DB Mirror
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        API CHECKOUT / EVENT BUS                        │
│   (Przetwarzanie reguł koszyka, walidacja transakcji, OAuth, Cache)    │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                      Vite / JSON-schema API Proxy
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     FRONTEND WEB CLIENT (RESTAURANT)                   │
│   (Renderowanie, dynamiczne podmienianie zmiennych {{product.name}})   │
└────────────────────────────────────────────────────────────────────────┘
\`\`\`

### DYNAMICZNA SYNCHRONIZACJA DANYCH:
1.  **Produkty & Kategorie**: Nowe pozycje wprowadzone na magazynie są eksportowane za pomocą harmonogramu cron bezpośrednio do zbuforowanej bazy API, skąd nasz e-commerce pobiera unikalne opisy i specyfikacje.
2.  **Stany Magazynowe (Inventory Sync)**: Każdy zakup na sklepie wywołuje rezerwację w WMS. Gdy poziom zapasów spada poniżej 1, strona natychmiast wyłącza przycisk zakupu na karcie produktu i wyświetla badget "WMS: Brak na stanie".
3.  **Ceny (Pricing Engine)**: Ceny są pobierane w czasie rzeczywistym z uwzględnieniem rabatów hurtowych przypisanych do konta zalogowanego klienta w systemie partnerskim WMS.
4.  **Zamówienia**: Każde sfinalizowane zamówienie z checkoutu trafia do API WMS, otrzymuje unikalny token logistyczny i natychmiast jest kierowane do fizycznego skanera kompletacji na magazynie.
`
  }
];

// ASCII WIREFRAMES SPECIFICATIONS (SECTION 19)
export const WIREFRAMES_ASCII = [
  {
    id: 'wire_home',
    title: 'HOME PAGE WIREFRAME (ASCII)',
    layout: `
┌────────────────────────────────────────────────────────────────────────────────────┐
│  [WMS Premium Shop]             [Search Products... 🔎]          (⭐ Favor) (🛒 2) │
├────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│   [HERO SPOTLIGHT SECTION]                                                         │
│   ┌────────────────────────────────────────────────────────────────────────────┐   │
│   │                                                                            │   │
│   │   {{product.name}} Premium Minimalist Watch                                │   │
│   │   {{product.description}} Ultra-slim automatic movement with titanium...   │   │
│   │                                                                            │   │
│   │   Price: {{product.price}} 899.00 EUR                                      │   │
│   │   [ ADD TO CART 🛒 ]   [ View Details → ]                                  │   │
│   │                                                                            │   │
│   └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│   [FEATURED CATEGORIES]                                                            │
│   ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐      │
│   │ {{category.name}}   │   │ {{category.name}}   │   │ {{category.name}}   │      │
│   │ Accessories         │   │ Living              │   │ Audio               │      │
│   │ {{category.count}}  │   │ {{category.count}}  │   │ {{category.count}}  │      │
│   └─────────────────────┘   └─────────────────────┘   └─────────────────────┘      │
│                                                                                    │
│   [DYNAMIC BESTSELLERS MATRIX]                                                     │
│   ┌───────────────────────────┐   ┌───────────────────────────┐                    │
│   │ [Image: Watch]            │   │ [Image: Chair]            │                    │
│   │ {{product.name}}          │   │ {{product.name}}          │                    │
│   │ Price: {{product.price}}  │   │ Price: {{product.price}}  │                    │
│   │ [Add to Cart]             │   │ [Add to Cart]             │                    │
│   └───────────────────────────┘   └───────────────────────────┘                    │
└────────────────────────────────────────────────────────────────────────────────────┘
`
  },
  {
    id: 'wire_category',
    title: 'CATEGORY PAGE WIREFRAME (ASCII)',
    layout: `
┌────────────────────────────────────────────────────────────────────────────────────┐
│  Home / Categories / Accessories                                                   │
├────────────────────────────────────────────────────────────────────────────────────┤
│  FILTERS & SORTING BAR                                                            │
│  [ Sort By: Price ↓ ]    [ Filter By Color ]   [ View: Grid █ | List ☰ ]           │
├───────────────────────────────┬────────────────────────────────────────────────────┤
│ SIDEBAR FILTERS               │ DYNAMIC PRODUCT GRID (Active Matches)              │
│ ┌───────────────────────────┐ │ ┌─────────────────────────┐ ┌────────────────────┐ │
│ │ ▸ Category                │ │ │ [Image: Watch]          │ │ [Image: Ceramic]   │ │
│ │   [x] Accessories         │ │ │                         │ │                    │ │
│ │   [ ] Living              │ │ │ {{product.name}}        │ │ {{product.name}}   │ │
│ │                           │ │ │ SKU: {{product.sku}}    │ │ SKU: {{product.sku}}│ │
│ │ ▸ Availability            │ │ │ Price: {{product.price}}│ │ {{product.price}}  │ │
│ │   [x] In Stock (WMS Active) │ │ │                       │ │                    │ │
│ │   [ ] Out Of Stock        │ │ │ [Add to Cart 🛒]        │ │ [Add to Cart 🛒]   │ │
│ │                           │ │ └─────────────────────────┘ └────────────────────┘ │
│ │ ▸ Price Range             │ │                                                    │
│ │   Min: 140 | Max: 1250    │ │ ┌───────────────────┐                              │
│ └───────────────────────────┘ │ │ [ 1 ] [ 2 ] [ → ] │ Pagination                   │
└───────────────────────────────┴────────────────────────────────────────────────────┘
`
  },
  {
    id: 'wire_product',
    title: 'PRODUCT DETAIL PAGE WIREFRAME (ASCII)',
    layout: `
┌────────────────────────────────────────────────────────────────────────────────────┐
│  Home / Accessories / Premium Minimalist Watch                                      │
├──────────────────────────────────────────────────────┬─────────────────────────────┤
│ PHOTOGRAPHY GALLERY                                  │ PRODUCT SUMMARY & OPTIONS   │
│ ┌──────────────────────────────────────────────────┐ │ {{product.name}}            │
│ │                                                  │ │ SKU: {{product.sku}}        │
│ │                                                  │ │ ⭐⭐⭐⭐⭐ (4.8 Rating)      │
│ │                                                  │ │ ─────────────────────────── │
│ │              [ LARGE HIGH-RES PHOTO ]            │ │ Price: {{product.price}}    │
│ │               {{product.image}}                  │ │ Stock: {{product.stock}}    │
│ │                                                  │ │ ─────────────────────────── │
│ │                                                  │ │ CHOOSE VARIANT:             │
│ │                                                  │ │ [Color: Silver] [SpaceGray] │
│ ├──────────────────────────────────────────────────┤ │ Size: [ 38mm ]  [ 42mm ]    │
│ │ [Thumb 1] [Thumb 2] [Thumb 3] [Thumb 4]          │ │ ─────────────────────────── │
│ └──────────────────────────────────────────────────┘ │ [ ADD TO CART             🛒]│
├──────────────────────────────────────────────────────┴─────────────────────────────┤
│ INTERACTIVE TECHNICAL SPECIFICATIONS SHEET                                         │
│ ┌────────────────────────────────────┬───────────────────────────────────────────┐ │
│ │ Casing                             │ Grade 5 Custom Titanium                   │ │
│ │ Movement                           │ Calibre 9012 Automatic                    │ │
│ │ Water Resistance                   │ 50 meters (5 ATM)                         │ │
│ └────────────────────────────────────┴───────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────┘
`
  },
  {
    id: 'wire_checkout',
    title: 'ONE-PAGE CHECKOUT WIREFRAME (ASCII)',
    layout: `
┌────────────────────────────────────────────────────────────────────────────────────┐
│  Secure Checkout (Shopify Plus / Stripe Style)               [🔒 End-to-End SSL]   │
├──────────────────────────────────────────────────────┬─────────────────────────────┤
│ 1. CUSTOMER INFORMATION                              │ ORDER SUMMARY & TOTAL       │
│ Email: [ klient@apexstore.pl                     ]   │ ┌─────────────────────────┐ │
│ [ ] Subscribe to dynamic newsletter bulletins        │ │ {{product.name}} x 1    │ │
│                                                      │ │ Price: 899.00 EUR       │ │
│ 2. DELIVERY ADDRESS                                  │ │                         │ │
│ First Name: [ Alexander ]  Last Name: [ Kowalski ]   │ │ Subtotal: 899.00 EUR    │ │
│ Street Address: [ Marszalkowska 104/12           ]   │ │ Shipping:   0.00 EUR    │ │
│ Postal Code: [ 00-017   ]  City: [ Warszawa      ]   │ │ Total:    899.00 EUR    │ │
│ Phone Number: [ +48 500 600 700                  ]   │ └─────────────────────────┘ │
│                                                      │ [PROMO CODE]                │
│ 3. SHIPPING LOGISTICS                                │ [ Enter Code ] [ Apply ]    │
│ (o) Express Cargo (Next Day - 0.00 EUR)              │                             │
│ ( ) Standard Air Mail (3 Days - 0.00 EUR)            │                             │
│                                                      │                             │
│ 4. PAYMENT PROCESS (Stripe Gateway Mock)             │                             │
│ [ Credit Card (Mock) ]   [ BLIK ]   [ Bank Transfer] │                             │
│ [ PLACE ORDER & PAY 🚀 ]                             │                             │
└──────────────────────────────────────────────────────┴─────────────────────────────┘
`
  },
  {
    id: 'wire_dashboard',
    title: 'CUSTOMER DASHBOARD WIREFRAME (ASCII)',
    layout: `
┌────────────────────────────────────────────────────────────────────────────────────┐
│  [Customer Console]           Welcome, {{customer.firstName}}           [ Logout ] │
├──────────────────────┬─────────────────────────────────────────────────────────────┤
│ NAVIGATION           │ ACTIVE ORDER PROGRESS & HISTORY                             │
│ ┌──────────────────┐ │ Active Order Tracking Ref: {{order.orderNumber}}            │
│ │ ▸ Dashboard      │ │ Current Status: [ ORDER RECEIVED ]                          │
│ │ ▸ Order History  │ │ ┌─────────────────────────────────────────────────────────┐ │
│ │ ▸ Returns / RMA  │ │ │  (●) Received  ── ( ) Assembly ── ( ) Dispatched 🚀     │ │
│ │ ▸ Saved Profile  │ │ └─────────────────────────────────────────────────────────┘ │
│ └──────────────────┘ │                                                             │
│                      │ PREVIOUS COMPLETED DELIVERIES                               │
│                      │ ┌─────────────────────────────────────────────────────────┐ │
│                      │ │ Order ID: APX-98124  │ Date: 2026-06-11 │ Total: 899 EUR │ │
│                      │ │ Items: {{product.name}} x 1  │ Status: [ DELIVERED ]     │ │
│                      │ │ [ Order Details ] [ Register Return / Dynamic RMA ]      │ │
│                      │ └─────────────────────────────────────────────────────────┘ │
└──────────────────────┴─────────────────────────────────────────────────────────────┘
`
  }
];

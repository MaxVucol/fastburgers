import type { PluralForms } from "../config";

/** Marks a plural-forms entry so other languages may use their own categories (ru: many). */
const plural = (forms: PluralForms): PluralForms => forms;

// Source dictionary. ru.ts and en.ts are typed against it, so a missing key fails the build.
// Values are plain strings ({placeholders} are filled with `fill`) so the dictionary can be
// passed to Client Components.

export const ro = {
  meta: {
    title: "Fast Burgers — smash burgers, pizza și crispy chicken în București",
    description:
      "Smash burgers din vită Angus, pizza la cuptor, crispy chicken și cartofi tăiați zilnic. Comandă online cu livrare rapidă în București sau ridicare din restaurant.",
    ogTitle: "Fast Burgers — smash burgers, pizza și crispy chicken",
    ogImageAlt: "Burger cu vită, cheddar topit, salată și roșii pe un platou de lemn",
    keywords: "fast food București, smash burger, pizza, crispy chicken, livrare mâncare, burgeri",
    menuTitle: "Meniu — burgeri, pizza, chicken, cartofi și deserturi",
    menuDescription:
      "Tot meniul Fast Burgers cu prețuri: smash burgers din vită Angus, pizza la cuptor, aripioare, wraps, combo-uri, deserturi și băuturi. Comandă online.",
    categoryTitle: "{name} — comandă online",
    categoryDescription: "{description} Vezi prețurile și comandă online de la Fast Burgers.",
    productUnavailable: "Produs indisponibil",
    categoryUnavailable: "Categorie indisponibilă",
    checkoutTitle: "Finalizează comanda",
    checkoutDescription: "Completează datele de livrare și plasează comanda Fast Burgers.",
    orderTitle: "Comanda ta",
    accountTitle: "Urmărește comanda",
    accountDescription: "Urmărește statusul comenzii Fast Burgers.",
    aboutTitle: "Despre noi",
    aboutDescription:
      "Povestea Fast Burgers: o bucătărie mică din centrul Bucureștiului care face smash burgers, pizza și pui crocant fără scurtături.",
    contactTitle: "Contact și locații",
    contactDescription: "Adresele restaurantelor Fast Burgers din București, telefon, email și programul de funcționare.",
  },

  common: {
    skipToContent: "Sari la conținut",
    home: "Acasă",
    menu: "Meniu",
    loading: "Se încarcă",
    free: "Gratuit",
    total: "Total",
    subtotal: "Subtotal",
    viewMenu: "Vezi meniul",
    orderNow: "Comandă acum",
  },

  nav: {
    main: "Navigare principală",
    home: "Acasă",
    menu: "Meniu",
    about: "Despre noi",
    contact: "Contact",
    track: "Urmărește comanda",
    checkout: "Coș și comandă",
  },

  topbar: {
    items: ["Livrare rapidă", "Gătit la comandă"],
    language: "Limba site-ului",
  },

  header: {
    homeLink: "fastburgers — pagina principală",
    search: "Caută în meniu",
    openMenu: "Deschide meniul",
    closeMenu: "Închide meniul",
    navigation: "Navigare",
    open: "Deschis zilnic de la 11:00",
  },

  search: {
    label: "Caută în meniu",
    placeholder: "Burger, pizza, cartofi…",
    term: "Termen de căutare",
    close: "Închide căutarea",
    popular: "Căutări populare",
    suggestions: ["Smash", "Pizza", "Aripioare", "Cartofi", "Bacon", "Milkshake"],
  },

  hero: {
    eyebrow: "Smash burgers · proaspăt în fiecare zi",
    titleLines: ["Foamea nu", "așteaptă."],
    script: "Smash it.",
    lead: "Vită Angus presată pe plita încinsă, pizza cu blat crescut 48 de ore și pui crocant. Gătit după ce comanzi, livrat fierbinte.",
    primary: "Comandă acum",
    secondary: "Vezi meniul",
    delivery: "Livrare",
    deliveryValue: "~30 min",
    note: "fără scurtături",
    spotlight: "Cel mai comandat",
    imageAlt: "Burger smash dublu cu cheddar topit, castraveți murați și ceapă, pe fundal întunecat",
  },

  benefits: {
    title: "De ce Fast Burgers",
    items: [
      { title: "Gătit la comandă", text: "Nimic ținut la cald. Burgerul intră pe plită după ce comanzi." },
      { title: "Ingrediente proaspete", text: "Vită Angus tocată zilnic, cartofi tăiați în fiecare dimineață." },
      { title: "Livrare rapidă", text: "Curieri proprii și genți termice, în medie ~30 de minute." },
    ],
  },

  hits: {
    title: "Hiturile casei",
    lead: "Gusturile la care clienții se întorc cel mai des.",
    note: "cele mai comandate",
    viewAll: "Toate produsele populare",
  },

  categories: {
    title: "Meniul, pe categorii",
    lead: "Opt categorii, un singur standard: totul se gătește după comandă.",
    count: plural({ one: "{count} produs", few: "{count} produse", other: "{count} de produse" }),
    viewAll: "Vezi tot meniul",
  },

  promo: {
    eyebrow: "Oferta săptămânii",
    title: "Burger, cartofi și băutură. Un singur preț.",
    save: "Economisești {amount}",
    customize: "Personalizează",
    imageAlt: "Burger cu salată pe chiflă cu susan și cartofi prăjiți într-un coș, pe un platou de lemn",
    badge: "ofertă",
  },

  picks: {
    title: "Merită încercate",
    lead: "Best seller-uri și noutăți din fiecare categorie, de la pizza la deserturi.",
    viewAll: plural({ one: "Vezi produsul", few: "Vezi toate cele {count} produse", other: "Vezi toate cele {count} de produse" }),
  },

  reviews: {
    title: "Ce spun clienții",
    lead: "Nota medie {average} din 5, din recenzii verificate după livrare.",
    originalLanguage: "",
    stars: "{rating} din 5 stele",
  },

  cta: {
    titleLines: ["Ți-e foame?", "Comandă în două minute."],
    text: "Alegi din meniu, plătești la livrare sau la ridicare și urmărești comanda în timp real.",
    primary: "Comandă acum",
  },

  footer: {
    about:
      "Smash burgers, pizza la cuptor și pui crocant, gătite la comandă din ingrediente proaspete. Livrăm rapid în București sau te așteptăm în restaurant.",
    navigation: "Navigare",
    categories: "Categorii",
    contact: "Contact și program",
    rights: "Toate drepturile rezervate.",
    vat: "Prețurile includ TVA. Fotografiile sunt cu titlu de prezentare.",
    social: "{name} pe {network}",
  },

  hours: [
    { days: "Luni – Joi", time: "11:00 – 23:00" },
    { days: "Vineri – Sâmbătă", time: "11:00 – 01:00" },
    { days: "Duminică", time: "12:00 – 22:00" },
  ],

  product: {
    add: "Adaugă",
    added: "Adăugat",
    addToCart: "Adaugă în coș",
    addToCartNamed: "Adaugă în coș: {name}",
    addedNamed: "Adăugat în coș: {name}",
    oldPrice: "Preț vechi:",
    badgeNew: "Nou",
    badgePopular: "Popular",
    badgeBest: "Best seller",
    weight: "Gramaj",
    energy: "Valoare energetică",
    delivery: "Livrare",
    freeOver: "Gratuit peste {amount}",
    extras: "Extra-uri și opțiuni",
    optionFree: "gratuit",
    addWithTotal: "Adaugă în coș · {total}",
    addedToCart: "Adăugat în coș",
    ingredients: "Ingrediente",
    allergens: "Alergeni",
    noAllergens: "Nu conține alergeni majori declarați.",
    allergyNote:
      "Bucătăria procesează gluten, lapte, ouă, susan și muștar. Pentru alergii severe, sună-ne înainte de comandă.",
    relatedEyebrow: "Merge perfect cu",
    relatedTitle: "S-ar putea să-ți placă și",
    imageOf: "{name}, imaginea {index} din {count}",
    showImage: "Afișează imaginea {index}",
    gallery: "Galerie imagini",
    loading: "Se încarcă produsul",
  },

  quantity: {
    group: "Cantitate {name}",
    decrease: "Scade cantitatea pentru {name}",
    increase: "Crește cantitatea pentru {name}",
    remove: "Elimină {name}",
  },

  menu: {
    eyebrow: "Meniu",
    title: "Ce mâncăm azi?",
    lead: plural({
      one: "{count} produs gătit la comandă. Caută, filtrează sau adaugă direct în coș.",
      few: "{count} produse gătite la comandă. Caută, filtrează sau adaugă direct în coș.",
      other: "{count} de produse gătite la comandă. Caută, filtrează sau adaugă direct în coș.",
    }),
    searchLabel: "Caută după nume, ingrediente sau categorie",
    searchPlaceholder: "Caută: smash, bacon, picant, cheesecake…",
    clearSearch: "Șterge căutarea",
    sortLabel: "Sortează produsele",
    sortPrefix: "Sortare",
    sorts: {
      recommended: "Recomandate",
      "price-asc": "Preț crescător",
      "price-desc": "Preț descrescător",
      name: "Nume (A–Z)",
      newest: "Cele mai noi",
    },
    filters: { all: "Toate", popular: "Populare", new: "Noi", sale: "Reduceri" },
    filtersLabel: "Filtre",
    categoriesLabel: "Categorii",
    allCategories: "Toate categoriile",
    emptyTitle: "Niciun produs găsit",
    emptySearch: "Încearcă un alt termen, de exemplu „burger”, „pui” sau „ciocolată”.",
    emptyFilters: "Nu există produse pentru combinația de filtre aleasă.",
    found: plural({ one: "{count} produs găsit", few: "{count} produse găsite", other: "{count} de produse găsite" }),
    seeAll: "Vezi tot meniul",
    otherCategories: "Alte categorii",
  },

  cart: {
    title: "Coșul tău",
    close: "Închide coșul",
    emptyTitle: "Coșul este gol",
    emptyText: "Adaugă ceva bun din meniu. Durează câteva secunde.",
    freeLeft: "Mai adaugă {amount} pentru livrare gratuită",
    freeReached: "Ai livrare gratuită!",
    items: "Produse în coș",
    remove: "Elimină {name} din coș",
    feeNote: "Taxa de livrare se calculează la pasul următor.",
    checkout: "Finalizează comanda",
    continue: "Continuă cumpărăturile",
    buttonEmpty: "Coș gol",
    button: plural({ one: "Coș: {count} produs", few: "Coș: {count} produse", other: "Coș: {count} de produse" }),
  },

  checkout: {
    title: "Finalizează comanda",
    loading: "Se încarcă coșul",
    emptyTitle: "Coșul tău este gol",
    emptyText: "Adaugă produse din meniu și revino aici pentru a finaliza comanda.",
    stepContact: "Datele tale",
    stepDelivery: "Livrare",
    stepPayment: "Plată",
    name: "Nume complet",
    phone: "Telefon",
    phoneHint: "Te sunăm doar dacă e nevoie.",
    phonePlaceholder: "07xx xxx xxx",
    email: "Email",
    emailHint: "Pentru confirmarea comenzii.",
    emailPlaceholder: "nume@exemplu.ro",
    deliveryMethod: "Metoda de livrare",
    deliveryTitle: "Livrare la domiciliu",
    deliveryText: "~30 min · gratuit peste {amount}",
    pickupTitle: "Ridicare din restaurant",
    pickupText: "Gata în ~15 min · fără taxă",
    address: "Adresa de livrare",
    addressHint: "Stradă, număr, bloc, scară, etaj, apartament, interfon.",
    chooseRestaurant: "Alege restaurantul",
    paymentMethod: "Metoda de plată",
    cash: "Numerar",
    card: "Card (POS)",
    online: "Card online",
    onDelivery: "La livrare",
    onPickup: "La ridicare",
    courierPos: "Curierul are POS",
    atCounter: "La casă",
    soon: "În curând",
    notes: "Observații pentru comandă",
    notesHint: "Ex.: fără ceapă, băutura preferată pentru combo, sună la interfon 14.",
    summary: "Sumar comandă",
    delivery: "Livrare",
    pickup: "Ridicare",
    minimum: "Comanda minimă pentru livrare este {min}. Mai adaugă {left} sau alege ridicarea.",
    submitting: "Se trimite comanda…",
    submit: "Plasează comanda · {total}",
    priceNote: "Prețurile sunt verificate din nou la plasarea comenzii.",
  },

  errors: {
    form: "Verifică datele marcate mai jos.",
    name: "Introdu numele complet",
    phone: "Introdu un număr de telefon valid",
    email: "Introdu o adresă de email validă",
    address: "Introdu adresa completă (stradă, număr, bloc, apartament)",
    location: "Alege restaurantul",
    notes: "Maxim 500 de caractere",
    cartEmpty: "Coșul este gol",
    invalid: "Date invalide",
    productUnavailable: "Un produs din coș nu mai este disponibil. Actualizează coșul și încearcă din nou.",
    optionUnavailable: "O opțiune pentru „{name}” nu mai este disponibilă.",
    minDelivery: "Comanda minimă pentru livrare este {min}.",
    locationUnavailable: "Restaurantul selectat nu este disponibil.",
    onlinePayment: "Plata online nu este încă disponibilă. Alege plata la livrare.",
    saveFailed: "Nu am putut înregistra comanda. Te rugăm să încerci din nou.",
    unexpected: "A apărut o eroare la plasarea comenzii. Te rugăm să încerci din nou.",
    orderNumber: "Numărul are forma FB-XXXXXXXX",
    lookupPhone: "Introdu telefonul folosit la comandă",
    orderNotFound: "Nu am găsit nicio comandă cu aceste date.",
  },

  order: {
    thanks: "Mulțumim, {name}! Comanda a fost trimisă.",
    title: "Comanda {number}",
    number: "Număr comandă",
    placed: "plasată {date}",
    status: "Status comandă",
    steps: "Etapele comenzii",
    cancelled: "Comanda a fost anulată. Pentru detalii, sună-ne.",
    autoRefresh: "Pagina se actualizează automat.",
    items: "Produse",
    delivery: "Livrare",
    courier: "Curierul te sună când ajunge.",
    payment: "Plată",
    again: "Comandă din nou",
    home: "Înapoi acasă",
    statuses: {
      NEW: "Primită",
      CONFIRMED: "Confirmată",
      PREPARING: "În pregătire",
      READY: "Gata de ridicare",
      OUT_FOR_DELIVERY: "În livrare",
      COMPLETED: "Finalizată",
      CANCELLED: "Anulată",
    },
    methods: { DELIVERY: "Livrare la domiciliu", PICKUP: "Ridicare din restaurant" },
    payments: {
      CASH: "Numerar la livrare / ridicare",
      CARD_ON_DELIVERY: "Card la livrare / ridicare",
      CARD_ONLINE: "Card online",
    },
  },

  account: {
    eyebrow: "Comenzi",
    title: "Urmărește comanda",
    lead: "Comanzi fără cont, e mai rapid. Ai nevoie doar de numărul comenzii și de telefon ca să vezi în ce stadiu e.",
    trackTitle: "Unde e comanda mea?",
    trackText: "Numărul comenzii apare pe ecranul de confirmare.",
    number: "Număr comandă",
    phone: "Telefon",
    submit: "Urmărește comanda",
    helpTitle: "Ai nevoie de ajutor?",
    helpText: "Suntem la telefon în timpul programului.",
    staffTitle: "Personal restaurant",
    staffText: "Autentificare în panoul de administrare",
  },

  about: {
    eyebrow: "Despre noi",
    title: "Am pornit de la o plită și o obsesie.",
    paragraphs: [
      "Fast Burgers a început în 2019 într-un spațiu de 30 de metri pătrați pe Ion Câmpineanu, cu o singură plită și o idee simplă: burgerul perfect are crustă, nu doar gust.",
      "Între timp am adăugat pizza cu blat crescut lent, pui marinat peste noapte și cartofi tăiați în fiecare dimineață. Regula a rămas aceeași: totul se gătește după ce comanzi.",
    ],
    stats: [
      { value: "2019", label: "anul primului smash burger" },
      { value: "3", label: "restaurante în București" },
      { value: "48h", label: "maturare pentru blatul de pizza" },
      { value: "~30 min", label: "timp mediu de livrare" },
    ],
    statsLabel: "Fast Burgers în cifre",
    principlesTitle: "Fast food, dar fără scurtături.",
    principlesLead: "Suntem rapizi pentru că suntem organizați, nu pentru că pregătim dinainte.",
    principles: [
      { title: "Ingrediente proaspete", text: "Carne de vită Angus tocată zilnic, legume de la producători locali, cartofi tăiați dimineața." },
      { title: "Preparat la comandă", text: "Nimic nu stă sub lămpi. Burgerul tău intră pe plită abia după ce ai apăsat „Comandă”." },
      { title: "Sosuri făcute în casă", text: "Sosul casei, BBQ-ul afumat și maioneza sriracha le preparăm noi, în loturi mici." },
      { title: "Calitate constantă", text: "Rețete cântărite la gram și verificare la fiecare tură, ca primul burger să fie ca al o sutălea." },
    ],
    imageMain: "Burger cu vită, cheddar topit și sosul casei",
    imagePizza: "Pizza Margherita cu busuioc",
    imageChicken: "Fâșii de pui crocant cu sos",
  },

  contact: {
    eyebrow: "Contact",
    title: "Hai pe la noi sau sună-ne.",
    ordersTitle: "Comenzi și întrebări",
    hoursTitle: "Program livrări",
    restaurants: "Restaurante",
    maps: "Deschide în Google Maps",
  },

  notFound: {
    title: "Pagina asta s-a mâncat.",
    text: "Produsul sau pagina căutată nu mai există. Dar meniul e plin de alte lucruri bune.",
    home: "Pagina principală",
  },

  error: {
    title: "Ceva n-a mers cum trebuia.",
    text: "Am întâmpinat o eroare neașteptată. Încearcă din nou. Dacă problema persistă, sună-ne și preluăm comanda telefonic.",
    retry: "Încearcă din nou",
  },

  /** Option names are stored in Romanian in the database and in cart snapshots. */
  options: {} as Record<string, string>,
};

export type Dictionary = typeof ro;

/* Demo data. Run with `npm run db:seed` — WARNING: it resets catalog, orders and reviews. */
import { PrismaClient, type OrderStatus, type DeliveryMethod, type PaymentMethod } from "@prisma/client";
import bcrypt from "bcryptjs";
import { draftCategories, draftProducts } from "./menu-drafts";

const prisma = new PrismaClient();

type OptionSeed = { name: string; price: number };
type ProductSeed = {
  slug: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  shortDescription: string;
  description: string;
  ingredients: string[];
  allergens: string[];
  weight: number;
  weightUnit?: "g" | "ml";
  calories: number;
  popular?: boolean;
  featured?: boolean;
  isNew?: boolean;
  gallery?: boolean;
  options: OptionSeed[];
};

const categories = [
  { slug: "burgeri", name: "Burgeri", description: "Smash burgers din vită Angus și pui crocant, în chiflă brioche prăjită." },
  { slug: "pizza", name: "Pizza", description: "Blat crescut 48 de ore, copt la 400°C, cu ingrediente italiene." },
  { slug: "chicken", name: "Chicken", description: "Pui marinat 12 ore în lapte bătut și prăjit până devine crocant." },
  { slug: "wraps", name: "Wraps", description: "Tortilla caldă, rulată strâns, perfectă pe drum." },
  { slug: "cartofi", name: "Cartofi", description: "Tăiați zilnic și prăjiți de două ori. Simpli sau încărcați." },
  { slug: "combo", name: "Combo-uri", description: "Burger, cartofi și băutură — la preț mai bun." },
  { slug: "deserturi", name: "Deserturi", description: "Coapte în casă în fiecare dimineață." },
  { slug: "bauturi", name: "Băuturi", description: "Răcoritoare reci, limonadă făcută în casă și milkshake." },
];

const burgerExtras: OptionSeed[] = [
  { name: "Extra cheddar", price: 500 },
  { name: "Extra bacon", price: 700 },
  { name: "Sos picant", price: 300 },
  { name: "Sosul casei", price: 300 },
  { name: "Porție de cartofi", price: 900 },
  { name: "Băutură 0,33 l", price: 700 },
];
const pizzaExtras: OptionSeed[] = [
  { name: "Extra mozzarella", price: 600 },
  { name: "Margine umplută cu brânză", price: 800 },
  { name: "Jalapeño", price: 400 },
  { name: "Ulei picant cu chili", price: 300 },
];
const chickenExtras: OptionSeed[] = [
  { name: "Sos BBQ afumat", price: 300 },
  { name: "Sos de usturoi", price: 300 },
  { name: "Sos picant", price: 300 },
  { name: "Porție de cartofi", price: 900 },
];
const wrapExtras: OptionSeed[] = [
  { name: "Porție dublă de carne", price: 900 },
  { name: "Extra cheddar", price: 500 },
  { name: "Sos picant", price: 300 },
  { name: "Porție de cartofi", price: 900 },
];
const comboExtras: OptionSeed[] = [
  { name: "Upgrade la Cheesy Fries", price: 600 },
  { name: "Upgrade la milkshake", price: 900 },
  { name: "Sos extra la alegere", price: 300 },
];
const friesExtras: OptionSeed[] = [
  { name: "Sos de cheddar", price: 400 },
  { name: "Sos de usturoi", price: 300 },
  { name: "Ketchup", price: 200 },
  { name: "Maioneză", price: 200 },
];

const products: ProductSeed[] = [
  // ── Burgeri
  {
    slug: "classic-smash", name: "Classic Smash", category: "burgeri", price: 3290,
    shortDescription: "Două chifteluțe smash din vită Angus, cheddar topit, murături și sosul casei.",
    description: "Două chifteluțe de vită Angus presate pe plita încinsă până capătă o crustă caramelizată, cheddar american topit, ceapă albă tocată mărunt, castraveți murați în casă și sosul nostru special, într-o chiflă brioche prăjită în unt.",
    ingredients: ["Chiflă brioche", "Vită Angus 2 × 80 g", "Cheddar american", "Ceapă albă", "Castraveți murați", "Sosul casei"],
    allergens: ["Gluten", "Lapte", "Ouă", "Muștar", "Susan"],
    weight: 260, calories: 690, popular: true, featured: true, gallery: true, options: burgerExtras,
  },
  {
    slug: "double-cheese", name: "Double Cheese", category: "burgeri", price: 3890, oldPrice: 4290,
    shortDescription: "Două chifteluțe groase de vită, patru felii de cheddar maturat și maioneză cu Dijon.",
    description: "Două chifteluțe groase de vită Angus de câte 120 g, patru felii de cheddar maturat 12 luni, roșii coapte, salată iceberg, ceapă roșie și maioneză cu muștar Dijon, într-o chiflă cu susan rumenită pe plită.",
    ingredients: ["Chiflă cu susan", "Vită Angus 2 × 120 g", "Cheddar maturat", "Roșii", "Salată iceberg", "Ceapă roșie", "Maioneză cu Dijon"],
    allergens: ["Gluten", "Lapte", "Ouă", "Muștar", "Susan"],
    weight: 380, calories: 980, popular: true, featured: true, gallery: true, options: burgerExtras,
  },
  {
    slug: "bbq-bacon", name: "BBQ Bacon", category: "burgeri", price: 3990,
    shortDescription: "Vită Angus, bacon afumat crocant, onion rings și sos BBQ cu melasă.",
    description: "Chiftea de vită Angus de 180 g, bacon afumat la lemn de fag și prăjit crocant, cheddar, onion rings în aluat de bere și sos BBQ cu melasă și boia afumată, servit într-o chiflă brioche moale.",
    ingredients: ["Chiflă brioche", "Vită Angus 180 g", "Bacon afumat", "Cheddar", "Onion rings", "Sos BBQ cu melasă"],
    allergens: ["Gluten", "Lapte", "Ouă", "Muștar", "Țelină"],
    weight: 340, calories: 920, featured: true, isNew: true, gallery: true, options: burgerExtras,
  },
  {
    slug: "crispy-chicken", name: "Crispy Chicken", category: "burgeri", price: 3490,
    shortDescription: "Pulpă de pui în pané dublu, coleslaw cu varză roșie și maioneză sriracha.",
    description: "Pulpă de pui dezosată, marinată 12 ore în lapte bătut și condimente, dată prin pané dublu și prăjită până devine aurie. Vine cu coleslaw de varză roșie, castraveți murați și maioneză cu sriracha, în chiflă brioche.",
    ingredients: ["Chiflă brioche", "Pulpă de pui 160 g", "Pané condimentat", "Coleslaw", "Castraveți murați", "Maioneză sriracha"],
    allergens: ["Gluten", "Lapte", "Ouă", "Muștar"],
    weight: 300, calories: 760, popular: true, gallery: true, options: burgerExtras,
  },
  // ── Pizza
  {
    slug: "margherita", name: "Margherita", category: "pizza", price: 3490,
    shortDescription: "Roșii San Marzano, mozzarella fior di latte și busuioc proaspăt.",
    description: "Blat crescut 48 de ore și copt la 400°C, cu sos din roșii San Marzano, mozzarella fior di latte, busuioc proaspăt și un fir de ulei de măsline extravirgin. Simplă, exact ca în Napoli.",
    ingredients: ["Blat cu maia", "Roșii San Marzano", "Mozzarella fior di latte", "Busuioc", "Ulei de măsline extravirgin"],
    allergens: ["Gluten", "Lapte"],
    weight: 450, calories: 820, options: pizzaExtras,
  },
  {
    slug: "pepperoni", name: "Pepperoni", category: "pizza", price: 4290,
    shortDescription: "Pepperoni tăiat gros care se rumenește în cupe crocante, plus miere cu chili.",
    description: "Sos de roșii cu oregano, mozzarella rasă și salam pepperoni tăiat gros, care se rumenește la cuptor în cupe crocante. La final adăugăm un strop de miere cu chili pentru contrast dulce-iute.",
    ingredients: ["Blat cu maia", "Sos de roșii", "Mozzarella", "Pepperoni", "Oregano", "Miere cu chili"],
    allergens: ["Gluten", "Lapte"],
    weight: 520, calories: 1080, popular: true, options: pizzaExtras,
  },
  {
    slug: "bbq-chicken-pizza", name: "BBQ Chicken", category: "pizza", price: 4490,
    shortDescription: "Pui la grătar pe bază de sos BBQ, ceapă roșie, ardei copt și coriandru.",
    description: "În loc de roșii, baza este un sos BBQ afumat. Deasupra: piept de pui la grătar, mozzarella, ceapă roșie tăiată subțire, ardei copt și coriandru proaspăt adăugat imediat după cuptor.",
    ingredients: ["Blat cu maia", "Sos BBQ", "Piept de pui la grătar", "Mozzarella", "Ceapă roșie", "Ardei copt", "Coriandru"],
    allergens: ["Gluten", "Lapte", "Muștar", "Țelină"],
    weight: 560, calories: 1040, isNew: true, options: pizzaExtras,
  },
  {
    slug: "four-cheese", name: "Four Cheese", category: "pizza", price: 4690, oldPrice: 4990,
    shortDescription: "Mozzarella, gorgonzola, parmezan maturat și scamorza afumată pe blat alb.",
    description: "Pizza bianca cu cremă de smântână, mozzarella, gorgonzola dolce, Parmigiano Reggiano maturat 24 de luni și scamorza afumată, terminată cu piper negru proaspăt măcinat.",
    ingredients: ["Blat cu maia", "Cremă de smântână", "Mozzarella", "Gorgonzola", "Parmigiano Reggiano", "Scamorza afumată"],
    allergens: ["Gluten", "Lapte"],
    weight: 480, calories: 1120, featured: true, options: pizzaExtras,
  },
  // ── Chicken
  {
    slug: "crispy-tenders", name: "Crispy Tenders", category: "chicken", price: 2990,
    shortDescription: "5 fâșii de piept de pui în pané crocant, cu sos de usturoi și ierburi.",
    description: "Cinci fâșii de piept de pui marinate în lapte bătut, trecute prin făină condimentată și prăjite până devin aurii și crocante. Le servim cu sos de usturoi și ierburi proaspete.",
    ingredients: ["Piept de pui", "Lapte bătut", "Făină condimentată", "Sos de usturoi"],
    allergens: ["Gluten", "Lapte", "Ouă"],
    weight: 250, calories: 540, popular: true, options: chickenExtras,
  },
  {
    slug: "hot-wings", name: "Hot Wings", category: "chicken", price: 3190,
    shortDescription: "8 aripioare glasate în sos buffalo iute, cu dip de brânză albastră.",
    description: "Opt aripioare de pui coapte și apoi prăjite, glasate în sos buffalo cu unt și ardei cayenne. Le echilibrăm cu bețe de țelină și un dip cremos de brânză albastră.",
    ingredients: ["Aripioare de pui", "Sos buffalo", "Unt", "Ardei cayenne", "Țelină", "Dip de brânză albastră"],
    allergens: ["Lapte", "Țelină", "Ouă"],
    weight: 320, calories: 620, popular: true, isNew: true, gallery: true, options: chickenExtras,
  },
  {
    slug: "chicken-box", name: "Chicken Box", category: "chicken", price: 5490, oldPrice: 5990,
    shortDescription: "6 bucăți de pui crocant, cartofi mari, coleslaw și două sosuri. Pentru împărțit.",
    description: "Pentru împărțit: șase bucăți de pui cu os, pulpe și aripi, în pané crocant cu 11 condimente, o porție mare de cartofi prăjiți, coleslaw proaspăt și două sosuri la alegere.",
    ingredients: ["Pui cu os 6 buc.", "Pané cu 11 condimente", "Cartofi prăjiți", "Coleslaw", "2 sosuri"],
    allergens: ["Gluten", "Lapte", "Ouă", "Muștar"],
    weight: 850, calories: 1650, featured: true, options: chickenExtras,
  },
  // ── Wraps
  {
    slug: "crispy-chicken-wrap", name: "Crispy Chicken Wrap", category: "wraps", price: 2890,
    shortDescription: "Tortilla caldă cu pui crispy, salată romană, cheddar și sos ranch cu mărar.",
    description: "Tortilla de grâu rumenită pe plită, umplută cu fâșii de pui crispy, salată romană, roșii, varză roșie, cheddar și sos ranch cu mărar, rulată strâns și tăiată în două.",
    ingredients: ["Tortilla de grâu", "Pui crispy", "Salată romană", "Roșii", "Varză roșie", "Cheddar", "Sos ranch"],
    allergens: ["Gluten", "Lapte", "Ouă"],
    weight: 330, calories: 640, options: wrapExtras,
  },
  {
    slug: "bbq-beef-wrap", name: "BBQ Beef Wrap", category: "wraps", price: 3190,
    shortDescription: "Vită gătită lent 10 ore, sos BBQ peri-peri, ardei copți și spanac baby.",
    description: "Vită gătită lent timp de 10 ore și trasă în fibre, sos BBQ peri-peri, ardei copți, spanac baby, ceapă murată și sos de iaurt cu lămâie, într-o tortilla cu spanac.",
    ingredients: ["Tortilla cu spanac", "Vită trasă", "Sos BBQ peri-peri", "Ardei copți", "Spanac baby", "Ceapă murată", "Sos de iaurt"],
    allergens: ["Gluten", "Lapte", "Muștar"],
    weight: 340, calories: 610, isNew: true, options: wrapExtras,
  },
  // ── Combo
  {
    slug: "classic-combo", name: "Classic Combo", category: "combo", price: 4490, oldPrice: 5290,
    shortDescription: "Classic Smash, cartofi clasici și o băutură de 0,33 l la alegere.",
    description: "Meniul care ne-a făcut cunoscuți: un Classic Smash, o porție de cartofi tăiați zilnic și prăjiți de două ori, plus o băutură răcoritoare la doză. Scrie-ne băutura preferată în observații.",
    ingredients: ["Classic Smash", "Cartofi clasici", "Băutură 0,33 l"],
    allergens: ["Gluten", "Lapte", "Ouă", "Muștar", "Susan"],
    weight: 460, calories: 1150, popular: true, featured: true, options: comboExtras,
  },
  {
    slug: "double-burger-combo", name: "Double Burger Combo", category: "combo", price: 6990, oldPrice: 7980,
    shortDescription: "Doi burgeri Classic Smash, cartofi mari și două băuturi — meniul pentru doi.",
    description: "Pentru două persoane: doi burgeri Classic Smash, o porție mare de cartofi clasici cu sare de mare și două băuturi la doză. Cel mai bun raport preț–sațietate din meniu.",
    ingredients: ["2 × Classic Smash", "Cartofi mari", "2 × Băutură 0,33 l"],
    allergens: ["Gluten", "Lapte", "Ouă", "Muștar", "Susan"],
    weight: 860, calories: 2100, featured: true, options: comboExtras,
  },
  {
    slug: "chicken-combo", name: "Chicken Combo", category: "combo", price: 4690, oldPrice: 5290,
    shortDescription: "Crispy Chicken burger, cartofi clasici și o băutură răcoritoare.",
    description: "Burgerul Crispy Chicken cu pulpă de pui în pané dublu, alături de o porție de cartofi clasici și o băutură răcoritoare de 0,33 l. Adaugă sos picant dacă îți place iute.",
    ingredients: ["Crispy Chicken", "Cartofi clasici", "Băutură 0,33 l"],
    allergens: ["Gluten", "Lapte", "Ouă", "Muștar"],
    weight: 500, calories: 1220, options: comboExtras,
  },
  // ── Cartofi
  {
    slug: "classic-fries", name: "Classic Fries", category: "cartofi", price: 1290,
    shortDescription: "Cartofi tăiați zilnic, prăjiți de două ori, cu sare de mare în fulgi.",
    description: "Cartofi românești curățați și tăiați în fiecare dimineață, prăjiți de două ori pentru un exterior crocant și un miez pufos, apoi asezonați cu sare de mare în fulgi.",
    ingredients: ["Cartofi", "Ulei de floarea-soarelui", "Sare de mare"],
    allergens: [],
    weight: 200, calories: 410, popular: true, gallery: true, options: friesExtras,
  },
  {
    slug: "cheesy-fries", name: "Cheesy Fries", category: "cartofi", price: 1890,
    shortDescription: "Cartofi crocanți cu sos cald de cheddar, mozzarella, ceapă verde și chili.",
    description: "Porție generoasă de cartofi crocanți acoperiți cu sos cald de cheddar maturat, mozzarella gratinată, ceapă verde și fulgi de chili pentru un final ușor iute.",
    ingredients: ["Cartofi", "Sos de cheddar", "Mozzarella", "Ceapă verde", "Fulgi de chili"],
    allergens: ["Lapte"],
    weight: 280, calories: 620, options: friesExtras,
  },
  {
    slug: "loaded-fries", name: "Loaded Fries", category: "cartofi", price: 2490,
    shortDescription: "Cartofi cu bacon crocant, sos alb de brânză, ciuperci sotate și pătrunjel.",
    description: "Inspirați de poutine: cartofi prăjiți de două ori, sos alb de brânză, bacon afumat crocant, ciuperci sotate cu usturoi, spanac și pătrunjel proaspăt. Practic, o masă completă.",
    ingredients: ["Cartofi", "Sos alb de brânză", "Bacon afumat", "Ciuperci", "Spanac", "Pătrunjel"],
    allergens: ["Lapte", "Gluten"],
    weight: 380, calories: 840, isNew: true, options: friesExtras,
  },
  // ── Deserturi
  {
    slug: "chocolate-brownie", name: "Chocolate Brownie", category: "deserturi", price: 1690,
    shortDescription: "Brownie dens cu ciocolată belgiană 70%, servit cald cu sos de ciocolată.",
    description: "Brownie copt în casă cu ciocolată belgiană 70%, unt și zahăr brun: crocant deasupra, fondant la mijloc. Îl servim cald, stropit cu sos de ciocolată.",
    ingredients: ["Ciocolată belgiană 70%", "Unt", "Zahăr brun", "Ouă", "Făină"],
    allergens: ["Gluten", "Lapte", "Ouă", "Soia"],
    weight: 140, calories: 520, popular: true,
    options: [{ name: "Bilă de înghețată de vanilie", price: 600 }],
  },
  {
    slug: "cheesecake", name: "Cheesecake", category: "deserturi", price: 1990,
    shortDescription: "Cheesecake New York pe bază de biscuiți, cu compot de afine sălbatice.",
    description: "Cheesecake New York copt lent, cu cremă de brânză și vanilie Bourbon, pe o bază de biscuiți cu unt, acoperit cu compot de afine sălbatice.",
    ingredients: ["Cremă de brânză", "Vanilie Bourbon", "Biscuiți cu unt", "Afine sălbatice"],
    allergens: ["Gluten", "Lapte", "Ouă"],
    weight: 160, calories: 480, isNew: true, options: [],
  },
  {
    slug: "cookie", name: "Cookie", category: "deserturi", price: 990,
    shortDescription: "Cookie de 120 g cu bucăți de ciocolată neagră și fulgi de sare de mare.",
    description: "Cookie de 120 g cu margini crocante și centru moale, plin de bucăți de ciocolată neagră și ciocolată cu lapte, terminat cu fulgi de sare de mare. Copt în fiecare zi.",
    ingredients: ["Făină", "Unt", "Ciocolată neagră", "Ciocolată cu lapte", "Sare de mare"],
    allergens: ["Gluten", "Lapte", "Ouă", "Soia"],
    weight: 120, calories: 540, options: [],
  },
  // ── Băuturi
  {
    slug: "coca-cola", name: "Coca-Cola", category: "bauturi", price: 890,
    shortDescription: "Coca-Cola Original Taste la doză de 330 ml, servită rece.",
    description: "Coca-Cola Original Taste la doză de 330 ml, păstrată la rece și servită cu gheață la cerere. Clasicul care merge cu orice burger.",
    ingredients: ["Băutură răcoritoare carbogazoasă"],
    allergens: [],
    weight: 330, weightUnit: "ml", calories: 139, popular: true,
    options: [{ name: "Varianta Zero Sugar", price: 0 }],
  },
  {
    slug: "fanta", name: "Fanta", category: "bauturi", price: 890,
    shortDescription: "Fanta Orange la doză de 330 ml, cu gust intens de portocale.",
    description: "Fanta Orange la doză de 330 ml, cu gust de portocale și bule fine. O găsești și în varianta Zero Sugar, la același preț.",
    ingredients: ["Băutură răcoritoare carbogazoasă cu suc de portocale"],
    allergens: [],
    weight: 330, weightUnit: "ml", calories: 125,
    options: [{ name: "Varianta Zero Sugar", price: 0 }],
  },
  {
    slug: "sprite", name: "Sprite", category: "bauturi", price: 890,
    shortDescription: "Sprite cu lămâie și lime, 330 ml — fără cofeină, foarte rece.",
    description: "Sprite cu aromă de lămâie și lime la doză de 330 ml: răcoritor, fără cofeină, perfect lângă aripioarele picante.",
    ingredients: ["Băutură răcoritoare carbogazoasă cu aromă de lămâie și lime"],
    allergens: [],
    weight: 330, weightUnit: "ml", calories: 66, options: [],
  },
  {
    slug: "lemonade", name: "Lemonade", category: "bauturi", price: 1490,
    shortDescription: "Limonadă stoarsă la comandă cu lămâie, lime și mentă proaspătă, 500 ml.",
    description: "Stoarsă la comandă din lămâi și lime, îndulcită ușor cu sirop de trestie și servită cu mentă proaspătă și multă gheață. 500 ml.",
    ingredients: ["Lămâie", "Lime", "Mentă proaspătă", "Sirop de trestie", "Gheață"],
    allergens: [],
    weight: 500, weightUnit: "ml", calories: 150, isNew: true,
    options: [{ name: "Cu ghimbir proaspăt", price: 200 }, { name: "Fără zahăr", price: 0 }],
  },
  {
    slug: "milkshake", name: "Milkshake", category: "bauturi", price: 1990,
    shortDescription: "Înghețată artizanală de vanilie și căpșuni proaspete, cu frișcă. 400 ml.",
    description: "Înghețată artizanală de vanilie mixată cu lapte integral și căpșuni proaspete, servită cu frișcă și o căpșună întreagă deasupra. 400 ml de răsfăț.",
    ingredients: ["Înghețată de vanilie", "Lapte integral", "Căpșuni", "Frișcă"],
    allergens: ["Lapte"],
    weight: 400, weightUnit: "ml", calories: 560, popular: true,
    options: [{ name: "Frișcă extra", price: 300 }, { name: "Topping de biscuiți Oreo", price: 400 }],
  },
];

const locations = [
  { name: "Fast Burgers Centru", address: "Str. Ion Câmpineanu 21, Sector 1, București", phone: "+40 721 000 321", hours: "Zilnic 11:00 – 23:00" },
  { name: "Fast Burgers Floreasca", address: "Calea Floreasca 175, Sector 1, București", phone: "+40 721 000 322", hours: "Zilnic 11:00 – 23:00" },
  { name: "Fast Burgers Militari", address: "Bd. Iuliu Maniu 546, Sector 6, București", phone: "+40 721 000 323", hours: "Zilnic 11:00 – 22:00" },
];

const reviews = [
  { name: "Andreea Popescu", rating: 5, daysAgo: 3, text: "Classic Smash-ul are exact crusta aia caramelizată pe care o cauți. Am comandat la 20:10 și la 20:42 era la ușă, încă fierbinte." },
  { name: "Mihai Ionescu", rating: 5, daysAgo: 6, text: "Hot Wings sunt cu adevărat iuți, iar dip-ul de brânză albastră e făcut ca la carte. Cel mai bun fast-food din zonă, fără discuție." },
  { name: "Ioana Dumitrescu", rating: 4, daysAgo: 11, text: "Pizza Pepperoni cu miere și chili m-a surprins plăcut. Blatul e aerat și nu se înmoaie nici după livrare." },
  { name: "Radu Constantin", rating: 5, daysAgo: 15, text: "Loaded Fries e practic o masă întreagă. Bacon crocant, sos cremos, porție generoasă. Revin sigur." },
  { name: "Elena Marin", rating: 5, daysAgo: 21, text: "Comand Double Burger Combo pentru mine și iubitul meu în fiecare vineri. Prețul e corect și calitatea constantă." },
  { name: "Vlad Stoica", rating: 4, daysAgo: 30, text: "Limonada făcută în casă e excelentă, nu e siropoasă. Crispy Chicken-ul e suculent și foarte bine condimentat." },
];

function imagePath(slug: string, file = "main.webp") {
  return `/images/products/${slug}/${file}`;
}

// ── Safety settings (explicit, via environment variables) ──────────────────────
//  SEED_ALLOW_RESET=true   allow wiping a database that already contains catalog or
//                          orders (meant for local development only). Default: false.
//  SEED_DEMO_ORDERS=true|false  create the 7 fictional demo orders.
//                          Default: true for a local database, false for a remote one.
//  ADMIN_EMAIL / ADMIN_PASSWORD  required — there is no default password. For a remote
//                          database the password must be strong.

class SeedConfigError extends Error {}

function readFlag(name: string, fallback: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (raw === undefined || raw === "") return fallback;
  if (raw === "true") return true;
  if (raw === "false") return false;
  throw new SeedConfigError(`${name} must be "true" or "false".`);
}

function isLocalDatabase(): boolean {
  try {
    const host = new URL(process.env.DATABASE_URL ?? "").hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

const WEAK_PASSWORDS = new Set(["admin123!", "change-me", "password", "password123", "admin", "admin123", "qwerty123"]);

/** Validates admin credentials without ever printing the password. */
function resolveAdmin(remote: boolean) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new SeedConfigError("ADMIN_EMAIL is missing or not a valid email address.");
  }
  if (!password) throw new SeedConfigError("ADMIN_PASSWORD is missing — there is no default password.");
  if (remote) {
    const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
    if (password.length < 12 || classes < 3 || WEAK_PASSWORDS.has(password.toLowerCase())) {
      throw new SeedConfigError(
        "ADMIN_PASSWORD is too weak for a remote database: use at least 12 characters with at least " +
          "three of lowercase, uppercase, digits and symbols (and not a known default).",
      );
    }
  }
  return { email, password };
}

/** Refuses to wipe a database that already holds a catalog or orders. */
async function assertSafeToReset(allowReset: boolean) {
  const [categories, products, orders] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
    prisma.order.count(),
  ]);
  if (categories + products + orders === 0) return;
  if (!allowReset) {
    throw new SeedConfigError(
      `Database is not empty (${categories} categories, ${products} products, ${orders} orders). ` +
        "Seeding would delete them, so nothing was changed. To reset a LOCAL dev database on purpose, " +
        "set SEED_ALLOW_RESET=true.",
    );
  }
  console.log(`SEED_ALLOW_RESET=true — resetting ${categories} categories, ${products} products, ${orders} orders.`);
}

async function main() {
  // 1. Validate everything before touching the database.
  const remote = !isLocalDatabase();
  const allowReset = readFlag("SEED_ALLOW_RESET", false);
  const seedDemoOrders = readFlag("SEED_DEMO_ORDERS", !remote);
  const admin = resolveAdmin(remote);
  if (remote && allowReset) {
    console.warn("⚠ SEED_ALLOW_RESET=true on a REMOTE database — existing data will be deleted.");
  }
  console.log(`Target: ${remote ? "remote" : "local"} database · demo orders: ${seedDemoOrders ? "yes" : "no"}`);

  // 2. Refuse to wipe existing data unless explicitly allowed.
  await assertSafeToReset(allowReset);

  console.log("Seeding catalog…");
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productOption.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.location.deleteMany();
  await prisma.review.deleteMany();

  const adminEmail = admin.email;
  const adminPassword = admin.password;
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN", passwordHash: await bcrypt.hash(adminPassword, 12) },
    create: {
      email: adminEmail,
      name: "Administrator",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(adminPassword, 12),
      sessionVersion: 0,
    },
  });

  const categoryIds = new Map<string, string>();
  for (const [index, c] of categories.entries()) {
    const created = await prisma.category.create({
      data: { ...c, image: `/images/categories/${c.slug}.webp`, order: index, active: true },
    });
    categoryIds.set(c.slug, created.id);
  }

  // Proposed dishes: drafts, hidden, no photo — see prisma/menu-drafts.ts.
  for (const c of draftCategories) {
    const created = await prisma.category.create({
      data: { ...c, image: null, order: categories.length + draftCategories.indexOf(c), active: false },
    });
    categoryIds.set(c.slug, created.id);
  }

  const productIds = new Map<string, { id: string; price: number; name: string; image: string }>();
  for (const [index, p] of products.entries()) {
    const categoryId = categoryIds.get(p.category);
    if (!categoryId) throw new Error(`Unknown category ${p.category}`);
    const image = imagePath(p.slug);
    const created = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        shortDescription: p.shortDescription,
        price: p.price,
        oldPrice: p.oldPrice ?? null,
        image,
        images: p.gallery ? [image, imagePath(p.slug, "2.webp")] : [image],
        ingredients: p.ingredients,
        allergens: p.allergens,
        weight: p.weight,
        weightUnit: p.weightUnit ?? "g",
        calories: p.calories,
        categoryId,
        popular: p.popular ?? false,
        featured: p.featured ?? false,
        isNew: p.isNew ?? false,
        active: true,
        sortOrder: index,
        options: { create: p.options.map((o) => ({ ...o, active: true })) },
      },
    });
    productIds.set(p.slug, { id: created.id, price: created.price, name: created.name, image });
  }
  for (const [index, d] of draftProducts.entries()) {
    const categoryId = categoryIds.get(d.category);
    if (!categoryId) throw new Error(`Unknown category ${d.category}`);
    await prisma.product.create({
      data: {
        name: d.name,
        slug: d.slug,
        description: d.description,
        shortDescription: d.shortDescription,
        price: d.price,
        image: "",
        images: [],
        ingredients: d.ingredients,
        allergens: [],
        weight: d.weight,
        weightUnit: d.weightUnit ?? "g",
        categoryId,
        spicy: d.spicy ?? false,
        draft: true,
        active: false,
        sortOrder: products.length + index,
      },
    });
  }

  const createdLocations = [];
  for (const l of locations) createdLocations.push(await prisma.location.create({ data: l }));

  for (const r of reviews) {
    await prisma.review.create({
      data: {
        name: r.name,
        rating: r.rating,
        text: r.text,
        createdAt: new Date(Date.now() - r.daysAgo * 86_400_000),
      },
    });
  }

  // A handful of orders so the admin dashboard has something to show.
  const demoOrders: {
    status: OrderStatus;
    method: DeliveryMethod;
    payment: PaymentMethod;
    hoursAgo: number;
    name: string;
    items: [string, number][];
  }[] = [
    { status: "NEW", method: "DELIVERY", payment: "CARD_ON_DELIVERY", hoursAgo: 0.2, name: "Ana Georgescu", items: [["classic-combo", 2], ["milkshake", 1]] },
    { status: "CONFIRMED", method: "PICKUP", payment: "CASH", hoursAgo: 0.6, name: "Cristian Matei", items: [["pepperoni", 1], ["hot-wings", 1]] },
    { status: "PREPARING", method: "DELIVERY", payment: "CASH", hoursAgo: 1.1, name: "Diana Pavel", items: [["double-cheese", 1], ["loaded-fries", 1], ["coca-cola", 2]] },
    { status: "OUT_FOR_DELIVERY", method: "DELIVERY", payment: "CARD_ON_DELIVERY", hoursAgo: 1.6, name: "George Neagu", items: [["chicken-box", 1], ["lemonade", 2]] },
    { status: "COMPLETED", method: "PICKUP", payment: "CARD_ON_DELIVERY", hoursAgo: 26, name: "Laura Enache", items: [["classic-smash", 2], ["classic-fries", 2]] },
    { status: "COMPLETED", method: "DELIVERY", payment: "CASH", hoursAgo: 50, name: "Paul Dinu", items: [["double-burger-combo", 1], ["chocolate-brownie", 2]] },
    { status: "CANCELLED", method: "DELIVERY", payment: "CASH", hoursAgo: 72, name: "Irina Toma", items: [["margherita", 1]] },
  ];

  for (const [i, o] of (seedDemoOrders ? demoOrders : []).entries()) {
    const items = o.items.map(([slug, quantity]) => {
      const p = productIds.get(slug);
      if (!p) throw new Error(`Unknown product ${slug}`);
      return {
        productId: p.id, productName: p.name, productSlug: slug, image: p.image,
        quantity, price: p.price, options: [], total: p.price * quantity,
      };
    });
    const subtotal = items.reduce((s, it) => s + it.total, 0);
    const deliveryFee = o.method === "DELIVERY" && subtotal < 8000 ? 999 : 0;
    await prisma.order.create({
      data: {
        number: `FB-DEMO${String(i + 1).padStart(3, "0")}`,
        customerName: o.name,
        customerPhone: `+4072100${String(1000 + i)}`,
        customerEmail: `client${i + 1}@example.com`,
        deliveryMethod: o.method,
        deliveryAddress: o.method === "DELIVERY" ? "Str. Exemplu 10, Bl. A2, Ap. 14, București" : null,
        locationId: o.method === "PICKUP" ? createdLocations[0].id : null,
        paymentMethod: o.payment,
        status: o.status,
        subtotal, deliveryFee, total: subtotal + deliveryFee,
        createdAt: new Date(Date.now() - o.hoursAgo * 3_600_000),
        items: { create: items },
      },
    });
  }

  console.log(
    `Seeded ${categories.length} categories, ${products.length} products, ${locations.length} locations, ` +
      `${seedDemoOrders ? demoOrders.length : 0} demo orders.`,
  );
  console.log(`Admin: ${adminEmail}`);
}

main()
  .catch((error) => {
    if (error instanceof SeedConfigError) {
      console.error(`✖ Seed refused: ${error.message}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

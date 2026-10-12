// Proposed menu additions (2026-10). DRAFTS: recipes, weights and photos are not approved by the
// kitchen yet, so every item is created with draft = true and active = false and never shows on
// the site until an administrator approves the recipe, adds a photo and publishes it.
// Allergens and calories are left empty on purpose: they must come from the approved recipe.
// Prices are MDL (bani) set against verified Chișinău competitor prices — see
// data/market/chisinau-2026-10-12.csv and the admin "Piață și prețuri" page.

export type DraftCategory = { slug: string; name: string; description: string };
export type DraftProduct = {
  slug: string;
  name: string;
  category: string;
  price: number;
  shortDescription: string;
  description: string;
  ingredients: string[];
  weight: number;
  weightUnit?: "g" | "ml";
  spicy?: boolean;
};

/** New category, hidden until it has published dishes. */
export const draftCategories: DraftCategory[] = [
  { slug: "gustari", name: "Gustări", description: "Inele de ceapă, mozzarella sticks și alte gustări crocante, de împărțit." },
];

export const draftProducts: DraftProduct[] = [
  // ── Burgeri
  {
    slug: "cheeseburger", name: "Cheeseburger", category: "burgeri", price: 6500,
    shortDescription: "Un smash patty de vită Angus, cheddar, castraveți murați, ceapă, ketchup și muștar.",
    description: "Burgerul de intrare în meniu: o chiftea smash de vită Angus prăjită crocant, cheddar topit, castraveți murați, ceapă albă tocată, ketchup și muștar, în chiflă brioche prăjită.",
    ingredients: ["Chiflă brioche", "Vită Angus 1 × 90 g", "Cheddar", "Castraveți murați", "Ceapă albă", "Ketchup", "Muștar"],
    weight: 190,
  },
  {
    slug: "mushroom-swiss", name: "Mushroom Swiss", category: "burgeri", price: 12500,
    shortDescription: "Două smash patty de vită, cașcaval elvețian, ciuperci trase la tigaie și maioneză cu usturoi.",
    description: "Două chiftele smash de vită Angus cu cașcaval elvețian topit, ciuperci champignon trase la tigaie cu unt și cimbru, ceapă caramelizată și maioneză cu usturoi, în chiflă brioche.",
    ingredients: ["Chiflă brioche", "Vită Angus 2 × 80 g", "Cașcaval elvețian", "Ciuperci champignon", "Ceapă caramelizată", "Maioneză cu usturoi"],
    weight: 330,
  },
  {
    slug: "spicy-chicken-burger", name: "Spicy Chicken", category: "burgeri", price: 9900,
    shortDescription: "Pulpă de pui crocantă în pané iute, jalapeño, coleslaw și maioneză chipotle.",
    description: "Pulpă de pui marinată în lapte bătut cu ardei iute, dată prin pané condimentat și prăjită crocant, cu jalapeño, coleslaw și maioneză chipotle, în chiflă brioche.",
    ingredients: ["Chiflă brioche", "Pulpă de pui 160 g", "Pané iute", "Jalapeño", "Coleslaw", "Maioneză chipotle"],
    weight: 300, spicy: true,
  },
  // ── Chicken
  {
    slug: "chicken-nuggets", name: "Chicken Nuggets 9 buc.", category: "chicken", price: 9500,
    shortDescription: "Nouă bucăți de piept de pui în pané crocant, cu un sos la alegere.",
    description: "Piept de pui tocat grosier, format în nuggets, dat prin pané crocant și prăjit până devine auriu. Nouă bucăți, servite cu un sos la alegere.",
    ingredients: ["Piept de pui", "Pané crocant", "Sos la alegere"],
    weight: 180,
  },
  // ── Wraps
  {
    slug: "chicken-caesar-wrap", name: "Chicken Caesar Wrap", category: "wraps", price: 8900,
    shortDescription: "Pui la grătar, salată romană, parmezan, crutoane și sos Caesar, în tortilla.",
    description: "Piept de pui la grătar feliat, salată romană, parmezan ras, crutoane și sos Caesar, rulate strâns în tortilla caldă din grâu.",
    ingredients: ["Tortilla", "Piept de pui la grătar", "Salată romană", "Parmezan", "Crutoane", "Sos Caesar"],
    weight: 300,
  },
  {
    slug: "spicy-chicken-wrap", name: "Spicy Chicken Wrap", category: "wraps", price: 9200,
    shortDescription: "Fâșii de pui crocant în pané iute, jalapeño, salată, roșii și maioneză chipotle.",
    description: "Fâșii de pui crocant în pané iute, salată iceberg, roșii, jalapeño și maioneză chipotle, rulate în tortilla caldă.",
    ingredients: ["Tortilla", "Fâșii de pui în pané iute", "Salată iceberg", "Roșii", "Jalapeño", "Maioneză chipotle"],
    weight: 320, spicy: true,
  },
  // ── Pizza
  {
    slug: "diavola", name: "Diavola", category: "pizza", price: 14500,
    shortDescription: "Salam picant, mozzarella, sos de roșii și ulei cu chili.",
    description: "Blat crescut 48 de ore, sos de roșii, mozzarella și salam picant, terminată cu un fir de ulei cu chili după cuptor.",
    ingredients: ["Blat cu maia", "Sos de roșii", "Mozzarella", "Salam picant", "Ulei cu chili"],
    weight: 500, spicy: true,
  },
  // ── Cartofi
  {
    slug: "potato-wedges", name: "Cartofi wedges", category: "cartofi", price: 4900,
    shortDescription: "Felii groase de cartof cu coajă, condimentate și coapte crocant.",
    description: "Cartofi tăiați felii groase cu coajă, condimentați cu boia afumată și usturoi, prăjiți până devin crocanți la exterior și moi în interior.",
    ingredients: ["Cartofi", "Boia afumată", "Usturoi granulat", "Sare"],
    weight: 180,
  },
  // ── Gustări (new category)
  {
    slug: "onion-rings", name: "Inele de ceapă", category: "gustari", price: 5500,
    shortDescription: "Inele de ceapă în aluat crocant, cu sos BBQ.",
    description: "Inele groase de ceapă dulce, trecute prin aluat crocant și prăjite până devin aurii. Servite cu sos BBQ.",
    ingredients: ["Ceapă", "Aluat crocant", "Sos BBQ"],
    weight: 150,
  },
  {
    slug: "mozzarella-sticks", name: "Mozzarella sticks", category: "gustari", price: 6500,
    shortDescription: "Batoane de mozzarella în pesmet, cu sos marinara.",
    description: "Batoane de mozzarella trecute prin pesmet condimentat și prăjite până se topesc în interior. Servite cu sos marinara.",
    ingredients: ["Mozzarella", "Pesmet condimentat", "Sos marinara"],
    weight: 150,
  },
  // ── Combo-uri
  {
    slug: "combo-for-two", name: "Combo pentru doi", category: "combo", price: 29900,
    shortDescription: "Două Classic Smash, două porții de cartofi clasici și două băuturi de 0,33 l.",
    description: "Pentru o seară în doi: două burgeri Classic Smash, două porții de cartofi clasici și două băuturi de 0,33 l la alegere.",
    ingredients: ["2 × Classic Smash", "2 × Cartofi clasici", "2 × Băutură 0,33 l"],
    weight: 920,
  },
  {
    slug: "family-box", name: "Family Box", category: "combo", price: 54900,
    shortDescription: "Patru burgeri (2 Classic Smash, 2 Crispy Chicken), patru porții de cartofi și patru băuturi.",
    description: "Pentru toată familia: două Classic Smash, două Crispy Chicken, patru porții de cartofi clasici și patru băuturi de 0,33 l la alegere.",
    ingredients: ["2 × Classic Smash", "2 × Crispy Chicken", "4 × Cartofi clasici", "4 × Băutură 0,33 l"],
    weight: 1920,
  },
  // ── Deserturi
  {
    slug: "chocolate-cake", name: "Tort de ciocolată", category: "deserturi", price: 6500,
    shortDescription: "Felie de tort cu blat de cacao, cremă de ciocolată și glazură.",
    description: "Felie de tort cu blat de cacao, cremă de ciocolată neagră și glazură lucioasă, cu fructe de pădure proaspete.",
    ingredients: ["Blat de cacao", "Cremă de ciocolată neagră", "Glazură de ciocolată", "Fructe de pădure"],
    weight: 150,
  },
  // ── Băuturi
  {
    slug: "iced-tea", name: "Ceai rece de piersici", category: "bauturi", price: 3500,
    shortDescription: "Ceai negru infuzat la rece, cu piersici și lămâie, făcut în casă.",
    description: "Ceai negru infuzat la rece peste noapte, cu piure de piersici, lămâie și puțin zahăr. Făcut în casă, servit cu gheață.",
    ingredients: ["Ceai negru", "Piure de piersici", "Lămâie", "Zahăr", "Gheață"],
    weight: 400, weightUnit: "ml",
  },
  {
    slug: "still-water", name: "Apă plată", category: "bauturi", price: 2000,
    shortDescription: "Apă minerală plată, 0,5 l.",
    description: "Apă minerală plată, la sticlă de 0,5 l, servită rece.",
    ingredients: ["Apă minerală plată 0,5 l"],
    weight: 500, weightUnit: "ml",
  },
];

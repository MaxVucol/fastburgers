# Fast Burgers

Website complet pentru un restaurant fast-food: meniu cu căutare și filtre, pagini de produs cu extra-uri și preț dinamic, coș, checkout, urmărirea comenzii și panou de administrare (produse, categorii, comenzi).

**Stack:** Next.js 16 (App Router, Cache Components, Server Actions) · TypeScript strict · MongoDB · Prisma 6 · Tailwind CSS 4 · Zod · Lucide.

> Prisma 7 nu are (încă) suport pentru MongoDB, de aceea proiectul folosește Prisma 6.19.

## Pornire rapidă

```bash
npm install
cp .env.example .env          # completează AUTH_SECRET (min. 32 caractere)
npm run db                    # MongoDB local (replica set) — lasă-l pornit într-un terminal separat
npm run db:push               # creează colecțiile și indexurile
npm run db:seed               # date demo: 8 categorii, 27 produse, 3 locații, comenzi demo
npm run dev                   # http://localhost:3000
```

`npm run db` descarcă la prima rulare un binar oficial `mongod` (prin `mongodb-memory-server`) și pornește un replica set cu un singur nod pe portul 27017, cu datele salvate în `.mongo-data/`. Nu e nevoie de Docker. În producție, setează `DATABASE_URL` către MongoDB Atlas sau orice replica set (Prisma are nevoie de replica set).

**Admin:** `/admin` — utilizatorul este creat de seed din `ADMIN_EMAIL` / `ADMIN_PASSWORD` (implicit `admin@fastburgers.ro` / `Admin123!` — schimbă-l).

## Deploy pe Vercel

`.env` nu este (și nu trebuie să fie) în Git, deci pe Vercel toate variabilele se setează în **Project → Settings → Environment Variables**, bifate pentru **Production** și **Preview**. `npm run build` rulează mai întâi `scripts/check-env.mjs`, care oprește build-ul cu un mesaj clar dacă lipsește ceva.

| Variabilă | Obligatorie | Valoare |
| --- | --- | --- |
| `DATABASE_URL` | da (și la build) | `mongodb+srv://<user>:<parolă>@<cluster>.mongodb.net/fastburgers?retryWrites=true&w=majority` |
| `AUTH_SECRET` | da | min. 32 caractere aleatorii (`openssl rand -base64 32`) |
| `BLOB_READ_WRITE_TOKEN` | da, pentru upload în admin | se creează automat când conectezi un **Vercel Blob** store (Storage → Blob) |
| `NEXT_PUBLIC_SITE_URL` | recomandat | domeniul final, de ex. `https://fastburgers.ro` (altfel se folosește domeniul de producție Vercel) |

Pași, o singură dată:

1. **MongoDB Atlas:** creează un cluster. Atlas e replica set, deci compatibil cu Prisma. Creează un utilizator de bază de date. În **Network Access**, adaugă `0.0.0.0/0`, pentru că Vercel nu are IP-uri fixe.
2. **Connection string:** ia-l din Atlas (Connect → Drivers) și **adaugă numele bazei** după `.mongodb.net/`, adică `/fastburgers`, fără de care Prisma refuză conexiunea. Dacă parola conține caractere speciale (`@ : / ? # %`), codifică-le URL.
3. **Populează baza Atlas** de pe calculatorul tău, fără să salvezi URL-ul în fișiere:
   ```powershell
   $env:DATABASE_URL = "<connection string Atlas>"
   npx prisma db push
   npx prisma db seed      # doar prima dată — seed-ul resetează catalogul și comenzile
   Remove-Item Env:DATABASE_URL
   ```
   Seed-ul creează adminul din `ADMIN_EMAIL` / `ADMIN_PASSWORD` din `.env`. Folosește o parolă puternică.
4. Setează variabilele de mai sus în Vercel, conectează Blob store-ul și fă **Redeploy**.

Imaginile încărcate din admin merg în Vercel Blob când există `BLOB_READ_WRITE_TOKEN`. Local, fără token, rămân în `storage/uploads`. Fotografiile demo din `public/images` sunt în Git și funcționează oriunde.

## Scripturi

| Script | Rol |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js (`build` verifică întâi variabilele de mediu) |
| `npm run check-env` | Verifică doar variabilele de mediu |
| `npm run typecheck` · `npm run lint` | TypeScript și ESLint |
| `npm run db` | MongoDB local pentru dezvoltare |
| `npm run db:push` · `npm run db:seed` | Schema Prisma și date demo (seed-ul **resetează** catalogul și comenzile) |
| `npm run images:fetch` | Re-descarcă fotografiile demo în `public/images` |

`next build` citește catalogul din baza de date pentru a pre-randa paginile, deci baza de date trebuie să fie accesibilă la build.

## Limbi (RO / RU / EN)

- Româna este limba implicită și nu are prefix în URL (`/menu`); rusa și engleza au `/ru/…` și `/en/…`. `proxy.ts` rescrie intern URL-urile fără prefix către `app/[lang]` și ține minte limba aleasă (cookie `NEXT_LOCALE`).
- Textele interfeței: `lib/i18n/dictionaries/{ro,ru,en}.ts` (ru/en sunt verificate de TypeScript față de ro).
- Baza de date rămâne în română. Traducerile RU/EN ale catalogului demo sunt în `lib/i18n/catalog-translations.ts`, după slug; un produs nou adăugat din admin apare în română pe /ru și /en până i se adaugă traducerea acolo.
- Panoul de administrare este doar în română.

## Structură

```
app/[lang]/          pagini publice (ro fără prefix, /ru, /en): /, /menu, /menu/[slug], /categorii/[slug], /checkout,
                     /order/[number], /account, /about, /contact
app/admin/           /admin/login și panoul (dashboard, comenzi, produse, categorii)
app/media/[file]     servește imaginile încărcate din admin
actions/             Server Actions (checkout, cont, auth, admin/*)
services/            acces la date: catalog (cache-uit), comenzi, admin
lib/                 prisma, auth (JWT + sesiune), validare (zod), prețuri, format, SEO, storage
components/          ui/ (design system), layout/, cart/, product/, menu/, home/, checkout/, admin/
prisma/              schema.prisma și seed.ts
proxy.ts             limbă (rewrite/redirect) și protecție optimistă pentru /admin
lib/i18n/            configurare limbi, dicționare, traduceri catalog
```

## Decizii importante

- **Prețurile sunt în bani** (întregi), afișate ca „32,90 lei”.
- **Serverul nu are încredere în client.** Checkout-ul trimite doar ID-uri de produs, ID-uri de opțiuni și cantități; prețurile, taxa de livrare și totalul sunt recalculate din baza de date. Liniile de comandă păstrează un snapshot (nume, preț, extra-uri), astfel că istoricul rămâne corect dacă produsul se schimbă.
- **Caching:** catalogul folosește `"use cache"` cu tag-uri (`products`, `categories`, `product:<slug>`). Acțiunile din admin apelează `updateTag`, deci modificările apar imediat în site. Paginile de meniu, produs și categorie sunt pre-randate static.
- **Autentificare admin:** cookie JWT semnat (`jose`, httpOnly), verificat optimist în `proxy.ts` și verificat **în baza de date** în fiecare pagină și Server Action de admin (`requireAdmin`).
- **Imagini încărcate:** convertite în WebP cu `sharp`. Se salvează în Vercel Blob dacă există `BLOB_READ_WRITE_TOKEN`, altfel în `storage/uploads` (în afara `public/`). Pentru S3 sau Cloudinary, înlocuiește funcțiile din `lib/storage.ts`.
- **Plata online** este pregătită ca opțiune („În curând”). Punctul de integrare este marcat în `services/orders.ts` (`CARD_ONLINE`).

## Imagini

Fotografiile demo provin de pe [Unsplash](https://unsplash.com/license) (licență gratuită pentru uz comercial) și sunt normalizate de `scripts/fetch-images.mjs`: crop 4:3, WebP și o corecție de culoare comună. Sunt organizate după slug în `public/images/products/<slug>/`.

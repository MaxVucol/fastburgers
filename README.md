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

## Scripturi

| Script | Rol |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` · `npm run lint` | TypeScript și ESLint |
| `npm run db` | MongoDB local pentru dezvoltare |
| `npm run db:push` · `npm run db:seed` | Schema Prisma și date demo (seed-ul **resetează** catalogul și comenzile) |
| `npm run images:fetch` | Re-descarcă fotografiile demo în `public/images` |

`next build` citește catalogul din baza de date pentru a pre-randa paginile, deci baza de date trebuie să fie accesibilă la build.

## Structură

```
app/(site)/          pagini publice: /, /menu, /menu/[slug], /categorii/[slug], /checkout,
                     /order/[number], /account, /about, /contact
app/admin/           /admin/login și panoul (dashboard, comenzi, produse, categorii)
app/media/[file]     servește imaginile încărcate din admin
actions/             Server Actions (checkout, cont, auth, admin/*)
services/            acces la date: catalog (cache-uit), comenzi, admin
lib/                 prisma, auth (JWT + sesiune), validare (zod), prețuri, format, SEO, storage
components/          ui/ (design system), layout/, cart/, product/, menu/, home/, checkout/, admin/
prisma/              schema.prisma și seed.ts
proxy.ts             protecție optimistă pentru /admin
```

## Decizii importante

- **Prețurile sunt în bani** (întregi), afișate ca „32,90 lei”.
- **Serverul nu are încredere în client.** Checkout-ul trimite doar ID-uri de produs, ID-uri de opțiuni și cantități; prețurile, taxa de livrare și totalul sunt recalculate din baza de date. Liniile de comandă păstrează un snapshot (nume, preț, extra-uri), astfel că istoricul rămâne corect dacă produsul se schimbă.
- **Caching:** catalogul folosește `"use cache"` cu tag-uri (`products`, `categories`, `product:<slug>`). Acțiunile din admin apelează `updateTag`, deci modificările apar imediat în site. Paginile de meniu, produs și categorie sunt pre-randate static.
- **Autentificare admin:** cookie JWT semnat (`jose`, httpOnly), verificat optimist în `proxy.ts` și verificat **în baza de date** în fiecare pagină și Server Action de admin (`requireAdmin`).
- **Imagini încărcate:** convertite în WebP cu `sharp` și salvate în `storage/uploads` (în afara `public/`). Pentru S3 sau Cloudinary, înlocuiește funcțiile din `lib/storage.ts`.
- **Plata online** este pregătită ca opțiune („În curând”). Punctul de integrare este marcat în `services/orders.ts` (`CARD_ONLINE`).

## Imagini

Fotografiile demo provin de pe [Unsplash](https://unsplash.com/license) (licență gratuită pentru uz comercial) și sunt normalizate de `scripts/fetch-images.mjs`: crop 4:3, WebP și o corecție de culoare comună. Sunt organizate după slug în `public/images/products/<slug>/`.

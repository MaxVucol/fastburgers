import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChefHat, Clock, Truck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/pricing";
import type { ProductCardData } from "@/types/catalog";

export function Hero({ spotlight }: { spotlight: ProductCardData | null }) {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="container-page grid items-center gap-7 pt-5 pb-9 sm:pt-10 lg:grid-cols-[1fr_1.08fr] lg:gap-12 lg:pt-12 lg:pb-14">
        <div className="animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink-soft shadow-[var(--shadow-soft)] ring-1 ring-line sm:text-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-herb opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex size-2 rounded-full bg-herb" />
            </span>
            Deschis acum · livrare în ~30 de minute
          </p>
          <h1
            id="hero-title"
            className="mt-4 text-[2.5rem] leading-[0.98] font-extrabold text-ink min-[400px]:text-5xl sm:text-6xl xl:text-[4.25rem]"
          >
            Smash burgers <span className="text-accent">făcute ca la carte.</span>
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-muted sm:mt-5 sm:text-lg">
            Vită Angus presată pe plită încinsă, pizza cu blat crescut 48 de ore și pui crocant marinat
            peste noapte. Gătit la comandă, livrat fierbinte.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-7 sm:flex">
            <ButtonLink href="/menu" size="lg" className="px-4 sm:px-7">
              Vezi meniul
              <ArrowRight className="size-4.5" aria-hidden />
            </ButtonLink>
            <ButtonLink href="#populare" size="lg" variant="outline" className="px-4 sm:px-7">
              Comandă acum
            </ButtonLink>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2.5 text-sm text-ink-soft sm:mt-8">
            <li className="flex items-center gap-2">
              <ChefHat className="size-4 text-mustard" aria-hidden />
              Gătit la comandă, nimic ținut la cald
            </li>
            <li className="flex items-center gap-2">
              <Truck className="size-4 text-herb" aria-hidden />
              Livrare gratuită peste {formatPrice(FREE_DELIVERY_THRESHOLD)}
            </li>
            <li className="hidden items-center gap-2 sm:flex">
              <Clock className="size-4 text-accent" aria-hidden />
              Zilnic 11:00 – 23:00
            </li>
          </ul>
        </div>

        <div className="relative">
          <div className="relative aspect-[16/11] overflow-hidden rounded-[1.75rem] bg-sand shadow-[var(--shadow-lift)] sm:aspect-[4/3] lg:aspect-[5/4]">
            <Image
              src="/images/hero/hero.webp"
              alt="Burger smash dublu cu cheddar topit, servit cu cartofi prăjiți crocanți pe un platou de lemn"
              fill
              preload
              sizes="(min-width: 1280px) 620px, (min-width: 1024px) 52vw, 100vw"
              className="object-cover"
            />
          </div>

          {spotlight && (
            <Link
              href={`/menu/${spotlight.slug}`}
              className="group absolute -bottom-5 left-3 flex max-w-[calc(100%-1.5rem)] items-center gap-3 rounded-2xl bg-white/95 p-2.5 pr-4 shadow-[var(--shadow-lift)] ring-1 ring-line backdrop-blur sm:left-6 sm:p-3 sm:pr-5"
            >
              <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-sand sm:size-16">
                <Image src={spotlight.image} alt="" fill sizes="64px" className="object-cover" />
              </span>
              <span className="min-w-0">
                <span className="block text-[0.7rem] font-bold tracking-wider text-accent uppercase">
                  Cel mai comandat
                </span>
                <span className="block truncate font-display text-lg leading-tight font-extrabold">
                  {spotlight.name}
                </span>
                <span className="text-sm font-semibold text-muted tabular-nums">
                  {formatPrice(spotlight.price)}
                </span>
              </span>
              <ArrowRight
                className="ml-1 size-5 shrink-0 text-ink transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

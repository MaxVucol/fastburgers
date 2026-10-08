import Image from "next/image";
import Link from "next/link";
import { QuickAddButton } from "@/components/cart/add-to-cart-button";
import { discountPercent, formatPrice } from "@/lib/format";
import type { ProductCardData } from "@/types/catalog";

export function PromoBanner({ product }: { product: ProductCardData }) {
  const discount = discountPercent(product.price, product.oldPrice);
  return (
    <section aria-labelledby="promo-title" className="container-page py-10 sm:py-14">
      <div className="reveal grid overflow-hidden rounded-[1.75rem] bg-accent text-white lg:grid-cols-2">
        <div className="relative aspect-[16/10] lg:order-2 lg:aspect-auto lg:min-h-[22rem]">
          <Image
            src="/images/promo/promo.webp"
            alt="Burger cu vită, cheddar, salată și roșii pe chiflă cu susan"
            fill
            sizes="(min-width: 1024px) 640px, 100vw"
            className="object-cover"
          />
          {discount && (
            <span className="absolute top-4 right-4 grid size-20 rotate-6 place-items-center rounded-full bg-mustard text-center font-display leading-none font-extrabold text-ink shadow-lg sm:size-24">
              <span>
                <span className="block text-2xl sm:text-3xl">-{discount}%</span>
                <span className="text-[0.65rem] tracking-wider uppercase">ofertă</span>
              </span>
            </span>
          )}
        </div>
        <div className="flex flex-col justify-center gap-5 p-6 sm:p-10 lg:p-12">
          <p className="text-xs font-bold tracking-[0.2em] text-white/80 uppercase">Oferta săptămânii</p>
          <h2 id="promo-title" className="text-3xl leading-[1.05] font-extrabold sm:text-5xl">
            {product.name}: burger, cartofi și băutură.
          </h2>
          <p className="max-w-md text-white/90">{product.description}</p>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-4xl font-extrabold tabular-nums">{formatPrice(product.price)}</span>
            {product.oldPrice && (
              <span className="text-lg text-white/70 line-through tabular-nums">
                <span className="sr-only">în loc de </span>
                {formatPrice(product.oldPrice)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="w-full min-[400px]:w-auto">
              <QuickAddButton
                variant="full"
                inverse
                product={{
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  image: product.image,
                  price: product.price,
                }}
              />
            </div>
            <Link
              href={`/menu/${product.slug}`}
              className="inline-flex h-11 items-center rounded-xl px-4 font-semibold text-white ring-1 ring-white/40 hover:bg-white/10"
            >
              Personalizează
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

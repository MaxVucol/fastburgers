import Image from "next/image";
import Link from "next/link";
import { QuickAddButton } from "@/components/cart/add-to-cart-button";
import { ProductBadges } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { discountPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "@/types/catalog";

export const PRODUCT_GRID_SIZES =
  "(min-width: 1280px) 296px, (min-width: 1024px) 30vw, (min-width: 480px) 48vw, 100vw";

export function ProductCard({
  product,
  eager = false,
  headingLevel = "h3",
  className,
}: {
  product: ProductCardData;
  /** Load immediately — for cards visible in the first viewport (LCP). */
  eager?: boolean;
  headingLevel?: "h2" | "h3";
  className?: string;
}) {
  const Heading = headingLevel;
  const discount = discountPercent(product.price, product.oldPrice);
  const href = `/menu/${product.slug}`;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-soft)] ring-1 ring-line/70 transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        <Image
          src={product.image}
          alt={`${product.name} — ${product.shortDescription}`}
          fill
          sizes={PRODUCT_GRID_SIZES}
          loading={eager ? "eager" : "lazy"}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.045]"
        />
        <ProductBadges
          popular={product.popular}
          isNew={product.isNew}
          featured={product.featured}
          discount={discount}
          className="absolute top-3 left-3"
        />
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">
          {product.categoryName}
          {product.weight ? (
            <span className="normal-case">
              {" "}
              · {product.weight} {product.weightUnit}
            </span>
          ) : null}
        </p>
        <Heading className="mt-1 text-xl leading-tight font-extrabold text-ink">
          <Link
            href={href}
            className="after:absolute after:inset-0 after:z-0 after:content-[''] focus-visible:outline-none group-has-[a:focus-visible]:underline"
          >
            {product.name}
          </Link>
        </Heading>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{product.shortDescription}</p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <Price price={product.price} oldPrice={product.oldPrice} />
          <QuickAddButton
            className="relative z-10"
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              image: product.image,
              price: product.price,
            }}
          />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  eagerCount = 0,
  layout = "grid",
  className,
}: {
  products: ProductCardData[];
  eagerCount?: number;
  /** "rail": horizontal swipe list on phones (keeps sections short), grid from `sm` up. */
  layout?: "grid" | "rail";
  className?: string;
}) {
  if (layout === "rail") {
    return (
      <div
        className={cn(
          "no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pt-1 pb-3 sm:mx-0 sm:pt-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 xl:grid-cols-4",
          className,
        )}
      >
        {products.map((p, i) => (
          <ProductCard
            key={p.id}
            product={p}
            eager={i < eagerCount}
            className="w-[min(78vw,20rem)] shrink-0 snap-start sm:w-auto"
          />
        ))}
      </div>
    );
  }
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} eager={i < eagerCount} />
      ))}
    </div>
  );
}

import Image from "next/image";
import { Phone } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

export function OrderCta() {
  return (
    <section aria-labelledby="cta-title" className="container-page pb-16 sm:pb-24">
      <div className="reveal relative grid items-center gap-6 overflow-hidden rounded-[1.75rem] bg-sand p-6 ring-1 ring-line sm:p-10 md:grid-cols-[1.2fr_1fr] lg:p-14">
        <div>
          <h2 id="cta-title" className="text-3xl leading-[1.05] font-extrabold sm:text-5xl">
            Ți-e foame? <br className="hidden sm:block" />
            Comandă în două minute.
          </h2>
          <p className="mt-4 max-w-md text-muted">
            Alege din meniu, plătești la livrare sau la ridicare și urmărești comanda în timp real.
          </p>
          <div className="mt-7 flex flex-col gap-3 min-[400px]:flex-row">
            <ButtonLink href="/menu" size="lg">
              Comandă acum
            </ButtonLink>
            <ButtonLink href={siteConfig.phoneHref} size="lg" variant="outline">
              <Phone className="size-4.5" aria-hidden /> {siteConfig.phone}
            </ButtonLink>
          </div>
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-full ring-8 ring-ivory md:max-w-sm">
          <Image
            src="/images/products/classic-fries/main.webp"
            alt="Cartofi prăjiți crocanți într-un bol"
            fill
            sizes="(min-width: 768px) 384px, 320px"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}

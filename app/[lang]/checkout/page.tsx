import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Spark } from "@/components/ui/brand";
import { getI18n } from "@/lib/i18n/server";
import { getLocalizedLocations } from "@/services/localized-catalog";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t.meta.checkoutTitle,
    description: t.meta.checkoutDescription,
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutPage() {
  const { locale, t } = await getI18n();
  const locations = await getLocalizedLocations(locale);
  return (
    <div className="container-page pt-10 pb-20 sm:pt-14 sm:pb-28">
      <h1 className="type-h1 mb-10 flex items-start gap-3 sm:mb-12">
        <Spark className="mt-[0.1em] size-[0.55em] shrink-0 text-accent" />
        {t.checkout.title}
      </h1>
      <CheckoutForm locations={locations} />
    </div>
  );
}

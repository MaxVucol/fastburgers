import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getPickupLocations } from "@/services/catalog";

export const metadata: Metadata = {
  title: "Finalizează comanda",
  description: "Completează datele de livrare și plasează comanda Fast Burgers.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const locations = await getPickupLocations();
  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="mb-6 text-4xl leading-[1.02] font-extrabold sm:mb-8 sm:text-5xl">Finalizează comanda</h1>
      <CheckoutForm locations={locations} />
    </div>
  );
}

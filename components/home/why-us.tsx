import { Award, Bike, ChefHat, Leaf, Soup } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";

const reasons: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Leaf,
    title: "Ingrediente proaspete",
    text: "Carne de vită Angus tocată zilnic, legume de la producători locali, cartofi tăiați dimineața.",
  },
  {
    icon: ChefHat,
    title: "Preparat la comandă",
    text: "Nimic nu stă sub lămpi. Burgerul tău intră pe plită abia după ce ai apăsat „Comandă”.",
  },
  {
    icon: Bike,
    title: "Livrare rapidă",
    text: "Curieri proprii și genți termice: în medie 30 de minute de la bucătărie la ușa ta.",
  },
  {
    icon: Soup,
    title: "Sosuri făcute în casă",
    text: "Sosul casei, BBQ-ul afumat și maioneza sriracha le preparăm noi, în loturi mici.",
  },
  {
    icon: Award,
    title: "Calitate constantă",
    text: "Rețete cântărite la gram și verificare la fiecare tură, ca primul burger să fie ca al o sutălea.",
  },
];

export function WhyUs() {
  return (
    <section aria-labelledby="why-title" className="border-y border-line bg-ivory py-14 sm:py-20">
      <div className="container-page">
        <SectionHeading
          id="why-title"
          eyebrow="De ce Fast Burgers"
          title="Fast food, dar făcut fără scurtături."
          description="Suntem rapizi pentru că suntem organizați, nu pentru că pregătim dinainte."
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {reasons.map(({ icon: Icon, title, text }) => (
            <li key={title} className="reveal rounded-2xl bg-white p-5 ring-1 ring-line/70">
              <span className="grid size-12 place-items-center rounded-xl bg-accent-soft text-accent">
                <Icon className="size-6" aria-hidden strokeWidth={1.8} />
              </span>
              <h3 className="mt-4 text-lg font-bold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

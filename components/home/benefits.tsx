import { Bike, CookingPot, Leaf } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";

const ICONS = [CookingPot, Leaf, Bike];

/**
 * The three promises as a band right under the hero: icon in a soft orange disc, short title,
 * one-line detail, hairline dividers. Compact centred columns on phones, icon beside the text
 * from `md` up, where each column has room.
 */
export async function Benefits() {
  const { t } = await getI18n();
  return (
    <section aria-labelledby="benefits-title" className="border-y border-line bg-paper/60">
      <h2 id="benefits-title" className="sr-only">
        {t.benefits.title}
      </h2>
      <ul className="container-page grid grid-cols-3 divide-x divide-line py-5 sm:py-6">
        {t.benefits.items.map((item, i) => {
          const Icon = ICONS[i] ?? Leaf;
          return (
            <li
              key={item.title}
              className="flex flex-col items-center gap-2.5 px-2 text-center first:pl-0 last:pr-0 md:flex-row md:justify-center md:gap-4 md:px-6 md:text-left"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-ink sm:size-12">
                <Icon className="size-5 sm:size-6" strokeWidth={1.7} aria-hidden />
              </span>
              <div>
                <h3 className="font-sans text-[0.8125rem] leading-snug font-semibold tracking-normal sm:text-[0.9375rem]">
                  {item.title}
                </h3>
                <p className="mt-0.5 text-xs leading-snug text-muted sm:text-[0.8125rem]">{item.text}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

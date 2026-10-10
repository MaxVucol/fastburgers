import { Bike, CookingPot, Leaf } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";

const ICONS = [CookingPot, Leaf, Bike];

/** Three short promises under the hero copy: line icons, hairline dividers, no card chrome. */
export async function Benefits() {
  const { t } = await getI18n();
  return (
    <section aria-labelledby="benefits-title">
      <h2 id="benefits-title" className="sr-only">
        {t.benefits.title}
      </h2>
      <ul className="grid grid-cols-3 divide-x divide-line border-t border-line pt-6">
        {t.benefits.items.map((item, i) => {
          const Icon = ICONS[i] ?? Leaf;
          return (
            <li
              key={item.title}
              className="flex flex-col items-center gap-2 px-2 text-center first:pl-0 last:pr-0 sm:flex-row sm:items-start sm:gap-3 sm:px-4 sm:text-left"
            >
              <Icon className="size-6 shrink-0 text-accent-ink" strokeWidth={1.6} aria-hidden />
              <div>
                <h3 className="font-sans text-[0.8125rem] leading-snug font-semibold tracking-normal sm:text-sm">
                  {item.title}
                </h3>
                <p className="mt-0.5 text-xs leading-snug text-muted">{item.text}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

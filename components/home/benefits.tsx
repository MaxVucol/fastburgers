import { Bike, Flame, Leaf } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";

const ICONS = [Flame, Leaf, Bike];

/** Dark band right after the hero: three promises, separated by hairlines. */
export async function Benefits() {
  const { t } = await getI18n();
  return (
    <section aria-labelledby="benefits-title" className="bg-ink text-on-dark">
      <h2 id="benefits-title" className="sr-only">
        {t.benefits.title}
      </h2>
      <ul className="container-page grid divide-y divide-line-dark md:grid-cols-3 md:divide-x md:divide-y-0">
        {t.benefits.items.map((item, i) => {
          const Icon = ICONS[i] ?? Flame;
          return (
            <li key={item.title} className="flex items-start gap-4 py-6 md:px-8 md:py-9 md:first:pl-0 md:last:pr-0">
              <Icon className="mt-0.5 size-7 shrink-0 text-flame" strokeWidth={1.6} aria-hidden />
              <div>
                <h3 className="font-sans text-base font-semibold tracking-normal">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-on-dark">{item.text}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

import { useId } from "react";
import { GRADIENTS, LEAVES, SHAPES, VEIN, type Fill, type Shape } from "./logo-leaves-data";

// The autumn leaves drifting through the wordmark (the site header and the phone menu).
//
// They are drawn as inline SVG in the page and animated by the CSS in globals.css (.logo-leaves). They used to
// be a data-URI SVG used as a background image: an animated image like that is one cached object shared by
// every element that uses it, and after a language change (the page tree is swapped and the old one kept
// hidden) phones left it frozen. Inline elements start and stop with their own element.
//
// Position and size are SVG transform attributes, not the CSS `translate` / `scale` properties: with the fall
// and tumble animated through CSS `transform`, Chrome painted every leaf at x = 0 when `translate` was used.
export function LogoLeaves() {
  // Ids must be unique in the document, and the page can hold several copies of the logo (and, after a
  // language change, the previous page kept hidden), so every copy gets its own.
  const uid = "lf" + useId().replace(/[^A-Za-z0-9_-]/g, "");
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 220 100" preserveAspectRatio="none" className="logo-leaves">
      <defs>
        {(Object.keys(GRADIENTS) as Fill[]).map((name) => (
          <linearGradient key={name} id={`${uid}-${name}`} x1="0" y1="0" x2="1" y2="1">
            {GRADIENTS[name].map(([offset, color]) => (
              <stop key={offset} offset={offset} stopColor={color} />
            ))}
          </linearGradient>
        ))}
        {(Object.keys(SHAPES) as Shape[]).map((name) => (
          <g key={name} id={`${uid}-${name}`}>
            <path d={SHAPES[name].body} />
            <path d={SHAPES[name].veins} stroke={VEIN.stroke} strokeOpacity={VEIN.opacity} strokeWidth={VEIN.width} strokeLinecap="round" fill="none" />
          </g>
        ))}
      </defs>
      {LEAVES.map((leaf, i) => (
        <g key={i} transform={`translate(${leaf.x} 0)`}>
          <g className="lf" style={{ animationDuration: `${leaf.fall}s`, animationDelay: `-${leaf.fallDelay}s` }}>
            <g transform={`scale(${leaf.scale})`}>
              <use
                className="ls"
                href={`#${uid}-${leaf.shape}`}
                fill={`url(#${uid}-${leaf.fill})`}
                style={{ animationDuration: `${leaf.sway}s`, animationDelay: `-${leaf.swayDelay}s` }}
              />
            </g>
          </g>
        </g>
      ))}
    </svg>
  );
}

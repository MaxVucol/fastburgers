import { Fragment, type ReactNode } from "react";

/** Like `fill`, but placeholders can be React nodes: richFill("Add {amount} more", { amount: <strong>…</strong> }). */
export function richFill(template: string, values: Record<string, ReactNode>): ReactNode {
  const parts = template.split(/\{(\w+)\}/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <Fragment key={i}>{part in values ? values[part] : `{${part}}`}</Fragment> : part,
  );
}

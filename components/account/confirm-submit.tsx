"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

/** Submit button that asks for confirmation first (for actions that cannot be undone from here). */
export function ConfirmSubmit({ message, children, variant = "outline" }: { message: string; children: ReactNode; variant?: "outline" | "dark" | "primary" }) {
  return (
    <Button
      type="submit"
      variant={variant}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}

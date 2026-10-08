import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Administrare", template: "%s · Admin Fast Burgers" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex min-h-full flex-1 flex-col bg-cream">{children}</div>;
}

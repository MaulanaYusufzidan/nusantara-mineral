import type { Metadata } from "next";
import { fraunces, plexSans } from "@/lib/fonts";
import "./globals.css";


export const metadata: Metadata = {
  title: "Nusantara Mineral — Transforming Resources Into Sustainable Progress",
  description:
    "Nusantara Mineral is an Indonesian mining and energy company building responsible operations, strong governance, and long-term value for communities and investors.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${plexSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-stone text-charcoal">
        {children}
      </body>
    </html>
  );
}

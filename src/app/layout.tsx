import type { Metadata } from "next";
import { Cairo, Markazi_Text } from "next/font/google";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { appConfig } from "@/lib/app-config";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["latin", "arabic"],
  weight: ["400", "500", "600", "700"],
});

const markazi = Markazi_Text({
  variable: "--font-markazi",
  subsets: ["latin", "arabic"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Appointment Reservations SaaS",
  description: "Doctor appointment booking starter with Next.js, Tailwind CSS, and Convex.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = appConfig.clinicDefaults.locale;

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${cairo.variable} ${markazi.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-slate-900">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}

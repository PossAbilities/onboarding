import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { siteUrl } from "@/lib/config";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800", "900"],
  display: "swap",
});

const description =
  "Your PossAbilities induction journey — welcome to the team. Live the life you choose.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PossAbilities Journey",
    template: "%s · PossAbilities Journey",
  },
  description,
  icons: { icon: "/favicon.ico" },
  // og:image / twitter:image come from app/opengraph-image.tsx.
  openGraph: {
    type: "website",
    siteName: "PossAbilities Journey",
    title: "PossAbilities Journey",
    description,
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "PossAbilities Journey",
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} h-full`}>
      <head>
        {/* Material Symbols — global icon font for the gamified journey UI */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

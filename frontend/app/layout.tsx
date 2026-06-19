import type { Metadata } from "next";
import { Afacad } from "next/font/google";
// @ts-ignore: allow side-effect CSS import without explicit module declarations
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";

const afacad = Afacad({
  variable: "--font-afacad",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sanasa General Insurance",
  description: "Protect Your Drive with Confidence. Fast Claims. Affordable Plans. Trusted Protection.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${afacad.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}

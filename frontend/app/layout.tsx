import type { Metadata } from "next";
import { Afacad } from "next/font/google";
// @ts-ignore: allow side-effect CSS import without explicit module declarations
import "./globals.css";

const afacad = Afacad({
  variable: "--font-afacad",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sanasa General Insurance",
  description: "Protect Your Drive with Confidence. Fast Claims. Affordable Plans. Trusted Protection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${afacad.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

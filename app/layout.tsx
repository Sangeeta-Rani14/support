import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jan Setu Support — Emergency Response",
  description:
    "Jan Setu Emergency Report System. Scan, report, and get help fast.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {/* TanStack QueryClientProvider — wraps entire app */}
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

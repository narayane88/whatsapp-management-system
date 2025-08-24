import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ColorSchemeScript } from '@mantine/core';
import { Providers } from "./providers";
import CompanyLayoutWrapper from "@/components/layout/CompanyLayoutWrapper";
import "./globals.css";


const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bizflash Insight Solution - WhatsApp Management System",
  description: "Leading technology company specializing in WhatsApp Business API solutions, custom software development, and digital transformation services.",
  keywords: ["WhatsApp", "Business API", "Bizflash", "Software Development", "Digital Solutions", "Natpeute"],
  authors: [{ name: "Bizflash Insight Solution" }],
  robots: "index, follow",
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon.ico', sizes: '16x16', type: 'image/x-icon' },
    ],
    apple: '/favicon.ico',
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: "Bizflash Insight Solution - WhatsApp Management System",
    description: "Leading technology company specializing in WhatsApp Business API solutions and custom software development.",
    url: "https://bizflash.in",
    siteName: "Bizflash Insight Solution",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bizflash Insight Solution - WhatsApp Management System",
    description: "Leading technology company specializing in WhatsApp Business API solutions.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
        {/* Comprehensive Favicon Package */}
        <link rel="icon" href="/images/company/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/images/company/favicons/favicon-32x32.svg" sizes="32x32" type="image/svg+xml" />
        <link rel="icon" href="/images/company/favicons/favicon-16x16.svg" sizes="16x16" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/images/company/favicons/apple-touch-icon.svg" sizes="180x180" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="theme-color" content="#10B981" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <CompanyLayoutWrapper>
            {children}
          </CompanyLayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PWAProvider } from "../components/pwa/PWAProvider";
import InstallPrompt from "../components/pwa/InstallPrompt";
import UpdateBanner from "../components/pwa/UpdateBanner";
import OfflineIndicator from "../components/pwa/OfflineIndicator";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MediChain - Your Digital Health Wallet",
  description: "Patient-owned digital health records with secure QR sharing",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MediChain",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "MediChain",
    title: "MediChain - Your Digital Health Wallet",
    description: "Patient-owned digital health records with secure QR sharing",
  },
  twitter: {
    card: "summary",
    title: "MediChain - Your Digital Health Wallet",
    description: "Patient-owned digital health records with secure QR sharing",
  },
};

export const viewport: Viewport = {
  themeColor: "#0891b2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" type="image/x-icon" href="/medichain.ico" />
        <link rel="icon" type="image/svg+xml" href="/medichain.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MediChain" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0891b2" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className="font-sans antialiased bg-gray-50 min-h-screen">
        <PWAProvider>
          <UpdateBanner />
          <OfflineIndicator />
          {children}
          <InstallPrompt />
        </PWAProvider>
      </body>
    </html>
  );
}

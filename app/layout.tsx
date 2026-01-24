import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Sora, JetBrains_Mono, Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';

/**
 * Display font for headings
 * Sora: Modern geometric sans-serif
 */
const sora = Sora({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

/**
 * Monospace font for data/numbers
 * JetBrains Mono: Crisp, readable monospace
 */
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

/**
 * Body font for general text
 * Inter: Clean, professional sans-serif
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

/**
 * Page metadata for SEO and social sharing
 */
export const metadata: Metadata = {
  title: {
    default: 'Insider Trading Dashboard',
    template: '%s | Insider Trading Dashboard',
  },
  description:
    'Track and analyze insider trading patterns with LLM-powered insights. Monitor positions, P&L performance, and trading signals.',
  keywords: [
    'insider trading',
    'stock market',
    'trading dashboard',
    'LLM analysis',
    'investment',
  ],
  authors: [{ name: 'Insider Dashboard Team' }],
  creator: 'Insider Dashboard',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'Insider Trading Dashboard',
    description:
      'Track and analyze insider trading patterns with LLM-powered insights.',
    siteName: 'Insider Trading Dashboard',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Insider Trading Dashboard',
    description:
      'Track and analyze insider trading patterns with LLM-powered insights.',
  },
};

/**
 * Viewport configuration
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#DB0011' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0A' },
  ],
};

/**
 * Root layout component
 *
 * Wraps all pages with:
 * - Font CSS variables
 * - Theme provider for dark/light mode
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const umamiScriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || 'https://umami.is/script.js';

  return (
    <html
      lang="en"
      className={`${sora.variable} ${jetbrainsMono.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans">
        <ThemeProvider>{children}</ThemeProvider>
        {umamiWebsiteId && (
          <Script
            async
            defer
            data-website-id={umamiWebsiteId}
            src={umamiScriptUrl}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}

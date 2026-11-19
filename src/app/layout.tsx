import type { Metadata } from 'next';
import './globals.css';
import { shopConfig } from '@/lib/constants';

export function generateMetadata(): Metadata {
  const cfg = shopConfig();
  return {
    title: {
      default: cfg.name,
      template: `%s | ${cfg.name}`,
    },
    description: 'Football jerseys delivered across Kenya. Pay with M-Pesa.',
    icons: {
      icon: '/images/favicon.png',
      apple: '/images/apple-touch-icon.png',
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-black antialiased">{children}</body>
    </html>
  );
}

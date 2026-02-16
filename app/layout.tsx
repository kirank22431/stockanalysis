import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stock Analysis - Educational Tool',
  description: 'Educational stock analysis tool - Not financial advice',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

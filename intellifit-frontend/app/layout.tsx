import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: 'IntelliFit - Smart Gym Management',
  description: 'AI-powered gym management system for members, coaches, and staff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${montserrat.variable} font-main antialiased`}>
        <ThemeProvider defaultTheme="system" storageKey="intellifit-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

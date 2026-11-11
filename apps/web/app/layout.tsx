import { ClerkProvider } from '@clerk/nextjs';
import type { ReactNode } from 'react';
import { CLERK_ENABLED } from '../lib/clerk';
import './globals.css';

export const metadata = {
  title: 'open402',
  description: 'Infraestructura financiera para agentes autónomos',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const content = (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );

  return CLERK_ENABLED ? <ClerkProvider>{content}</ClerkProvider> : content;
}

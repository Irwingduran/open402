import { ClerkProvider } from '@clerk/nextjs';
import type { ReactNode } from 'react';
import { CLERK_ENABLED } from '../lib/clerk';
import './globals.css';

export const metadata = {
  title: 'open402 — Pagos para agentes de IA, con reglas del usuario',
  description: 'SDK abierto para que un agente de IA pague servicios en México dentro de límites que define el usuario.',
  openGraph: {
    title: 'open402 — Pagos para agentes de IA, con reglas del usuario',
    description: 'SDK abierto para que un agente de IA pague servicios en México dentro de límites que define el usuario.',
  },
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

'use client';

// Envoltorio de los componentes de auth de Clerk, controlado por CLERK_ENABLED.
// Con Clerk apagado: SignedOut muestra su contenido, SignedIn/UserButton no
// renderizan nada y SignInButton deja el botón como elemento inerte.
import {
  SignedIn as ClerkSignedIn,
  SignedOut as ClerkSignedOut,
  SignInButton as ClerkSignInButton,
  UserButton as ClerkUserButton,
} from '@clerk/nextjs';
import type { ComponentProps, ReactNode } from 'react';
import { CLERK_ENABLED } from '../lib/clerk';

export function SignedIn({ children }: { children: ReactNode }) {
  if (!CLERK_ENABLED) return null;
  return <ClerkSignedIn>{children}</ClerkSignedIn>;
}

export function SignedOut({ children }: { children: ReactNode }) {
  if (!CLERK_ENABLED) return <>{children}</>;
  return <ClerkSignedOut>{children}</ClerkSignedOut>;
}

export function SignInButton(props: ComponentProps<typeof ClerkSignInButton>) {
  if (!CLERK_ENABLED) return <>{props.children}</>;
  return <ClerkSignInButton {...props} />;
}

export function UserButton(props: ComponentProps<typeof ClerkUserButton>) {
  if (!CLERK_ENABLED) return null;
  return <ClerkUserButton {...props} />;
}

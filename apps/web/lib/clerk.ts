// Interruptor global de Clerk.
// false = sin auth: la landing y /sdk son públicas, el resto redirige a /.
// Para reactivar el login, cambiar a true (requiere CLERK_SECRET_KEY y
// NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY válidas para el dominio).
export const CLERK_ENABLED: boolean = false;

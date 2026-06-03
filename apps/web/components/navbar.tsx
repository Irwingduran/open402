'use client';

import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

export function Navbar({ active }: { active?: 'dashboard' | 'sdk' | 'credits' | 'rules' | 'transactions' }) {
  return (
    <nav className="flex items-center justify-between px-8 py-3.5 max-w-[1080px] mx-auto">
      <a href="/" className="text-base font-extrabold text-slate-900 no-underline tracking-tight font-sans">open402</a>
      <div className="flex items-center gap-5">
        <SignedOut>
           <a href="/sdk" className="text-xs font-mono font-semibold text-slate-500 no-underline hover:text-slate-800 transition-colors">Docs</a>
          <SignInButton>
            <button className="text-xs font-mono font-bold px-[18px] py-2 rounded-lg bg-slate-900 text-white border-none cursor-pointer">
              Comenzar
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <a
            href="/dashboard"
            className={`text-xs font-mono font-semibold no-underline ${active === 'dashboard' ? 'text-amber-500' : 'text-slate-500 hover:text-slate-800'} transition-colors`}
          >
            Dashboard
          </a>
          <a
            href="/credits"
            className={`text-xs font-mono font-semibold no-underline ${active === 'credits' ? 'text-amber-500' : 'text-slate-500 hover:text-slate-800'} transition-colors`}
          >
            Créditos
          </a>
          <a
            href="/rules"
            className={`text-xs font-mono font-semibold no-underline ${active === 'rules' ? 'text-amber-500' : 'text-slate-500 hover:text-slate-800'} transition-colors`}
          >
            Reglas
          </a>
          <a
            href="/transactions"
            className={`text-xs font-mono font-semibold no-underline ${active === 'transactions' ? 'text-amber-500' : 'text-slate-500 hover:text-slate-800'} transition-colors`}
          >
            Historial
          </a>
          <a
            href="/sdk"
            className={`text-xs font-mono font-semibold no-underline ${active === 'sdk' ? 'text-amber-500' : 'text-slate-500 hover:text-slate-800'} transition-colors`}
          >
            SDK
          </a>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </nav>
  );
}

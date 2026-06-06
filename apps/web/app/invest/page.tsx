import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@open402/db';
import { Navbar } from '../../components/navbar';
import { InvestForm } from '../../components/invest-form';

export const dynamic = 'force-dynamic';

export default async function InvestPage() {
  const { userId } = await auth();
  if (!userId) redirect('/');

  const investments = await prisma.investment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const serialized = investments.map((inv) => ({
    id: inv.id,
    amountMXN: inv.amountMXN,
    orderId: inv.orderId,
    status: inv.status,
    cetesReceived: inv.cetesReceived,
    depositClabe: inv.depositClabe,
    depositBankName: inv.depositBankName,
    mock: inv.mock,
    createdAt: inv.createdAt,
  }));

  return (
    <div className="bg-white text-slate-800 font-sans min-h-screen overflow-x-hidden">
      <Navbar active="invest" />
      <main className="px-8 py-10 max-w-[1080px] mx-auto">
        <h2 className="text-3xl font-extrabold tracking-tight italic mb-3">Inversión en CETES</h2>
        <p className="text-sm text-slate-500 mb-10 max-w-[520px]">
          Invierte en CETES (Certificados de la Tesorería de México) a través de Etherfuse. Recibes stablebonds respaldados 1:1 — el activo libre de riesgo mexicano, desde tu bot o dashboard.
        </p>
        <InvestForm initialInvestments={serialized} />
      </main>
    </div>
  );
}

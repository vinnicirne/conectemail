import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Resend } from 'resend';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });
    }

    if (campaign.status === 'SENDING' || campaign.status === 'COMPLETED') {
      return NextResponse.json({ error: 'A campanha já foi enviada ou está em andamento.' }, { status: 400 });
    }

    // Marca como enviando
    await prisma.campaign.update({
      where: { id },
      data: { status: 'SENDING' }
    });

    // Fire & Forget: inicia o processamento assíncrono em background
    processCampaign(id).catch(console.error);

    return NextResponse.json({ success: true, message: 'Envio em massa iniciado em segundo plano.' });
  } catch (error: unknown) {
    console.error('Start send error:', error);
    return NextResponse.json({ error: 'Erro ao iniciar disparo' }, { status: 500 });
  }
}

async function processCampaign(campaignId: string) {
  // Instancia o Resend dentro da função que vai usar
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return;

    let hasMore = true;

    while (hasMore) {
      const recipients = await prisma.campaignRecipient.findMany({
        where: { campaignId, status: 'PENDING' },
        take: 10
      });

      if (recipients.length === 0) {
        hasMore = false;
        break;
      }

      for (const recipient of recipients) {
        try {
          const { error } = await resend.emails.send({
            from: 'Angell Brindes <no-reply@conectemail.shop>',
            to: [recipient.email],
            subject: campaign.subject,
            html: campaign.html,
          });

          if (error) {
            throw new Error(error.message);
          }

          await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: { status: 'SENT', sentAt: new Date() }
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: { status: 'FAILED', error: msg }
          });
        }

        await sleep(350);
      }
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'COMPLETED' }
    });

  } catch (globalError) {
    console.error('Fatal error processing campaign:', globalError);
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'FAILED' }
    });
  }
}

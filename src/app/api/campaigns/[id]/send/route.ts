import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Resend } from 'resend';


const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resend = new Resend(process.env.RESEND_API_KEY);
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
  } catch (error: any) {
    console.error('Start send error:', error);
    return NextResponse.json({ error: 'Erro ao iniciar disparo' }, { status: 500 });
  }
}

async function processCampaign(campaignId: string) {
  try {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return;

    let hasMore = true;

    while (hasMore) {
      const recipients = await prisma.campaignRecipient.findMany({
        where: { campaignId, status: 'PENDING' },
        take: 10 // Pega pequenos lotes para processar
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
        } catch (err: any) {
          await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: { status: 'FAILED', error: String(err.message || err) }
          });
        }

        // Rate limit do provedor: ~3 emails por segundo na versão grátis
        await sleep(350);
      }
    }

    // Se acabou, verifica se teve falhas e marca o status global
    const failedCount = await prisma.campaignRecipient.count({
      where: { campaignId, status: 'FAILED' }
    });

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: failedCount > 0 ? 'COMPLETED' : 'COMPLETED' } // TODO: Adicionar PARTIAL_FAILED se necessário
    });

  } catch (globalError) {
    console.error('Fatal error processing campaign:', globalError);
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'FAILED' }
    });
  }
}

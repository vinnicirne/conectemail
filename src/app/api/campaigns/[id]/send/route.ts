import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { data: campaign } = await supabase
      .from('Campaign')
      .select('*')
      .eq('id', id)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });
    }

    if (campaign.status === 'SENDING' || campaign.status === 'COMPLETED') {
      return NextResponse.json({ error: 'A campanha já foi enviada ou está em andamento.' }, { status: 400 });
    }

    // Marca como enviando
    await supabase.from('Campaign').update({ status: 'SENDING', updatedAt: new Date().toISOString() }).eq('id', id);

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
    const { data: campaign } = await supabase.from('Campaign').select('*').eq('id', campaignId).single();
    if (!campaign) return;

    let hasMore = true;

    while (hasMore) {
      const { data: recipients } = await supabase
        .from('CampaignRecipient')
        .select('*')
        .eq('campaignId', campaignId)
        .eq('status', 'PENDING')
        .limit(10);

      if (!recipients || recipients.length === 0) {
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

          await supabase.from('CampaignRecipient').update({
            status: 'SENT',
            sentAt: new Date().toISOString()
          }).eq('id', recipient.id);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          await supabase.from('CampaignRecipient').update({
            status: 'FAILED',
            error: msg
          }).eq('id', recipient.id);
        }

        await sleep(350);
      }
    }

    await supabase.from('Campaign').update({ status: 'COMPLETED', updatedAt: new Date().toISOString() }).eq('id', campaignId);

  } catch (globalError) {
    console.error('Fatal error processing campaign:', globalError);
    await supabase.from('Campaign').update({ status: 'FAILED', updatedAt: new Date().toISOString() }).eq('id', campaignId);
  }
}

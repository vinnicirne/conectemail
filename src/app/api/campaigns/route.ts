import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

// Listar campanhas
export async function GET() {
  try {
    const { data: campaigns, error } = await supabase
      .from('Campaign')
      .select('*, CampaignRecipient(count)')
      .order('createdAt', { ascending: false });

    if (error) throw error;

    const formattedCampaigns = campaigns.map(c => ({
      ...c,
      _count: {
        recipients: c.CampaignRecipient?.[0]?.count || 0
      }
    }));

    return NextResponse.json(formattedCampaigns);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Criar nova campanha e salvar os contatos (mas não envia ainda)
export async function POST(request: Request) {
  try {
    const { name, subject, html, recipients } = await request.json();

    if (!name || !subject || !html || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const campaignId = crypto.randomUUID();

    // Criar a campanha
    const { error: campaignError } = await supabase.from('Campaign').insert({
      id: campaignId,
      name,
      subject,
      html,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    if (campaignError) throw campaignError;

    const recipientsData = recipients.map((email: string) => ({
      id: crypto.randomUUID(),
      campaignId,
      email,
      status: 'PENDING'
    }));

    // Inserir os destinatários em lotes para não estourar o limite de payload se for muito grande
    const chunkSize = 500;
    for (let i = 0; i < recipientsData.length; i += chunkSize) {
      const chunk = recipientsData.slice(i, i + chunkSize);
      const { error: recipientsError } = await supabase.from('CampaignRecipient').insert(chunk);
      if (recipientsError) throw recipientsError;
    }

    return NextResponse.json({ success: true, campaignId });

  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Erro ao criar campanha' }, { status: 500 });
  }
}

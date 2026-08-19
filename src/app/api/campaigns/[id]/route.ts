import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { data: campaign, error } = await supabase
      .from('Campaign')
      .select('*, recipients:CampaignRecipient(*)')
      .eq('id', id)
      .order('email', { referencedTable: 'CampaignRecipient', ascending: true })
      .single();

    if (error || !campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao buscar detalhes da campanha' }, { status: 500 });
  }
}

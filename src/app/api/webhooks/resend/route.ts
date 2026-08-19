import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    const eventType = payload?.type;
    const emailId = payload?.data?.email_id;

    if (!emailId || !eventType) {
      return NextResponse.json({ error: 'Missing email_id or type' }, { status: 400 });
    }

    // Buscamos o email no nosso banco de dados pelo ID do Resend
    const { data: emailRecord, error: findError } = await supabase
      .from('Email')
      .select('*')
      .eq('resendId', emailId)
      .single();

    if (findError || !emailRecord) {
      return NextResponse.json({ error: 'Email record not found' }, { status: 404 });
    }

    // Atualizamos o status baseado no evento do Resend
    if (eventType === 'email.delivered') {
      await supabase.from('Email').update({
        status: 'DELIVERED',
        updatedAt: new Date().toISOString()
      }).eq('id', emailRecord.id);
    } else if (eventType === 'email.opened') {
      await supabase.from('Email').update({
        status: 'OPENED',
        openedCount: emailRecord.openedCount + 1,
        lastOpenedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }).eq('id', emailRecord.id);
    } else if (eventType === 'email.bounced') {
      await supabase.from('Email').update({
        status: 'BOUNCED',
        updatedAt: new Date().toISOString()
      }).eq('id', emailRecord.id);
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Webhook Error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

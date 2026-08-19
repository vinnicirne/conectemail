import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { to, subject, html } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, html' }, { status: 400 });
    }

    // Save email intention in database
    const emailId = crypto.randomUUID();
    const { data: emailRecord, error: insertError } = await supabase.from('Email').insert({
      id: emailId,
      toAddress: to,
      subject,
      htmlContent: html,
      status: 'SENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).select().single();

    if (insertError || !emailRecord) {
      throw insertError || new Error('Failed to create email record');
    }

    // Send via Resend
    const { data, error } = await resend.emails.send({
      from: 'Angell Brindes <no-reply@conectemail.shop>', // Domínio oficial
      to: [to],
      subject,
      html,
      tags: [
        { name: 'db_id', value: emailRecord.id }
      ],
    });

    if (error) {
      await supabase.from('Email').update({ status: 'FAILED', updatedAt: new Date().toISOString() }).eq('id', emailRecord.id);
      return NextResponse.json({ error }, { status: 400 });
    }

    // Update database with Resend ID and SENT status
    await supabase.from('Email').update({
      status: 'SENT',
      resendId: data?.id,
      updatedAt: new Date().toISOString()
    }).eq('id', emailRecord.id);

    return NextResponse.json({ success: true, emailId: emailRecord.id, resendId: data?.id });

  } catch (err: any) {
    console.error('Error sending email:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

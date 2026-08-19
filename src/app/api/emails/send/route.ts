import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import prisma from '@/lib/prisma';


export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { to, subject, html } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, html' }, { status: 400 });
    }

    // Save email intention in database
    const emailRecord = await prisma.email.create({
      data: {
        toAddress: to,
        subject,
        htmlContent: html,
        status: 'SENDING',
      },
    });

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
      await prisma.email.update({
        where: { id: emailRecord.id },
        data: { status: 'FAILED' },
      });
      return NextResponse.json({ error }, { status: 400 });
    }

    // Update database with Resend ID and SENT status
    await prisma.email.update({
      where: { id: emailRecord.id },
      data: { 
        status: 'SENT',
        resendId: data?.id 
      },
    });

    return NextResponse.json({ success: true, emailId: emailRecord.id, resendId: data?.id });

  } catch (err: any) {
    console.error('Error sending email:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

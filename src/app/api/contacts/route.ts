import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  try {
    // Supabase JS client doesn't have a built-in distinct for select without RPC, 
    // so we fetch more and distinct in memory.
    const { data: emails } = await supabase
      .from('Email')
      .select('toAddress')
      .ilike('toAddress', `%${q}%`)
      .limit(100);

    if (!emails) {
      return NextResponse.json([]);
    }

    const distinctContacts = [...new Set(emails.map(e => e.toAddress))].slice(0, 20);

    return NextResponse.json(distinctContacts);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar contatos' }, { status: 500 });
  }
}

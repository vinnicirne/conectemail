import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export async function GET() {
  try {
    const { data: lists, error } = await supabase
      .from('ContactList')
      .select('*, ContactListMember(count)')
      .order('createdAt', { ascending: false });

    if (error) throw error;

    const formattedLists = lists.map(list => ({
      ...list,
      _count: {
        members: list.ContactListMember?.[0]?.count || 0
      }
    }));

    return NextResponse.json(formattedLists);
  } catch (error) {
    console.error('Error fetching lists:', error);
    return NextResponse.json({ error: 'Erro ao buscar listas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const { data: list, error } = await supabase
      .from('ContactList')
      .insert({
        id: crypto.randomUUID(),
        name,
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(list);
  } catch (error) {
    console.error('Error creating list:', error);
    return NextResponse.json({ error: 'Erro ao criar lista' }, { status: 500 });
  }
}

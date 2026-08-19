import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { emails, source = 'manual' } = await request.json();
    const { id: listId } = await params;

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'Nenhum e-mail fornecido' }, { status: 400 });
    }

    // Verificar se a lista existe
    const { data: list, error: listError } = await supabase.from('ContactList').select('id').eq('id', listId).single();
    if (listError || !list) {
      return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 });
    }

    // Normalizar e-mails
    const normalizedEmails = [...new Set(emails.map((e: string) => e.toLowerCase().trim()).filter((e: string) => e.includes('@')))];

    // Buscar e-mails que já estão na lista para não duplicar
    const { data: existingMembers, error: existingError } = await supabase
      .from('ContactListMember')
      .select('email')
      .eq('listId', listId)
      .in('email', normalizedEmails);
      
    if (existingError) throw existingError;
    
    const existingEmails = new Set(existingMembers?.map(m => m.email) || []);
    const newEmails = normalizedEmails.filter(e => !existingEmails.has(e));

    if (newEmails.length === 0) {
      return NextResponse.json({ 
        success: true, 
        added: 0, 
        duplicates: normalizedEmails.length,
        message: 'Todos os e-mails já estavam na lista' 
      });
    }

    // Inserir os novos em lotes para evitar payload muito grande
    const newMembersData = newEmails.map(email => ({
      id: crypto.randomUUID(),
      listId,
      email,
      source,
      createdAt: new Date().toISOString()
    }));

    const chunkSize = 500;
    for (let i = 0; i < newMembersData.length; i += chunkSize) {
      const chunk = newMembersData.slice(i, i + chunkSize);
      const { error: insertError } = await supabase.from('ContactListMember').insert(chunk);
      if (insertError) throw insertError;
    }

    return NextResponse.json({ 
      success: true, 
      added: newEmails.length, 
      duplicates: existingEmails.size 
    });
  } catch (error) {
    console.error('Error adding members:', error);
    return NextResponse.json({ error: 'Erro ao adicionar membros' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: listId } = await params;
    const { memberIds } = await request.json();

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: 'IDs não fornecidos' }, { status: 400 });
    }

    const { error } = await supabase
      .from('ContactListMember')
      .delete()
      .eq('listId', listId)
      .in('id', memberIds);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting members:', error);
    return NextResponse.json({ error: 'Erro ao remover membros' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { session_id } = await request.json();

    if (!session_id || typeof session_id !== 'string' || session_id.length !== 5) {
      return NextResponse.json({ error: 'Invalid session_id format' }, { status: 400 });
    }

    // Check if session exists and get current data
    const { data: session, error: fetchError } = await supabase
      .from('user_sessions')
      .select('correct_count, total_count, streak, last_accessed_at')
      .eq('id', session_id)
      .single();

    if (fetchError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Update last_accessed_at
    const { error: updateError } = await supabase
      .from('user_sessions')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', session_id);

    if (updateError) {
      console.error('Session update error:', updateError);
      // Don't fail the request for update errors, just log
    }

    return NextResponse.json({
      session_id,
      correct_count: session.correct_count,
      total_count: session.total_count,
      streak: session.streak,
      last_accessed_at: session.last_accessed_at
    });
  } catch (error) {
    console.error('Error in session join:', error);
    return NextResponse.json({
      error: 'Failed to join session',
      details: error.message
    }, { status: 500 });
  }
}
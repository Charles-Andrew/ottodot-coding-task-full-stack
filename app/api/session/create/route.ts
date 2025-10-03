import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

function generateSessionId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    let sessionId: string;
    let attempts = 0;
    const maxAttempts = 10;

    // Generate unique session ID with collision handling
    do {
      sessionId = generateSessionId();
      attempts++;

      const { data: existing } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('id', sessionId)
        .single();

      if (!existing) break; // Unique ID found

      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique session ID after maximum attempts');
      }
    } while (true);

    // Insert new session
    const { error } = await supabase
      .from('user_sessions')
      .insert({
        id: sessionId,
        correct_count: 0,
        total_count: 0,
        streak: 0
      });

    if (error) {
      console.error('Session creation error:', error);
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return NextResponse.json({ session_id: sessionId });
  } catch (error) {
    console.error('Error in session create:', error);
    return NextResponse.json({
      error: 'Failed to create session',
      details: error.message
    }, { status: 500 });
  }
}
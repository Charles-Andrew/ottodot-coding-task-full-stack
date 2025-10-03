import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId || typeof sessionId !== 'string' || sessionId.length !== 5) {
      return NextResponse.json({ error: 'Invalid session_id parameter' }, { status: 400 });
    }

    // Fetch session data
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select('correct_count, total_count, streak, hint_credits, hint_cap, created_at, last_accessed_at')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Fetch recent submissions (last 10) with problem data
    const { data: submissions, error: submissionsError } = await supabase
      .from('math_problem_submissions')
      .select(`
        id,
        user_answer,
        is_correct,
        feedback_text,
        created_at,
        math_problem_sessions!inner (
          id,
          problem_text,
          correct_answer,
          difficulty,
          topic
        )
      `)
      .eq('user_session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (submissionsError) {
      console.error('Submissions fetch error:', submissionsError);
      throw new Error('Failed to fetch session submissions');
    }

    return NextResponse.json({
      session: {
        id: sessionId,
        ...session
      },
      recent_submissions: submissions || []
    });
  } catch (error) {
    console.error('Error in session data:', error);
    return NextResponse.json({
      error: 'Failed to fetch session data',
      details: error.message
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (page < 1 || limit < 1 || limit > 50) {
      return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 });
    }

    const offset = (page - 1) * limit;

    // Get total count
    const { count, error: countError } = await supabase
      .from('math_problem_submissions')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Count error:', countError);
      throw new Error('Failed to get total count');
    }

    // Get paginated submissions with session data
    const { data: submissions, error } = await supabase
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
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('History fetch error:', error);
      throw new Error('Failed to fetch history');
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      submissions: submissions || [],
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count || 0,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error in history API:', error);
    return NextResponse.json({
      error: 'Failed to fetch history',
      details: error.message
    }, { status: 500 });
  }
}
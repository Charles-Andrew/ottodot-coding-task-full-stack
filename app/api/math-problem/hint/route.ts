import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { problem_session_id, user_session_id } = await request.json();
    if (!problem_session_id || !user_session_id || typeof user_session_id !== 'string' || user_session_id.length !== 5) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_API_KEY not set');

    // Fetch problem session and check hints used
    const { data: problemSession, error: problemError } = await supabase
      .from('math_problem_sessions')
      .select('problem_text, hints_used')
      .eq('id', problem_session_id)
      .single();

    if (problemError || !problemSession) {
      return NextResponse.json({ error: 'Problem session not found' }, { status: 404 });
    }

    if (problemSession.hints_used >= 1) {
      return NextResponse.json({ error: 'Hint already used for this problem' }, { status: 400 });
    }

    // Fetch user session and check hint credits
    const { data: userSession, error: userError } = await supabase
      .from('user_sessions')
      .select('hint_credits')
      .eq('id', user_session_id)
      .single();

    if (userError || !userSession) {
      return NextResponse.json({ error: 'User session not found' }, { status: 404 });
    }

    if (userSession.hint_credits <= 0) {
      return NextResponse.json({ error: 'No hint credits remaining' }, { status: 400 });
    }

    // Generate hint with Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const hintPrompt = `Provide a subtle hint for this Primary 5 math word problem: "${problemSession.problem_text}"

Keep the hint brief, encouraging, and age-appropriate for 10-11 year olds. Don't give away the answer, just guide them towards the solution.`;

    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
    const result = await model.generateContent(hintPrompt);
    const response = await result.response;
    let hint = response.text().trim();

    // Clean markdown if present
    if (hint.startsWith('```') && hint.endsWith('```')) {
      hint = hint.slice(3, -3).trim();
    }

    // Update hints_used in problem session
    const { error: updateProblemError } = await supabase
      .from('math_problem_sessions')
      .update({ hints_used: problemSession.hints_used + 1 })
      .eq('id', problem_session_id);

    if (updateProblemError) {
      console.error('Problem session update error:', updateProblemError);
      throw new Error('Failed to update problem session');
    }

    // Update hint_credits in user session
    const { error: updateUserError } = await supabase
      .from('user_sessions')
      .update({ hint_credits: userSession.hint_credits - 1 })
      .eq('id', user_session_id);

    if (updateUserError) {
      console.error('User session update error:', updateUserError);
      throw new Error('Failed to update user session');
    }

    return NextResponse.json({ hint });
  } catch (error) {
    console.error('Error in hint generation:', error);
    return NextResponse.json({
      error: 'Failed to generate hint',
      details: error.message
    }, { status: 500 });
  }
}
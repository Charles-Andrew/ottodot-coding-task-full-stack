import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { session_id, user_session_id, user_answer } = await request.json();
    if (!session_id || !user_session_id || typeof user_session_id !== 'string' || user_session_id.length !== 5 || typeof user_answer !== 'number') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_API_KEY not set');

    // Fetch the problem session
    const { data: session, error: sessionError } = await supabase
      .from('math_problem_sessions')
      .select('problem_text, correct_answer')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      console.error('Session fetch error:', sessionError);
      return NextResponse.json({ error: 'Problem session not found' }, { status: 404 });
    }

    const isCorrect = Math.abs(user_answer - session.correct_answer) < 0.001; // Handle floating point

    // Validate user session exists
    const { data: userSession, error: userSessionError } = await supabase
      .from('user_sessions')
      .select('correct_count, total_count, streak')
      .eq('id', user_session_id)
      .single();

    if (userSessionError || !userSession) {
      return NextResponse.json({ error: 'User session not found' }, { status: 404 });
    }

    // Update user session scores
    const newTotalCount = userSession.total_count + 1;
    const newCorrectCount = isCorrect ? userSession.correct_count + 1 : userSession.correct_count;
    const newStreak = isCorrect ? userSession.streak + 1 : 0;

    const { error: updateError } = await supabase
      .from('user_sessions')
      .update({
        total_count: newTotalCount,
        correct_count: newCorrectCount,
        streak: newStreak
      })
      .eq('id', user_session_id);

    if (updateError) {
      console.error('Session update error:', updateError);
      throw new Error('Failed to update session scores');
    }

    // Generate AI feedback
    const genAI = new GoogleGenerativeAI(apiKey);
    const feedbackPrompt = `You are a helpful math tutor for Primary 5 students. The student was given this problem: "${session.problem_text}"

The correct answer is: ${session.correct_answer}
The student answered: ${user_answer}

${isCorrect ? 'The student got it correct! Provide encouraging feedback that explains why their approach worked.' : 'The student got it wrong. Explain the correct approach step-by-step and be encouraging.'}

Keep your response concise, friendly, and age-appropriate for Primary 5 students (10-11 years old). Focus only on explaining this specific problem.`;

    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
    const result = await model.generateContent(feedbackPrompt);
    const response = await result.response;
    let feedback = response.text().trim();

    // Clean markdown if present
    if (feedback.startsWith('```') && feedback.endsWith('```')) {
      feedback = feedback.slice(3, -3).trim();
    }

    // Save submission
    const { error: submitError } = await supabase
      .from('math_problem_submissions')
      .insert({
        session_id,
        user_session_id,
        user_answer,
        is_correct: isCorrect,
        feedback_text: feedback
      });

    if (submitError) {
      console.error('Submission save error:', submitError);
      return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 });
    }

    return NextResponse.json({
      is_correct: isCorrect,
      feedback
    });
  } catch (error) {
    console.error('Error in submit-answer:', error);
    return NextResponse.json({
      error: 'Failed to submit answer',
      details: error.message
    }, { status: 500 });
  }
}
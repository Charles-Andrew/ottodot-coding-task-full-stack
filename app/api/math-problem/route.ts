import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabaseClient';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { difficulty } = await request.json();
    const validDifficulties = ['easy', 'medium', 'hard'];
    const selectedDifficulty = validDifficulties.includes(difficulty) ? difficulty : 'medium';
    console.log('API received difficulty:', difficulty, 'selected:', selectedDifficulty);

    const apiKey = process.env.GOOGLE_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!apiKey) throw new Error('GOOGLE_API_KEY not set');
    if (!supabaseUrl || !supabaseKey) throw new Error('Supabase environment variables not set');

    // Load and select random topic
    let selectedTopic = '';
    try {
      const topicsPath = path.join(process.cwd(), 'data', 'primary-5-topics.json');
      const topicsData = fs.readFileSync(topicsPath, 'utf8');
      const topicsJson = JSON.parse(topicsData);
      const topics = topicsJson.primary_5_topics;
      if (topics && topics.length > 0) {
        selectedTopic = topics[Math.floor(Math.random() * topics.length)];
      }
    } catch (error) {
      console.warn('Failed to load topics, using general prompt:', error.message);
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const prompt = selectedTopic
      ? `Generate a ${selectedDifficulty} level math word problem suitable for a Primary 5 student on the topic: ${selectedTopic}. Return only valid JSON with no extra text or formatting: {"problem_text": "[word problem]", "final_answer": [numerical answer]}`
      : `Generate a ${selectedDifficulty} level math word problem suitable for a Primary 5 student. Return only valid JSON with no extra text or formatting: {"problem_text": "[word problem]", "final_answer": [numerical answer]}`;

    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);

    const response = await result.response;
    let text = response.text();

    // Clean markdown code blocks if present
    if (text.startsWith('```json\n') && text.endsWith('\n```')) {
      text = text.slice(8, -4); // Remove ```json\n and \n```
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Failed to parse cleaned text:', text);
      throw new Error(`Invalid JSON response: ${text}`);
    }

    if (!data.problem_text || typeof data.final_answer !== 'number') {
      console.error('Invalid data format:', data);
      throw new Error('Response missing required fields or wrong types');
    }

    const { data: session, error } = await supabase
      .from('math_problem_sessions')
      .insert({ problem_text: data.problem_text, correct_answer: data.final_answer, difficulty: selectedDifficulty, topic: selectedTopic })
      .select('id')
      .single();

    if (error) {
      console.error('Supabase error details:', error);
      throw new Error(`Database insert failed: ${error.message}`);
    }

    return NextResponse.json({ sessionId: session.id, problem_text: data.problem_text, topic: selectedTopic, difficulty: selectedDifficulty });
  } catch (error) {
    console.error('Error in generate-problem:', error);
    return NextResponse.json({
      error: 'Failed to generate problem',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    const { data: session, error } = await supabase
      .from('math_problem_sessions')
      .select('problem_text, topic, difficulty')
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error in get-problem:', error);
    return NextResponse.json({
      error: 'Failed to fetch problem',
      details: error.message
    }, { status: 500 });
  }
}
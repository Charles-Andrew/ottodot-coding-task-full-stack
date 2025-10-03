"use client";

import { useState, useEffect } from "react";

interface MathProblem {
  problem_text: string;
  final_answer: number;
}

const LoadingSpinner = () => (
  <div className="inline-block w-6 h-6 border-3 border-white/30 border-t-white rounded-full mr-3" />
);

const MathIcon = () => (
  <svg
    width="50"
    height="50"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
    />
  </svg>
);

const CheckIcon = () => (
  <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

const XIcon = () => (
  <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

export default function Home() {
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [topic, setTopic] = useState<string>("");

  // Load saved problem from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('current_math_problem');
      if (saved) {
        const data = JSON.parse(saved);
        const isExpired = Date.now() - data.timestamp > 24 * 60 * 60 * 1000; // 24 hours
        if (!isExpired && data.sessionId && data.problem_text) {
          setProblem({ problem_text: data.problem_text, final_answer: 0 });
          setSessionId(data.sessionId);
          setTopic(data.topic || "");
        } else {
          localStorage.removeItem('current_math_problem');
        }
      }
    } catch (error) {
      console.warn('Failed to load saved problem:', error);
    }
  }, []);

  const generateProblem = async () => {
    // Clear any existing saved problem
    try {
      localStorage.removeItem('current_math_problem');
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/math-problem", { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate problem");
      const data = await res.json();
      setProblem({ problem_text: data.problem_text, final_answer: 0 });
      setSessionId(data.sessionId);
      setTopic(data.topic || "");
      setFeedback("");
      setIsCorrect(null);

      // Save to localStorage
      try {
        localStorage.setItem('current_math_problem', JSON.stringify({
          sessionId: data.sessionId,
          problem_text: data.problem_text,
          topic: data.topic || "",
          timestamp: Date.now()
        }));
      } catch (error) {
        console.warn('Failed to save problem to localStorage:', error);
      }
    } catch (error) {
      console.error(error);
      setFeedback("Failed to generate problem. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer || !sessionId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/math-problem/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          user_answer: parseFloat(userAnswer),
        }),
      });
      if (!res.ok) throw new Error("Failed to submit answer");
      const data = await res.json();
      setIsCorrect(data.is_correct);
      setFeedback(data.feedback);
      setUserAnswer("");

      // Clear saved problem after submission
      try {
        localStorage.removeItem('current_math_problem');
      } catch (error) {
        console.warn('Failed to clear localStorage:', error);
      }
    } catch (error) {
      console.error(error);
      setFeedback("Failed to submit answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto bg-gradient-radial from-indigo-900/20 via-purple-900/20 to-black bg-black">
        <div className="flex flex-col items-center justify-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-2xl">
            <MathIcon />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-lg text-center">
            Math Problem Generator
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed text-center">
            Challenge yourself with AI-generated math problems designed for
            Primary 5 students
          </p>
        </div>

        <div className="bg-black/80 rounded-3xl p-6 md:p-8 mb-8 shadow-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-indigo-500/15 to-purple-600/15">
          <button
            onClick={generateProblem}
            disabled={isGenerating}
            className="w-full font-semibold text-lg p-4 rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
          >
            {isGenerating && <LoadingSpinner />}
            <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                     d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <span>
              {isGenerating ? "Generating Problem..." : "Generate New Problem"}
            </span>
          </button>
        </div>

        {problem && (
          <div className="bg-gradient-radial from-black/90 via-gray-900/80 to-black/90 rounded-3xl p-6 md:p-8 mb-8 shadow-2xl backdrop-blur-xl border border-white/10">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4">
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  stroke="white"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Problem</h2>
            </div>
            {topic && (
              <div className="mb-4 text-sm text-white/70 bg-gray-800/50 p-3 rounded-lg">
                <strong>Topic:</strong> {topic}
              </div>
            )}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl text-lg leading-relaxed mb-8 border-l-4 border-indigo-500 text-white">
              {problem.problem_text}
            </div>

            <form onSubmit={submitAnswer}>
              <div className="mb-6">
                <label
                  htmlFor="answer"
                  className="block font-semibold text-lg mb-2 text-white"
                >
                  Your Answer
                </label>
                <input
                  type="number"
                  id="answer"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="w-full p-4 text-lg border-2 border-gray-600 rounded-xl transition-all duration-300 bg-gray-800 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Enter your answer"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!userAnswer || isSubmitting}
                className="w-full font-semibold text-lg p-4 rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white"
              >
                {isSubmitting && <LoadingSpinner />}
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  stroke="white"
                  viewBox="0 0 24 24"
                  style={{ transform: 'rotate(90deg)' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                <span>{isSubmitting ? "Submitting..." : "Submit Answer"}</span>
              </button>
            </form>
          </div>
        )}

        {feedback && (
          <div
            className={`rounded-3xl p-6 md:p-8 mb-8 shadow-2xl ${
              isCorrect
                ? "bg-gradient-to-br from-emerald-900 to-emerald-800 border-2 border-emerald-500 text-emerald-100"
                : "bg-gradient-to-br from-red-900 to-red-800 border-2 border-red-500 text-red-100"
            }`}
          >
            <div className="flex items-center mb-4">
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center mr-4 ${
                  isCorrect
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-700"
                    : "bg-gradient-to-br from-red-500 to-red-600"
                }`}
              >
                {isCorrect ? <CheckIcon /> : <XIcon />}
              </div>
              <h2 className="text-3xl font-bold">
                {isCorrect ? "Excellent Work! 🎉" : "Keep Trying! 💪"}
              </h2>
            </div>
            <div className="bg-black/50 p-6 rounded-xl text-lg leading-relaxed mb-6">
              {feedback}
            </div>
            <button
              onClick={() => {
                setProblem(null);
                setUserAnswer("");
                setFeedback("");
                setIsCorrect(null);
                setSessionId(null);
                setTopic("");
                // Clear saved problem
                try {
                  localStorage.removeItem('current_math_problem');
                } catch (error) {
                  console.warn('Failed to clear localStorage:', error);
                }
              }}
              className="w-full font-semibold text-lg p-4 rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 bg-gradient-to-br from-gray-500 to-gray-700 text-white"
            >
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="white"
                viewBox="0 0 24 24"
                style={{ marginRight: "0.5rem" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try Another Problem
            </button>
          </div>
        )}
      </div>
    </>
  );
}

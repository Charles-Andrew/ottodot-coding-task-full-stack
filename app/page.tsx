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

const SkeletonLoader = ({ className }: { className: string }) => (
  <div className={`bg-gray-700/50 rounded animate-pulse ${className}`} />
);

const HistoryItemSkeleton = () => (
  <div className="bg-black/50 rounded-xl p-4 border border-white/10">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <SkeletonLoader className="w-6 h-6 rounded-full" />
          <SkeletonLoader className="w-32 h-4" />
        </div>
        <div className="flex gap-2 mb-2">
          <SkeletonLoader className="w-16 h-5 rounded" />
          <SkeletonLoader className="w-14 h-5 rounded" />
        </div>
      </div>
    </div>
    <div className="mb-3 space-y-2">
      <SkeletonLoader className="w-full h-4" />
      <SkeletonLoader className="w-3/4 h-4" />
      <SkeletonLoader className="w-1/2 h-4" />
    </div>
    <div className="flex items-center gap-4">
      <SkeletonLoader className="w-20 h-4" />
      <SkeletonLoader className="w-8 h-4" />
      <SkeletonLoader className="w-16 h-4" />
      <SkeletonLoader className="w-8 h-4" />
    </div>
  </div>
);

interface HistorySubmission {
  id: string;
  user_answer: number;
  is_correct: boolean;
  feedback_text: string;
  created_at: string;
  math_problem_sessions: {
    id: string;
    problem_text: string;
    correct_answer: number;
    difficulty: string;
    topic: string;
  };
}

export default function Home() {
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [topic, setTopic] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    "easy" | "medium" | "hard"
  >("easy");
  const [currentProblemDifficulty, setCurrentProblemDifficulty] =
    useState<string>("");

  // Session state management
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<{
    correct_count: number;
    total_count: number;
    streak: number;
  } | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [joinSessionId, setJoinSessionId] = useState("");

  // Feedback modal state
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackModalLoading, setFeedbackModalLoading] = useState(false);

  // History modal state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState<HistorySubmission[]>([]);
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
  const [totalHistoryPages, setTotalHistoryPages] = useState(1);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Migration modal state
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const [legacyScores, setLegacyScores] = useState<{
    correctCount: number;
    totalCount: number;
    streak: number;
  } | null>(null);

  // Disable body scroll when modal is open
  useEffect(() => {
    if (isHistoryOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isHistoryOpen]);

  // Load saved problem from localStorage on mount
  useEffect(() => {
    const loadSavedProblem = async () => {
      try {
        const saved = localStorage.getItem("current_math_problem");
        if (saved) {
          const data = JSON.parse(saved);
          const isExpired = Date.now() - data.timestamp > 24 * 60 * 60 * 1000; // 24 hours
          if (!isExpired && data.sessionId) {
            // Fetch problem details from API
            const res = await fetch(
              `/api/math-problem?sessionId=${data.sessionId}`
            );
            if (res.ok) {
              const problemData = await res.json();
              setProblem({
                problem_text: problemData.problem_text,
                final_answer: 0,
              });
              setSessionId(data.sessionId);
              setTopic(problemData.topic || "");
              setCurrentProblemDifficulty(problemData.difficulty || "N/A");
            } else {
              // Problem not found or expired, clear localStorage
              localStorage.removeItem("current_math_problem");
            }
          } else {
            localStorage.removeItem("current_math_problem");
          }
        }
      } catch (error) {
        console.warn("Failed to load saved problem:", error);
        localStorage.removeItem("current_math_problem");
      }
    };

    loadSavedProblem();
  }, []);

  // Load saved session from localStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedSessionId = localStorage.getItem("current_session_id");
        if (savedSessionId) {
          setIsLoadingSession(true);
          const res = await fetch(
            `/api/session/data?session_id=${savedSessionId}`
          );
          if (res.ok) {
            const data = await res.json();
            setCurrentSessionId(savedSessionId);
            setSessionData({
              correct_count: data.session.correct_count,
              total_count: data.session.total_count,
              streak: data.session.streak,
            });
          } else {
            // Session not found or expired, clear localStorage
            localStorage.removeItem("current_session_id");
          }
        } else {
          // Check for legacy scores to offer migration
          const legacy = localStorage.getItem("math_scores");
          if (legacy) {
            try {
              const data = JSON.parse(legacy);
              const isExpired =
                Date.now() - data.timestamp > 24 * 60 * 60 * 1000; // 24 hours
              if (!isExpired && data.correctCount > 0) {
                setLegacyScores({
                  correctCount: data.correctCount,
                  totalCount: data.totalCount,
                  streak: data.streak,
                });
                setIsMigrationModalOpen(true);
              } else {
                localStorage.removeItem("math_scores");
              }
            } catch (error) {
              localStorage.removeItem("math_scores");
            }
          }
        }
      } catch (error) {
        console.warn("Failed to load session:", error);
        localStorage.removeItem("current_session_id");
      } finally {
        setIsLoadingSession(false);
      }
    };

    loadSession();
  }, []);

  const generateProblem = async () => {
    // Clear any existing saved problem
    try {
      localStorage.removeItem("current_math_problem");
    } catch (error) {
      console.warn("Failed to clear localStorage:", error);
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/math-problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty: selectedDifficulty }),
      });
      if (!res.ok) throw new Error("Failed to generate problem");
      const data = await res.json();
      setCurrentProblemDifficulty(data.difficulty || "N/A");
      setProblem({ problem_text: data.problem_text, final_answer: 0 });
      setSessionId(data.sessionId);
      setTopic(data.topic || "");
      setFeedback("");
      setIsCorrect(null);

      // Save to localStorage
      try {
        localStorage.setItem(
          "current_math_problem",
          JSON.stringify({
            sessionId: data.sessionId,
            timestamp: Date.now(),
          })
        );
      } catch (error) {
        console.warn("Failed to save problem to localStorage:", error);
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
    setIsFeedbackModalOpen(true);
    setFeedbackModalLoading(true);

    // Clear the problem display
    setProblem(null);
    setTopic("");

    try {
      const res = await fetch("/api/math-problem/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          user_session_id: currentSessionId,
          user_answer: parseFloat(userAnswer),
        }),
      });
      if (!res.ok) throw new Error("Failed to submit answer");
      const data = await res.json();
      setIsCorrect(data.is_correct);
      setFeedback(data.feedback);
      setFeedbackModalLoading(false);

      // Update session data by refetching from API
      if (currentSessionId) {
        try {
          const sessionRes = await fetch(
            `/api/session/data?session_id=${currentSessionId}`
          );
          if (sessionRes.ok) {
            const sessionDataResponse = await sessionRes.json();
            setSessionData({
              correct_count: sessionDataResponse.session.correct_count,
              total_count: sessionDataResponse.session.total_count,
              streak: sessionDataResponse.session.streak,
            });
          }
        } catch (error) {
          console.warn("Failed to refresh session data:", error);
        }
      }

      setUserAnswer("");

      // Clear saved problem after submission
      try {
        localStorage.removeItem("current_math_problem");
      } catch (error) {
        console.warn("Failed to clear localStorage:", error);
      }
    } catch (error) {
      console.error(error);
      setFeedback("Failed to submit answer. Please try again.");
      setFeedbackModalLoading(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchHistory = async (page: number = 1) => {
    if (!currentSessionId) return;

    setIsLoadingHistory(true);
    try {
      const res = await fetch(
        `/api/math-problem/history?page=${page}&limit=10&user_session_id=${currentSessionId}`
      );
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      setHistoryData(data.submissions);
      setTotalHistoryPages(data.pagination.totalPages);
      setCurrentHistoryPage(data.pagination.currentPage);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const createNewSession = async () => {
    setIsLoadingSession(true);
    try {
      const res = await fetch("/api/session/create", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create session");
      const data = await res.json();

      setCurrentSessionId(data.session_id);
      setSessionData({ correct_count: 0, total_count: 0, streak: 0 });
      localStorage.setItem("current_session_id", data.session_id);

      // Clear any existing problem state
      setProblem(null);
      setSessionId(null);
      setTopic("");
      setFeedback("");
      setIsCorrect(null);
      setUserAnswer("");
      localStorage.removeItem("current_math_problem");
    } catch (error) {
      console.error("Failed to create session:", error);
      // Could add error toast here
    } finally {
      setIsLoadingSession(false);
    }
  };

  const endSession = async () => {
    if (!currentSessionId) return;

    // Clear session from localStorage and state
    localStorage.removeItem("current_session_id");
    setCurrentSessionId(null);
    setSessionData(null);

    // Clear any existing problem state
    setProblem(null);
    setSessionId(null);
    setTopic("");
    setFeedback("");
    setIsCorrect(null);
    setUserAnswer("");
    localStorage.removeItem("current_math_problem");
  };

  const migrateLegacyScores = async () => {
    if (!legacyScores) return;

    setIsLoadingSession(true);
    try {
      // Create new session
      const res = await fetch("/api/session/create", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create session");
      const data = await res.json();

      // Update the session with legacy scores (this would require a new API endpoint)
      // For now, we'll just create a new session and note that scores will build up
      // In a real implementation, you'd want an API to set initial scores

      setCurrentSessionId(data.session_id);
      setSessionData({ correct_count: 0, total_count: 0, streak: 0 }); // Start fresh
      localStorage.setItem("current_session_id", data.session_id);

      // Clear legacy data
      localStorage.removeItem("math_scores");
      setLegacyScores(null);
      setIsMigrationModalOpen(false);
    } catch (error) {
      console.error("Failed to migrate scores:", error);
    } finally {
      setIsLoadingSession(false);
    }
  };

  const skipMigration = () => {
    localStorage.removeItem("math_scores");
    setLegacyScores(null);
    setIsMigrationModalOpen(false);
  };

  const joinSession = async () => {
    if (!joinSessionId || joinSessionId.length !== 5) return;

    setIsLoadingSession(true);
    try {
      const res = await fetch("/api/session/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: joinSessionId }),
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Session not found");
        }
        throw new Error("Failed to join session");
      }

      const data = await res.json();

      setCurrentSessionId(joinSessionId);
      setSessionData({
        correct_count: data.correct_count,
        total_count: data.total_count,
        streak: data.streak,
      });
      localStorage.setItem("current_session_id", joinSessionId);
      setJoinSessionId("");

      // Clear any existing problem state
      setProblem(null);
      setSessionId(null);
      setTopic("");
      setFeedback("");
      setIsCorrect(null);
      setUserAnswer("");
      localStorage.removeItem("current_math_problem");
    } catch (error) {
      console.error("Failed to join session:", error);
      // Could add error toast here
    } finally {
      setIsLoadingSession(false);
    }
  };

  const openHistoryModal = () => {
    setIsHistoryOpen(true);
    fetchHistory(1);
  };

  const closeHistoryModal = () => {
    setIsHistoryOpen(false);
    setHistoryData([]);
    setCurrentHistoryPage(1);
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
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed text-center mb-6">
            Challenge yourself with AI-generated math problems designed for
            Primary 5 students
          </p>
        </div>

        {/* Session Management UI */}
        <div className="bg-black/80 rounded-3xl p-6 md:p-8 mb-8 shadow-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-indigo-500/15 to-purple-600/15">
          <h2 className="text-2xl font-bold text-white mb-6">
            Session Management
          </h2>

          {currentSessionId ? (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/70">Current Session ID:</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentSessionId);
                    // Could add a toast notification here
                  }}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  <span className="font-mono">{currentSessionId}</span>
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <p className="text-white/70 mb-4">
                No active session. Create a new session or join an existing one
                to start tracking your progress.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={createNewSession}
              disabled={isLoadingSession}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {isLoadingSession && <LoadingSpinner />}
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              New Session
            </button>

            {currentSessionId && (
              <button
                onClick={endSession}
                disabled={isLoadingSession}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                {isLoadingSession && <LoadingSpinner />}
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                End Session
              </button>
            )}

            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Enter session ID (e.g., ABC12)"
                value={joinSessionId}
                onChange={(e) => setJoinSessionId(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                maxLength={5}
              />
              <button
                onClick={joinSession}
                disabled={
                  isLoadingSession ||
                  !joinSessionId ||
                  joinSessionId.length !== 5
                }
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                {isLoadingSession && <LoadingSpinner />}
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                Join
              </button>
            </div>
          </div>
        </div>

        {sessionData && sessionData.total_count > 0 && (
          <div className="bg-black/80 rounded-3xl p-6 md:p-8 mb-8 shadow-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-indigo-500/15 to-purple-600/15">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">
                Session: {currentSessionId}
              </h2>
              <button
                onClick={createNewSession}
                disabled={isLoadingSession}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-700 text-white rounded-xl font-semibold transition-all duration-300"
              >
                {isLoadingSession ? "Creating..." : "New Session"}
              </button>
            </div>
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-white mb-2">
                Score: {sessionData.correct_count}/{sessionData.total_count} |
                Streak: {sessionData.streak}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-4 rounded-full transition-all duration-300"
                  style={{
                    width:
                      sessionData.total_count > 0
                        ? `${
                            (sessionData.correct_count /
                              sessionData.total_count) *
                            100
                          }%`
                        : "0%",
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-black/80 rounded-3xl p-6 md:p-8 mb-8 shadow-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-indigo-500/15 to-purple-600/15">
          <div className="mb-6">
            <label className="block font-semibold text-lg mb-3 text-white">
              Select Difficulty Level
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              {(["easy", "medium", "hard"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedDifficulty(level)}
                  className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    selectedDifficulty === level
                      ? level === "easy"
                        ? "bg-green-600 text-white shadow-lg"
                        : level === "medium"
                        ? "bg-yellow-600 text-white shadow-lg"
                        : "bg-red-600 text-white shadow-lg"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={generateProblem}
            disabled={isGenerating}
            className="w-full font-semibold text-lg p-4 rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
          >
            {isGenerating && <LoadingSpinner />}
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="white"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
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
            <div className="mb-4 text-sm text-white/70 bg-gray-800/50 p-3 rounded-lg space-y-1">
              {topic && (
                <div>
                  <strong>Topic:</strong> {topic}
                </div>
              )}
              <div>
                <strong>Difficulty:</strong>{" "}
                {currentProblemDifficulty
                  ? currentProblemDifficulty.charAt(0).toUpperCase() +
                    currentProblemDifficulty.slice(1)
                  : "N/A"}
              </div>
            </div>
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
                  style={{ transform: "rotate(90deg)" }}
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

        {/* History Modal */}
        {isHistoryOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-white/10 mx-2">
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-white">
                    Problem History
                  </h2>
                  <button
                    onClick={closeHistoryModal}
                    className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center justify-center text-white transition-colors"
                  >
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {isLoadingHistory ? (
                  <div className="space-y-4">
                    <HistoryItemSkeleton />
                    <HistoryItemSkeleton />
                  </div>
                ) : historyData.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <svg
                        width="32"
                        height="32"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-white/70 text-lg">
                      No problems solved yet. Start practicing!
                    </p>
                  </div>
                ) : (
                  <>
                    <div
                      className="space-y-4 max-h-[420px] overflow-y-auto pr-4 mb-6"
                      style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: "#4B5563 #1F2937",
                      }}
                    >
                      {historyData.map((submission) => (
                        <div
                          key={submission.id}
                          className="bg-black/50 rounded-xl p-4 border border-white/10"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {submission.is_correct ? (
                                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                                    <CheckIcon />
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                                    <XIcon />
                                  </div>
                                )}
                                <span className="text-sm text-white/70">
                                  {new Date(
                                    submission.created_at
                                  ).toLocaleDateString()}{" "}
                                  at{" "}
                                  {new Date(
                                    submission.created_at
                                  ).toLocaleTimeString()}
                                </span>
                              </div>
                              <div className="flex gap-2 mb-2">
                                {submission.math_problem_sessions.topic && (
                                  <span className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded text-xs">
                                    {submission.math_problem_sessions.topic}
                                  </span>
                                )}
                                <span
                                  className={`px-2 py-1 rounded text-xs ${
                                    submission.math_problem_sessions
                                      .difficulty === "easy"
                                      ? "bg-green-600/20 text-green-300"
                                      : submission.math_problem_sessions
                                          .difficulty === "medium"
                                      ? "bg-yellow-600/20 text-yellow-300"
                                      : "bg-red-600/20 text-red-300"
                                  }`}
                                >
                                  {submission.math_problem_sessions.difficulty}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mb-3">
                            <p className="text-white text-sm leading-relaxed">
                              {submission.math_problem_sessions.problem_text
                                .length > 200
                                ? `${submission.math_problem_sessions.problem_text.substring(
                                    0,
                                    200
                                  )}...`
                                : submission.math_problem_sessions.problem_text}
                            </p>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-white/70">Your answer:</span>
                            <span
                              className={`font-semibold ${
                                submission.is_correct
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {submission.user_answer}
                            </span>
                            {!submission.is_correct && (
                              <>
                                <span className="text-white/70">Correct:</span>
                                <span className="text-green-400 font-semibold">
                                  {
                                    submission.math_problem_sessions
                                      .correct_answer
                                  }
                                </span>
                              </>
                            )}
                          </div>

                          <details className="mt-3">
                            <summary className="text-blue-400 cursor-pointer hover:text-blue-300 text-sm">
                              Show feedback
                            </summary>
                            <div className="mt-2 p-3 bg-black/30 rounded text-sm text-white/90">
                              {submission.feedback_text}
                            </div>
                          </details>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalHistoryPages > 1 && (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => fetchHistory(currentHistoryPage - 1)}
                          disabled={currentHistoryPage === 1}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                        >
                          Previous
                        </button>
                        <span className="text-white/70">
                          Page {currentHistoryPage} of {totalHistoryPages}
                        </span>
                        <button
                          onClick={() => fetchHistory(currentHistoryPage + 1)}
                          disabled={currentHistoryPage === totalHistoryPages}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Migration Modal */}
        {isMigrationModalOpen && legacyScores && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl max-w-md w-full shadow-2xl border border-white/10 mx-2">
              <div className="p-6 md:p-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <svg
                      width="32"
                      height="32"
                      fill="none"
                      stroke="white"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Legacy Scores Found
                  </h2>
                  <p className="text-white/70 mb-6 leading-relaxed">
                    We found your previous math practice scores (
                    {legacyScores.correctCount}/{legacyScores.totalCount}{" "}
                    correct, {legacyScores.streak} streak). Would you like to
                    start a new session? Your progress will continue from here.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={migrateLegacyScores}
                      disabled={isLoadingSession}
                      className="w-full font-semibold text-lg p-3 rounded-xl cursor-pointer transition-all duration-300 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white hover:bg-gradient-to-br hover:from-emerald-600 hover:to-emerald-800 flex items-center justify-center gap-2"
                    >
                      {isLoadingSession && <LoadingSpinner />}
                      Start New Session
                    </button>
                    <button
                      onClick={skipMigration}
                      className="w-full font-semibold text-lg p-3 rounded-xl cursor-pointer transition-all duration-300 bg-gray-600 hover:bg-gray-500 text-white"
                    >
                      Skip & Start Fresh
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        {isFeedbackModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl max-w-lg w-full max-h-[80vh] shadow-2xl border border-white/10 mx-2 overflow-hidden">
              <div className="p-6 md:p-8 overflow-y-auto max-h-full">
                {feedbackModalLoading ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                      <LoadingSpinner />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">
                      Analyzing Your Answer
                    </h2>
                    <p className="text-white/70">
                      Getting personalized feedback...
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">
                      {isCorrect ? "Excellent Work! 🎉" : "Keep Trying! 💪"}
                    </h2>
                    <div className="bg-black/50 p-4 rounded-xl text-left mb-6 max-h-60 overflow-y-auto">
                      <p className="text-white/90 leading-relaxed">
                        {feedback}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsFeedbackModalOpen(false)}
                      className="w-full font-semibold text-lg p-3 rounded-xl cursor-pointer transition-all duration-300 bg-gradient-to-br from-gray-500 to-gray-700 text-white hover:bg-gradient-to-br hover:from-gray-600 hover:to-gray-800"
                    >
                      Continue
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

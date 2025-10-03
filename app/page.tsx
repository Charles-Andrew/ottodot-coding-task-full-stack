"use client";

import { useState, useEffect } from "react";
import {
  MathIcon,
  CheckIcon,
  XIcon,
  CopyIcon,
  PlusIcon,
  EndIcon,
  JoinIcon,
  SparklesIcon,
  SendIcon,
  ClockIcon,
  WarningIcon,
  CloseIcon,
  DocumentIcon,
} from "@/components/icons";
import { LoadingSpinner, SkeletonLoader, HistoryItemSkeleton, SessionSkeleton } from "@/components/ui/loading";
import { HistoryModal } from "@/components/modals/HistoryModal";
import { MigrationModal } from "@/components/modals/MigrationModal";
import { FeedbackModal } from "@/components/modals/FeedbackModal";
import { SessionManagement } from "@/components/sections/SessionManagement";
import { SessionStats } from "@/components/sections/SessionStats";
import { ProblemGenerator } from "@/components/sections/ProblemGenerator";
import { ProblemDisplay } from "@/components/sections/ProblemDisplay";

interface MathProblem {
  problem_text: string;
  final_answer: number;
}

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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
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

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Toast function
  const showToastNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setToastMessage(null);
    }, 3000); // Hide after 3 seconds
  };

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
      setIsInitialLoading(true);
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
        setIsInitialLoading(false);
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

      // Auto-copy session ID to clipboard
      try {
        await navigator.clipboard.writeText(data.session_id);
        showToastNotification("Session created! ID copied to clipboard.");
      } catch (clipboardError) {
        console.warn("Failed to copy session ID to clipboard:", clipboardError);
        showToastNotification("Session created successfully!");
      }

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
      showToastNotification("Failed to create session. Please try again.");
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

      // Auto-copy session ID to clipboard
      try {
        await navigator.clipboard.writeText(joinSessionId);
        showToastNotification("Joined session! ID copied to clipboard.");
      } catch (clipboardError) {
        console.warn("Failed to copy session ID to clipboard:", clipboardError);
        showToastNotification("Successfully joined session!");
      }

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
      if (error.message === "Session not found") {
        showToastNotification("Session not found. Please check the ID and try again.");
      } else {
        showToastNotification("Failed to join session. Please try again.");
      }
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

        {isInitialLoading && !currentSessionId ? (
          <SessionSkeleton />
        ) : (
          <SessionManagement
            currentSessionId={currentSessionId}
            isLoadingSession={isLoadingSession}
            isInitialLoading={isInitialLoading}
            joinSessionId={joinSessionId}
            setJoinSessionId={setJoinSessionId}
            createNewSession={createNewSession}
            endSession={endSession}
            joinSession={joinSession}
            showToast={showToastNotification}
          />
        )}

        <SessionStats
          sessionData={sessionData}
          currentSessionId={currentSessionId}
          createNewSession={createNewSession}
          isLoadingSession={isLoadingSession}
        />

        {currentSessionId && (
          <ProblemGenerator
            selectedDifficulty={selectedDifficulty}
            setSelectedDifficulty={setSelectedDifficulty}
            generateProblem={generateProblem}
            isGenerating={isGenerating}
          />
        )}

        <ProblemDisplay
          problem={problem}
          topic={topic}
          currentProblemDifficulty={currentProblemDifficulty}
          userAnswer={userAnswer}
          setUserAnswer={setUserAnswer}
          submitAnswer={submitAnswer}
          isSubmitting={isSubmitting}
        />

        <HistoryModal
          isOpen={isHistoryOpen}
          onClose={closeHistoryModal}
          historyData={historyData}
          currentHistoryPage={currentHistoryPage}
          totalHistoryPages={totalHistoryPages}
          isLoadingHistory={isLoadingHistory}
          onFetchHistory={fetchHistory}
        />

        <MigrationModal
          isOpen={isMigrationModalOpen}
          legacyScores={legacyScores}
          isLoadingSession={isLoadingSession}
          onMigrate={migrateLegacyScores}
          onSkip={skipMigration}
        />

        <FeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          isCorrect={isCorrect}
          feedback={feedback}
          isLoading={feedbackModalLoading}
        />

        {/* Toast Notification */}
        {showToast && toastMessage && (
          <div className="fixed top-4 right-4 z-50 animate-fade-in">
            <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <CheckIcon />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

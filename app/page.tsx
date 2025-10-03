"use client";

import { useState, useEffect, useCallback } from "react";

import { SessionSkeleton } from "@/components/ui/loading";
import { Toast } from "@/components/ui/toast";
import { HistoryModal } from "@/components/modals/HistoryModal";

import { FeedbackModal } from "@/components/modals/FeedbackModal";
import { SessionManagement } from "@/components/sections/SessionManagement";
import { SessionStats } from "@/components/sections/SessionStats";
import { ProblemGenerator } from "@/components/sections/ProblemGenerator";
import { ProblemDisplay } from "@/components/sections/ProblemDisplay";
import { Header } from "@/components/sections/Header";

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
  const [currentProblemType, setCurrentProblemType] = useState<string>("");

  // Problem type and topic filtering state
  const [selectedProblemType, setSelectedProblemType] = useState<
    "random" | "addition" | "subtraction" | "multiplication" | "division"
  >("random");
  const [selectedTopic, setSelectedTopic] = useState<string>("random");
  const [topics, setTopics] = useState<string[]>([]);
  const [topicMapping, setTopicMapping] = useState<Record<string, string>>({});

  // Session state management
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<{
    correct_count: number;
    total_count: number;
    streak: number;
    hint_credits: number;
    hint_cap: number;
  } | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isJoiningSession, setIsJoiningSession] = useState(false);
  const [joinSessionId, setJoinSessionId] = useState("");

  // Loading states for data restoration

  // Feedback modal state
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackModalLoading, setFeedbackModalLoading] = useState(false);

  // History modal state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState<HistorySubmission[]>([]);
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
  const [totalHistoryPages, setTotalHistoryPages] = useState(1);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Hint state
  const [hint, setHint] = useState<string | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);

  // Toast function
  const showToastNotification = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setToastMessage(null);
    }, 3000); // Hide after 3 seconds
  };

  // Function to get filtered topics based on problem type
  const getFilteredTopics = useCallback((allTopics: string[]): string[] => {
    // For now, return all topics since most math topics can work with any operation
    // The AI will generate appropriate problems based on the topic and operation type
    return allTopics;
  }, []);



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
              // Map topic key to display name for UI display
              setTopic(problemData.topic ? (topicMapping[problemData.topic] || problemData.topic) : "");
              setCurrentProblemDifficulty(problemData.difficulty || "N/A");
              setCurrentProblemType(problemData.problem_type || "");
              // Note: Filter selections (operation type, topic, difficulty) are not restored from localStorage
              // They should reset to defaults on each page load for a fresh start
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
        showToastNotification("Could not restore previous problem.", "error");
        // Reset problem state to clean slate
        setProblem(null);
        setSessionId(null);
        setTopic("");
        setCurrentProblemDifficulty("");
        setCurrentProblemType("");
      }
    };

    loadSavedProblem();
  }, [topicMapping]);

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
              hint_credits: data.session.hint_credits,
              hint_cap: data.session.hint_cap,
            });
          } else {
            // Session not found or expired, clear localStorage
            localStorage.removeItem("current_session_id");
          }
        }
      } catch (error) {
        console.warn("Failed to load session:", error);
        localStorage.removeItem("current_session_id");
        showToastNotification("Could not restore previous session.", "error");
        // Reset session state
        setCurrentSessionId(null);
        setSessionData(null);
      } finally {
        setIsLoadingSession(false);
        setIsInitialLoading(false);
      }
    };

    loadSession();
  }, []);

  // Load topics from JSON file on mount
  useEffect(() => {
    const loadTopics = async () => {
      try {
        const res = await fetch("/data/primary-5-topics.json");
        if (res.ok) {
          const data = await res.json();
          // Convert object to array of keys for easier handling
          const topicKeys = Object.keys(data.primary_5_topics);
          setTopics(topicKeys);
          // Store the full mapping for display purposes
          setTopicMapping(data.primary_5_topics);
        }
      } catch (error) {
        console.warn("Failed to load topics:", error);
        // Fallback to empty array
        setTopics([]);
        showToastNotification("Could not load topic options. Using basic topics only.", "error");
      }
    };

    loadTopics();
  }, []);



  // Function to get random problem type
  const getRandomProblemType = (): "addition" | "subtraction" | "multiplication" | "division" => {
    const types = ["addition", "subtraction", "multiplication", "division"] as const;
    return types[Math.floor(Math.random() * types.length)];
  };

  // Function to get random topic
  const getRandomTopic = (): string => {
    if (topics.length === 0) return "";
    return topics[Math.floor(Math.random() * topics.length)];
  };

  const generateProblem = async () => {
    // Clear any existing saved problem
    try {
      localStorage.removeItem("current_math_problem");
    } catch (error) {
      console.warn("Failed to clear localStorage:", error);
    }

    setIsGenerating(true);
    try {
      // Resolve random selections
      const actualProblemType = selectedProblemType === "random" ? getRandomProblemType() : selectedProblemType;
      const actualTopic = selectedTopic === "random" ? getRandomTopic() : selectedTopic;

      const res = await fetch("/api/math-problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty: selectedDifficulty,
          problem_type: actualProblemType,
          topic: actualTopic
        }),
      });
      if (!res.ok) throw new Error("Failed to generate problem");
      const data = await res.json();
      setCurrentProblemDifficulty(data.difficulty || "N/A");
      setCurrentProblemType(data.problem_type || "");
      setProblem({ problem_text: data.problem_text, final_answer: 0 });
      setSessionId(data.sessionId);
      // Map topic key to display name for UI display
      setTopic(data.topic ? (topicMapping[data.topic] || data.topic) : "");
      setFeedback("");
      setIsCorrect(null);

      // Save to localStorage (save the actual resolved values, not "random")
      try {
        localStorage.setItem(
          "current_math_problem",
          JSON.stringify({
            sessionId: data.sessionId,
            problem_type: actualProblemType,
            topic: actualTopic,
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
    setCurrentProblemType("");
    setHint(null);
    setShowHint(false);

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
              hint_credits: sessionDataResponse.session.hint_credits,
              hint_cap: sessionDataResponse.session.hint_cap,
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

  const getHint = async () => {
    if (!sessionId || !currentSessionId) return;
    setIsLoadingHint(true);
    try {
      const res = await fetch("/api/math-problem/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_session_id: sessionId,
          user_session_id: currentSessionId,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to get hint");
      }
      const data = await res.json();
      setHint(data.hint);
      setShowHint(true);

      // Refresh session data to update hint credits
      const sessionRes = await fetch(
        `/api/session/data?session_id=${currentSessionId}`
      );
      if (sessionRes.ok) {
        const sessionDataResponse = await sessionRes.json();
        setSessionData({
          correct_count: sessionDataResponse.session.correct_count,
          total_count: sessionDataResponse.session.total_count,
          streak: sessionDataResponse.session.streak,
          hint_credits: sessionDataResponse.session.hint_credits,
          hint_cap: sessionDataResponse.session.hint_cap,
        });
      }
    } catch (error) {
      console.error(error);
      showToastNotification(error.message || "Failed to get hint", "error");
    } finally {
      setIsLoadingHint(false);
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
      showToastNotification("Failed to load history. Please try again.", "error");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const createNewSession = async () => {
    setIsCreatingSession(true);
    setIsLoadingSession(true);
    try {
      const res = await fetch("/api/session/create", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create session");
      const data = await res.json();

      setCurrentSessionId(data.session_id);
      setSessionData({
        correct_count: 0,
        total_count: 0,
        streak: 0,
        hint_credits: 3,
        hint_cap: 5,
      });
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
      showToastNotification(
        "Failed to create session. Please try again.",
        "error"
      );
    } finally {
      setIsLoadingSession(false);
      setIsCreatingSession(false);
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
    setHint(null);
    setShowHint(false);
    setUserAnswer("");
    localStorage.removeItem("current_math_problem");
  };

  const joinSession = async () => {
    if (!joinSessionId || joinSessionId.length !== 5) return;

    // Check if trying to join the current active session
    if (currentSessionId === joinSessionId) {
      showToastNotification("This is already your current active session.");
      setJoinSessionId("");
      return;
    }

    setIsJoiningSession(true);
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
        hint_credits: data.hint_credits,
        hint_cap: data.hint_cap,
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
        showToastNotification(
          "Session not found. Please check the ID and try again.",
          "error"
        );
      } else {
        showToastNotification(
          "Failed to join session. Please try again.",
          "error"
        );
      }
    } finally {
      setIsLoadingSession(false);
      setIsJoiningSession(false);
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
        <Header />

        {(isInitialLoading && !currentSessionId) ||
        isCreatingSession ||
        isJoiningSession ? (
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

        <SessionStats sessionData={sessionData} onOpenHistory={openHistoryModal} />

        {currentSessionId &&
          !(
            (isInitialLoading && !currentSessionId) ||
            isCreatingSession ||
            isJoiningSession
          ) && (
            <ProblemGenerator
              selectedDifficulty={selectedDifficulty}
              setSelectedDifficulty={setSelectedDifficulty}
              selectedProblemType={selectedProblemType}
              setSelectedProblemType={setSelectedProblemType}
              selectedTopic={selectedTopic}
              setSelectedTopic={setSelectedTopic}
              topics={getFilteredTopics(topics)}
              topicMapping={topicMapping}
              generateProblem={generateProblem}
              isGenerating={isGenerating}
            />
          )}

        {!(
          (isInitialLoading && !currentSessionId) ||
          isCreatingSession ||
          isJoiningSession
        ) && (
          <ProblemDisplay
            problem={problem}
            topic={topic}
            currentProblemDifficulty={currentProblemDifficulty}
            currentProblemType={currentProblemType}
            userAnswer={userAnswer}
            setUserAnswer={setUserAnswer}
            submitAnswer={submitAnswer}
            isSubmitting={isSubmitting}
            isGenerating={isGenerating}
            hint={hint}
            showHint={showHint}
            isLoadingHint={isLoadingHint}
            getHint={getHint}
            hintCredits={sessionData?.hint_credits || 0}
          />
        )}

        <HistoryModal
          isOpen={isHistoryOpen}
          onClose={closeHistoryModal}
          historyData={historyData}
          currentHistoryPage={currentHistoryPage}
          totalHistoryPages={totalHistoryPages}
          isLoadingHistory={isLoadingHistory}
          onFetchHistory={fetchHistory}
          topicMapping={topicMapping}
        />

        <FeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          isCorrect={isCorrect}
          feedback={feedback}
          isLoading={feedbackModalLoading}
        />

        {/* Toast Notification */}
        <Toast message={toastMessage || ""} type={toastType} show={showToast} />
      </div>
    </>
  );
}

import { useState, useEffect, useCallback, useRef } from "react";

type ToastFunction = (message: string, type?: "success" | "error") => void;

interface MathProblem {
  problem_text: string;
  final_answer: number;
}

export function useProblem(currentSessionId?: string | null, topicMapping?: Record<string, string>) {
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [topic, setTopic] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [currentProblemDifficulty, setCurrentProblemDifficulty] = useState<string>("");
  const [currentProblemType, setCurrentProblemType] = useState<string>("");

  // Problem type and topic filtering state
  const [selectedProblemType, setSelectedProblemType] = useState<"random" | "addition" | "subtraction" | "multiplication" | "division">("random");
  const [selectedTopic, setSelectedTopic] = useState<string>("random");

  // Feedback modal state
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackModalLoading, setFeedbackModalLoading] = useState(false);

  // Hint state
  const [hint, setHint] = useState<string | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Function to show toast - will be passed from parent
  const showToastRef = useRef<ToastFunction>((message: string, type: "success" | "error" = "success") => {
    console.log(`Toast: ${type} - ${message}`);
  });

  // Function to refresh session data - will be set from parent
  const refreshSessionDataRef = useRef<(() => Promise<void>) | undefined>(undefined);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    showToastRef.current(message, type);
  }, []);

  // Function to get random problem type
  const getRandomProblemType = (): "addition" | "subtraction" | "multiplication" | "division" => {
    const types = ["addition", "subtraction", "multiplication", "division"] as const;
    return types[Math.floor(Math.random() * types.length)];
  };

  // Function to get random topic
  const getRandomTopic = useCallback((topics: string[]): string => {
    if (topics.length === 0) return "";
    return topics[Math.floor(Math.random() * topics.length)];
  }, []);

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
              setTopic(problemData.topic ? (topicMapping?.[problemData.topic] || problemData.topic) : "");
              setCurrentProblemDifficulty(problemData.difficulty || "N/A");
              setCurrentProblemType(problemData.problem_type || "");
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
        showToast("Could not restore previous problem.", "error");
        // Reset problem state to clean slate
        setProblem(null);
        setSessionId(null);
        setTopic("");
        setCurrentProblemDifficulty("");
        setCurrentProblemType("");
      }
    };

    loadSavedProblem();
  }, [topicMapping, showToast]);

  const generateProblem = async (topics: string[]) => {
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
      const actualTopic = selectedTopic === "random" ? getRandomTopic(topics) : selectedTopic;

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
      setTopic(data.topic ? (topicMapping?.[data.topic] || data.topic) : "");
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
    if (!userAnswer || !sessionId || !currentSessionId) return;
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

      // Refresh session data to update scores
      await refreshSessionDataRef.current?.();

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
      await refreshSessionDataRef.current?.();
    } catch (error) {
      console.error(error);
      showToast(error.message || "Failed to get hint", "error");
    } finally {
      setIsLoadingHint(false);
    }
  };

  const resetProblemState = () => {
    setProblem(null);
    setUserAnswer("");
    setFeedback("");
    setIsCorrect(null);
    setTopic("");
    setCurrentProblemDifficulty("");
    setCurrentProblemType("");
    setHint(null);
    setShowHint(false);
    setIsFeedbackModalOpen(false);
    setFeedbackModalLoading(false);
    // Clear localStorage
    try {
      localStorage.removeItem("current_math_problem");
    } catch (error) {
      console.warn("Failed to clear localStorage:", error);
    }
  };

  return {
    problem,
    userAnswer,
    setUserAnswer,
    feedback,
    isGenerating,
    isSubmitting,
    sessionId,
    isCorrect,
    topic,
    selectedDifficulty,
    setSelectedDifficulty,
    currentProblemDifficulty,
    currentProblemType,
    selectedProblemType,
    setSelectedProblemType,
    selectedTopic,
    setSelectedTopic,
    isFeedbackModalOpen,
    setIsFeedbackModalOpen,
    feedbackModalLoading,
    hint,
    isLoadingHint,
    showHint,
    generateProblem,
    submitAnswer,
    getHint,
    resetProblemState,
    setShowToast: (fn: ToastFunction) => {
      showToastRef.current = fn;
    },
    setRefreshSessionData: (fn: () => Promise<void>) => {
      refreshSessionDataRef.current = fn;
    },
  };
}
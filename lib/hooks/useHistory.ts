import { useState, useCallback, useRef } from "react";

type ToastFunction = (message: string, type?: "success" | "error") => void;

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
     problem_type: string;
   };
}

export function useHistory() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState<HistorySubmission[]>([]);
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
  const [totalHistoryPages, setTotalHistoryPages] = useState(1);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Function to show toast - will be passed from parent
  const showToastRef = useRef<ToastFunction>((message: string, type: "success" | "error" = "success") => {
    console.log(`Toast: ${type} - ${message}`);
  });

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    showToastRef.current(message, type);
  }, []);

  const fetchHistory = useCallback(async (page: number = 1, userSessionId?: string) => {
    if (!userSessionId) return;

    setIsLoadingHistory(true);
    try {
      const res = await fetch(
        `/api/math-problem/history?page=${page}&limit=10&user_session_id=${userSessionId}`
      );
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      setHistoryData(data.submissions);
      setTotalHistoryPages(data.pagination.totalPages);
      setCurrentHistoryPage(data.pagination.currentPage);
    } catch (error) {
      console.error("Failed to fetch history:", error);
      showToast("Failed to load history. Please try again.", "error");
    } finally {
      setIsLoadingHistory(false);
    }
  }, [showToast]);

  const openHistoryModal = useCallback((userSessionId?: string) => {
    setIsHistoryOpen(true);
    fetchHistory(1, userSessionId);
  }, [fetchHistory]);

  const closeHistoryModal = useCallback(() => {
    setIsHistoryOpen(false);
    setHistoryData([]);
    setCurrentHistoryPage(1);
  }, []);

  return {
    isHistoryOpen,
    historyData,
    currentHistoryPage,
    totalHistoryPages,
    isLoadingHistory,
    fetchHistory,
    openHistoryModal,
    closeHistoryModal,
    setShowToast: (fn: ToastFunction) => {
      showToastRef.current = fn;
    },
  };
}
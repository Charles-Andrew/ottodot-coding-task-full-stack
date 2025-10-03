import { useState, useEffect, useCallback, useRef } from "react";

type ToastFunction = (message: string, type?: "success" | "error") => void;

interface SessionData {
  correct_count: number;
  total_count: number;
  streak: number;
  hint_credits: number;
  hint_cap: number;
}

export function useSession() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isJoiningSession, setIsJoiningSession] = useState(false);
  const [joinSessionId, setJoinSessionId] = useState("");

  // Function to show toast - will be passed from parent
  const showToastRef = useRef<ToastFunction>((message: string, type: "success" | "error" = "success") => {
    console.log(`Toast: ${type} - ${message}`);
  });

  // Function to reset problem state - will be set from parent
  const resetProblemStateRef = useRef<(() => void) | undefined>(undefined);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    showToastRef.current(message, type);
  }, []);

  const refreshSessionData = useCallback(async () => {
    if (!currentSessionId) return;

    try {
      const res = await fetch(`/api/session/data?session_id=${currentSessionId}`);
      if (res.ok) {
        const data = await res.json();
        setSessionData({
          correct_count: data.session.correct_count,
          total_count: data.session.total_count,
          streak: data.session.streak,
          hint_credits: data.session.hint_credits,
          hint_cap: data.session.hint_cap,
        });
      }
    } catch (error) {
      console.warn("Failed to refresh session data:", error);
    }
  }, [currentSessionId]);

  // Load saved session from localStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      setIsInitialLoading(true);
      try {
        const savedSessionId = localStorage.getItem("current_session_id");
        if (savedSessionId) {
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
        showToast("Could not restore previous session.", "error");
        // Reset session state
        setCurrentSessionId(null);
        setSessionData(null);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadSession();
  }, [showToast]);

  const createNewSession = async () => {
    setIsCreatingSession(true);
    try {
      const res = await fetch("/api/session/create", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create session");
      const data = await res.json();

      setCurrentSessionId(data.session_id);
      localStorage.setItem("current_session_id", data.session_id);

      // Fetch actual session data from database instead of using optimistic values
      try {
        const sessionRes = await fetch(`/api/session/data?session_id=${data.session_id}`);
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          setSessionData({
            correct_count: sessionData.session.correct_count,
            total_count: sessionData.session.total_count,
            streak: sessionData.session.streak,
            hint_credits: sessionData.session.hint_credits,
            hint_cap: sessionData.session.hint_cap,
          });
        } else {
          // Fallback to expected defaults if fetch fails
          setSessionData({
            correct_count: 0,
            total_count: 0,
            streak: 0,
            hint_credits: 3,
            hint_cap: 5,
          });
        }
      } catch (error) {
        console.warn("Failed to fetch session data after creation:", error);
        // Fallback to expected defaults
        setSessionData({
          correct_count: 0,
          total_count: 0,
          streak: 0,
          hint_credits: 3,
          hint_cap: 5,
        });
      }

      showToast("Session created successfully!");

      // Clear any existing problem state - this will be handled by useProblem hook
    } catch (error) {
      console.error("Failed to create session:", error);
      showToast(
        "Failed to create session. Please try again.",
        "error"
      );
    } finally {
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
    resetProblemStateRef.current?.();
  };

  const joinSession = async () => {
    if (!joinSessionId || joinSessionId.length !== 5) return;

    // Check if trying to join the current active session
    if (currentSessionId === joinSessionId) {
      showToast("This is already your current active session.");
      setJoinSessionId("");
      return;
    }

    setIsJoiningSession(true);
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

      showToast("Successfully joined session!");

      // Copy session ID to clipboard
      try {
        await navigator.clipboard.writeText(joinSessionId);
      } catch (clipboardError) {
        console.warn("Failed to copy session ID to clipboard:", clipboardError);
      }

      setJoinSessionId("");

      // Clear any existing problem state - handled by useProblem
    } catch (error) {
      console.error("Failed to join session:", error);
      if (error.message === "Session not found") {
        showToast(
          "Session not found. Please check the ID and try again.",
          "error"
        );
      } else {
        showToast(
          "Failed to join session. Please try again.",
          "error"
        );
      }
    } finally {
      setIsJoiningSession(false);
    }
  };

  return {
    currentSessionId,
    sessionData,
    isInitialLoading,
    isCreatingSession,
    isJoiningSession,
    joinSessionId,
    setJoinSessionId,
    createNewSession,
    endSession,
    joinSession,
    setShowToast: (fn: ToastFunction) => {
      // Allow parent to inject toast function
      showToastRef.current = fn;
    },
    setResetProblemState: (fn: () => void) => {
      // Allow parent to inject problem reset function
      resetProblemStateRef.current = fn;
    },
    refreshSessionData,
  };
}
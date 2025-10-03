import { useState, useCallback } from "react";

export function useToast() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);

  // Toast function
  const showToastNotification = useCallback((
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
  }, []);

  return {
    toastMessage,
    toastType,
    showToast,
    showToastNotification,
  };
}
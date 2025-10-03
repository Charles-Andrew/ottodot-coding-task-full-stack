import { useState, useEffect, useCallback, useRef } from "react";

type ToastFunction = (message: string, type?: "success" | "error") => void;

export function useTopics() {
  const [topics, setTopics] = useState<string[]>([]);
  const [topicMapping, setTopicMapping] = useState<Record<string, string>>({});

  // Function to show toast - will be passed from parent
  const showToastRef = useRef<ToastFunction>((message: string, type: "success" | "error" = "success") => {
    console.log(`Toast: ${type} - ${message}`);
  });

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    showToastRef.current(message, type);
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
        showToast("Could not load topic options. Using basic topics only.", "error");
      }
    };

    loadTopics();
  }, [showToast]);

  // Function to get filtered topics based on problem type
  const getFilteredTopics = useCallback((allTopics: string[]): string[] => {
    // For now, return all topics since most math topics can work with any operation
    // The AI will generate appropriate problems based on the topic and operation type
    return allTopics;
  }, []);

  return {
    topics,
    topicMapping,
    getFilteredTopics,
    setShowToast: (fn: ToastFunction) => {
      showToastRef.current = fn;
    },
  };
}
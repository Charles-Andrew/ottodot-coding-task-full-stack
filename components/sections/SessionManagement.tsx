import { useState } from "react";
import { CopyIcon, PlusIcon, EndIcon, JoinIcon } from "@/components/icons";
import { LoadingSpinner } from "@/components/ui/loading";

interface SessionManagementProps {
  currentSessionId: string | null;
  isLoadingSession: boolean;
  isInitialLoading: boolean;
  joinSessionId: string;
  setJoinSessionId: (id: string) => void;
  createNewSession: () => void;
  endSession: () => void;
  joinSession: () => void;
  showToast: (message: string) => void;
}

export const SessionManagement = ({
  currentSessionId,
  isLoadingSession,
  isInitialLoading,
  joinSessionId,
  setJoinSessionId,
  createNewSession,
  endSession,
  joinSession,
  showToast,
}: SessionManagementProps) => {
  return (
    <div className="bg-black/80 rounded-3xl p-6 md:p-8 mb-8 shadow-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-indigo-500/15 to-purple-600/15">
      <h2 className="text-2xl font-bold text-white mb-6">
        Session
      </h2>

      {currentSessionId ? (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/70">Current Session ID:</span>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(currentSessionId);
                  showToast("Session ID copied to clipboard!");
                } catch (error) {
                  console.warn("Failed to copy session ID:", error);
                  showToast("Failed to copy session ID.");
                }
              }}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <span className="font-mono">{currentSessionId}</span>
              <CopyIcon />
            </button>
          </div>
        </div>
      ) : !isInitialLoading ? (
        <div className="mb-6">
          <p className="text-white/70 mb-4">
            No active session. Create a new session or join an existing one
            to start tracking your progress.
          </p>
        </div>
      ) : null}

      {currentSessionId && (
        <div className="mb-4">
          <button
            onClick={endSession}
            disabled={isLoadingSession}
            className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            {isLoadingSession && <LoadingSpinner />}
            <EndIcon />
            End Session
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={createNewSession}
          disabled={isLoadingSession}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          {isLoadingSession && <LoadingSpinner />}
          <PlusIcon />
          New Session
        </button>

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
            <JoinIcon />
            Join
          </button>
        </div>
      </div>
    </div>
  );
};
interface SessionData {
  correct_count: number;
  total_count: number;
  streak: number;
}

interface SessionStatsProps {
  sessionData: SessionData | null;
  currentSessionId: string | null;
  createNewSession: () => void;
  isLoadingSession: boolean;
}

export const SessionStats = ({
  sessionData,
  currentSessionId,
  createNewSession,
  isLoadingSession,
}: SessionStatsProps) => {
  if (!sessionData || sessionData.total_count === 0) return null;

  return (
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
  );
};
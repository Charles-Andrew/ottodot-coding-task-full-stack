interface SessionData {
  correct_count: number;
  total_count: number;
  streak: number;
  hint_credits: number;
  hint_cap: number;
}

interface SessionStatsProps {
  sessionData: SessionData | null;
}

export const SessionStats = ({
  sessionData,
}: SessionStatsProps) => {
  if (!sessionData || sessionData.total_count === 0) return null;

  return (
    <div className="bg-black/80 rounded-3xl p-6 md:p-8 mb-8 shadow-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-indigo-500/15 to-purple-600/15">
      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-white mb-2">
          Score: {sessionData.correct_count}/{sessionData.total_count} |
          Streak: {sessionData.streak}
        </div>
        <div className="text-lg text-purple-300 mb-4">
          Hint Credits: {sessionData.hint_credits}/{sessionData.hint_cap}
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
import { WarningIcon } from "@/components/icons";
import { LoadingSpinner } from "@/components/ui/loading";

interface MigrationModalProps {
  isOpen: boolean;
  legacyScores: {
    correctCount: number;
    totalCount: number;
    streak: number;
  } | null;
  isLoadingSession: boolean;
  onMigrate: () => void;
  onSkip: () => void;
}

export const MigrationModal = ({
  isOpen,
  legacyScores,
  isLoadingSession,
  onMigrate,
  onSkip,
}: MigrationModalProps) => {
  if (!isOpen || !legacyScores) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl max-w-md w-full shadow-2xl border border-white/10 mx-2">
        <div className="p-6 md:p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-6">
              <WarningIcon />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Legacy Scores Found
            </h2>
            <p className="text-white/70 mb-6 leading-relaxed">
              We found your previous math practice scores (
              {legacyScores.correctCount}/{legacyScores.totalCount}{" "}
              correct, {legacyScores.streak} streak). Would you like to
              start a new session? Your progress will continue from here.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={onMigrate}
                disabled={isLoadingSession}
                className="w-full font-semibold text-lg p-3 rounded-xl cursor-pointer transition-all duration-300 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white hover:bg-gradient-to-br hover:from-emerald-600 hover:to-emerald-800 flex items-center justify-center gap-2"
              >
                {isLoadingSession && <LoadingSpinner />}
                Start New Session
              </button>
              <button
                onClick={onSkip}
                className="w-full font-semibold text-lg p-3 rounded-xl cursor-pointer transition-all duration-300 bg-gray-600 hover:bg-gray-500 text-white"
              >
                Skip & Start Fresh
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
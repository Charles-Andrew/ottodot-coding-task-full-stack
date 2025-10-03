import { CheckIcon, XIcon, CloseIcon, ClockIcon } from "@/components/icons";
import { HistoryItemSkeleton, LoadingSpinner } from "@/components/ui/loading";
import { SafeHtmlWithMath } from "@/components/ui/SafeHtmlWithMath";

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

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyData: HistorySubmission[];
  currentHistoryPage: number;
  totalHistoryPages: number;
  isLoadingHistory: boolean;
  onFetchHistory: (page: number) => void;
  topicMapping: Record<string, string>;
}

export const HistoryModal = ({
  isOpen,
  onClose,
  historyData,
  currentHistoryPage,
  totalHistoryPages,
  isLoadingHistory,
  onFetchHistory,
  topicMapping,
}: HistoryModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-white/10 mx-2">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Problem History
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center justify-center text-white transition-colors"
            >
              <CloseIcon />
            </button>
          </div>

          {isLoadingHistory ? (
            <div className="space-y-4">
              <HistoryItemSkeleton />
              <HistoryItemSkeleton />
            </div>
          ) : historyData.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                <ClockIcon />
              </div>
              <p className="text-white/70 text-lg">
                No problems solved yet. Start practicing!
              </p>
            </div>
          ) : (
            <>
              <div
                className="space-y-4 max-h-[420px] overflow-y-auto pr-4 mb-6"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#4B5563 #1F2937",
                }}
              >
                {historyData.map((submission) => (
                  <div
                    key={submission.id}
                    className="bg-black/50 rounded-xl p-4 border border-white/10"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {submission.is_correct ? (
                            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                              <CheckIcon />
                            </div>
                          ) : (
                            <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                              <XIcon />
                            </div>
                          )}
                          <span className="text-sm text-white/70">
                            {new Date(
                              submission.created_at
                            ).toLocaleDateString()}{" "}
                            at{" "}
                            {new Date(
                              submission.created_at
                            ).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex gap-2 mb-2">
                          {submission.math_problem_sessions.topic && (
                            <span className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded text-xs">
                              {topicMapping[submission.math_problem_sessions.topic] || submission.math_problem_sessions.topic}
                            </span>
                          )}
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              submission.math_problem_sessions
                                .difficulty === "easy"
                                ? "bg-green-600/20 text-green-300"
                                : submission.math_problem_sessions
                                    .difficulty === "medium"
                                ? "bg-yellow-600/20 text-yellow-300"
                                : "bg-red-600/20 text-red-300"
                            }`}
                          >
                            {submission.math_problem_sessions.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-white text-sm leading-relaxed">
                        {submission.math_problem_sessions.problem_text
                          .length > 200
                          ? `${submission.math_problem_sessions.problem_text.substring(
                              0,
                              200
                            )}...`
                          : submission.math_problem_sessions.problem_text}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-white/70">Your answer:</span>
                      <span
                        className={`font-semibold ${
                          submission.is_correct
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {submission.user_answer}
                      </span>
                      {!submission.is_correct && (
                        <>
                          <span className="text-white/70">Correct:</span>
                          <span className="text-green-400 font-semibold">
                            {
                              submission.math_problem_sessions
                                .correct_answer
                            }
                          </span>
                        </>
                      )}
                    </div>

                     <details className="mt-3">
                       <summary className="text-blue-400 cursor-pointer hover:text-blue-300 text-sm">
                         Show feedback
                       </summary>
                       <div className="mt-2 p-3 bg-black/30 rounded text-sm">
                         <SafeHtmlWithMath
                           html={submission.feedback_text}
                           className="text-white/90 leading-relaxed prose prose-invert max-w-none"
                         />
                       </div>
                     </details>
                  </div>
                ))}
              </div>

               {/* Pagination */}
               {totalHistoryPages > 1 && (
                 <div className="flex items-center justify-center gap-2">
                   <button
                     onClick={() => onFetchHistory(currentHistoryPage - 1)}
                     disabled={currentHistoryPage === 1}
                     className="w-10 h-10 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center text-xl"
                     title="Previous page"
                   >
                     ‹
                   </button>
                   <span className="text-white/70">
                     Page {currentHistoryPage} of {totalHistoryPages}
                   </span>
                   <button
                     onClick={() => onFetchHistory(currentHistoryPage + 1)}
                     disabled={currentHistoryPage === totalHistoryPages}
                     className="w-10 h-10 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center text-xl"
                     title="Next page"
                   >
                     ›
                   </button>
                 </div>
               )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
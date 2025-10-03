import { MathIcon } from "@/components/icons";
import { SafeHtmlWithMath } from "@/components/ui/SafeHtmlWithMath";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCorrect: boolean | null;
  feedback: string;
  isLoading: boolean;
}

export const FeedbackModal = ({
  isOpen,
  onClose,
  isCorrect,
  feedback,
  isLoading,
}: FeedbackModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl max-w-lg w-full max-h-[80vh] shadow-2xl border border-white/10 mx-2 overflow-hidden">
        <div
          className="p-6 md:p-8 overflow-y-auto max-h-full"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#4B5563 #1F2937",
          }}
        >
          {isLoading ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex flex-col items-center justify-center mx-auto mb-6 relative">
                <MathIcon />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Analyzing Your Answer
              </h2>
              <p className="text-white/70">Getting personalized feedback...</p>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                {isCorrect ? "Excellent Work! 🎉" : "Keep Trying! 💪"}
              </h2>
                <div
                  className="bg-black/50 p-4 rounded-xl text-left mb-6 max-h-60 overflow-y-auto"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "#4B5563 #1F2937",
                  }}
                >
                 <SafeHtmlWithMath
                   html={feedback}
                   className="text-white/90 leading-relaxed prose prose-invert max-w-none"
                 />
               </div>
              <button
                onClick={onClose}
                className="w-full font-semibold text-lg p-3 rounded-xl cursor-pointer transition-all duration-300 bg-gradient-to-br from-gray-500 to-gray-700 text-white hover:bg-gradient-to-br hover:from-gray-600 hover:to-gray-800"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

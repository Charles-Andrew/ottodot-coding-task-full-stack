import { DocumentIcon, SendIcon, SparklesIcon } from "@/components/icons";
import { LoadingSpinner } from "@/components/ui/loading";

interface MathProblem {
  problem_text: string;
  final_answer: number;
}

interface ProblemDisplayProps {
  problem: MathProblem | null;
  topic: string;
  currentProblemDifficulty: string;
  currentProblemType: string;
  userAnswer: string;
  setUserAnswer: (answer: string) => void;
  submitAnswer: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  isGenerating: boolean;
  hint: string | null;
  showHint: boolean;
  isLoadingHint: boolean;
  getHint: () => void;
  hintCredits: number;
}

export const ProblemDisplay = ({
  problem,
  topic,
  currentProblemDifficulty,
  currentProblemType,
  userAnswer,
  setUserAnswer,
  submitAnswer,
  isSubmitting,
  isGenerating,
  hint,
  showHint,
  isLoadingHint,
  getHint,
  hintCredits,
}: ProblemDisplayProps) => {
  if (!problem || isGenerating) return null;

  return (
    <div className="bg-gradient-radial from-black/90 via-gray-900/80 to-black/90 rounded-3xl p-6 md:p-8 mb-8 shadow-2xl backdrop-blur-xl border border-white/10">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4">
          <DocumentIcon />
        </div>
        <h2 className="text-2xl font-bold text-white">Problem</h2>
      </div>
       <div className="mb-4 text-sm text-white/70 bg-gray-800/50 p-3 rounded-lg space-y-1">
         {currentProblemType && (
           <div>
             <strong>Type:</strong>{" "}
             {currentProblemType.charAt(0).toUpperCase() +
               currentProblemType.slice(1)}
           </div>
         )}
         {topic && (
           <div>
             <strong>Topic:</strong> {topic}
           </div>
         )}
         <div>
           <strong>Difficulty:</strong>{" "}
           {currentProblemDifficulty
             ? currentProblemDifficulty.charAt(0).toUpperCase() +
               currentProblemDifficulty.slice(1)
             : "N/A"}
         </div>
       </div>
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl text-lg leading-relaxed mb-8 border-l-4 border-indigo-500 text-white">
        {problem.problem_text}
      </div>

      {/* Hint Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/70">Hint Credits: {hintCredits}</span>
          <button
            type="button"
            onClick={getHint}
            disabled={isLoadingHint || hintCredits <= 0}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-lg hover:from-purple-600 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoadingHint && <LoadingSpinner />}
            <SparklesIcon />
            <span>{isLoadingHint ? "Getting Hint..." : "Get Hint"}</span>
          </button>
        </div>
        {showHint && hint && (
          <div className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 p-4 rounded-lg border border-purple-500/30">
            <div className="flex items-center gap-2 mb-2">
              <SparklesIcon />
              <span className="font-semibold text-purple-300">Hint</span>
            </div>
            <p className="text-white/90">{hint}</p>
          </div>
        )}
      </div>

      <form onSubmit={submitAnswer}>
        <div className="mb-6">
          <label
            htmlFor="answer"
            className="block font-semibold text-lg mb-2 text-white"
          >
            Your Answer
          </label>
          <input
            type="number"
            id="answer"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            className="w-full p-4 text-lg border-2 border-gray-600 rounded-xl transition-all duration-300 bg-gray-800 text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Enter your answer"
            required
          />
        </div>

        <button
          type="submit"
          disabled={!userAnswer || isSubmitting}
          className="w-full font-semibold text-lg p-4 rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white"
        >
          {isSubmitting && <LoadingSpinner />}
          <SendIcon />
          <span>{isSubmitting ? "Submitting..." : "Submit Answer"}</span>
        </button>
      </form>
    </div>
  );
};
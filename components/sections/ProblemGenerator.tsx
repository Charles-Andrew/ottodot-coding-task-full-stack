import { SparklesIcon } from "@/components/icons";
import { LoadingSpinner } from "@/components/ui/loading";

type Difficulty = "easy" | "medium" | "hard";
type ProblemType = "random" | "addition" | "subtraction" | "multiplication" | "division";

interface ProblemGeneratorProps {
  selectedDifficulty: Difficulty;
  setSelectedDifficulty: (difficulty: Difficulty) => void;
  selectedProblemType: ProblemType;
  setSelectedProblemType: (type: ProblemType) => void;
  selectedTopic: string;
  setSelectedTopic: (topic: string) => void;
  topics: string[];
  generateProblem: () => void;
  isGenerating: boolean;
}

export const ProblemGenerator = ({
  selectedDifficulty,
  setSelectedDifficulty,
  selectedProblemType,
  setSelectedProblemType,
  selectedTopic,
  setSelectedTopic,
  topics,
  generateProblem,
  isGenerating,
}: ProblemGeneratorProps) => {
  return (
    <div className="bg-black/80 rounded-3xl p-6 md:p-8 mb-8 shadow-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-indigo-500/15 to-purple-600/15">
      <div className="mb-6">
        <label className="block font-semibold text-lg mb-3 text-white">
          Select Problem Type
        </label>
        <select
          value={selectedProblemType}
          onChange={(e) => setSelectedProblemType(e.target.value as ProblemType)}
          className="w-full p-3 rounded-xl bg-gray-800 text-white border border-gray-600 focus:border-indigo-500 focus:outline-none transition-colors"
        >
          <option value="random">Random</option>
          <option value="addition">Addition</option>
          <option value="subtraction">Subtraction</option>
          <option value="multiplication">Multiplication</option>
          <option value="division">Division</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block font-semibold text-lg mb-3 text-white">
          Select Difficulty Level
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          {(["easy", "medium", "hard"] as const).map((level) => (
            <button
              key={level}
              onClick={() => setSelectedDifficulty(level)}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                selectedDifficulty === level
                  ? level === "easy"
                    ? "bg-green-600 text-white shadow-lg"
                    : level === "medium"
                    ? "bg-yellow-600 text-white shadow-lg"
                    : "bg-red-600 text-white shadow-lg"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block font-semibold text-lg mb-3 text-white">
          Select Topic
        </label>
        <select
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="w-full p-3 rounded-xl bg-gray-800 text-white border border-gray-600 focus:border-indigo-500 focus:outline-none transition-colors"
        >
          <option value="random">Random</option>
          {topics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={generateProblem}
        disabled={isGenerating}
        className="w-full font-semibold text-lg p-4 rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
      >
        {isGenerating && <LoadingSpinner />}
        <SparklesIcon />
        <span>
          {isGenerating ? "Generating Problem..." : "Generate New Problem"}
        </span>
      </button>
    </div>
  );
};
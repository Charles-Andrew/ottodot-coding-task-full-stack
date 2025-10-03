import { MathIcon } from "@/components/icons";

export const Header = () => {
  return (
    <div className="flex flex-col items-center justify-center mb-12">
      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-2xl">
        <MathIcon />
      </div>
      <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-lg text-center">
        Math Problem Generator
      </h1>
      <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed text-center mb-6">
        Challenge yourself with AI-generated math problems designed for
        Primary 5 students
      </p>
    </div>
  );
};
export const LoadingSpinner = ({ className = "" }: { className?: string }) => (
  <div className={`inline-block w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin ${className}`} />
);

export const SkeletonLoader = ({ className }: { className: string }) => (
  <div className={`bg-gray-700/50 rounded animate-pulse ${className}`} />
);

export const HistoryItemSkeleton = () => (
  <div className="bg-black/50 rounded-xl p-4 border border-white/10">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <SkeletonLoader className="w-6 h-6 rounded-full" />
          <SkeletonLoader className="w-32 h-4" />
        </div>
        <div className="flex gap-2 mb-2">
          <SkeletonLoader className="w-16 h-5 rounded" />
          <SkeletonLoader className="w-14 h-5 rounded" />
        </div>
      </div>
    </div>
    <div className="mb-3 space-y-2">
      <SkeletonLoader className="w-full h-4" />
      <SkeletonLoader className="w-3/4 h-4" />
      <SkeletonLoader className="w-1/2 h-4" />
    </div>
    <div className="flex items-center gap-4">
      <SkeletonLoader className="w-20 h-4" />
      <SkeletonLoader className="w-8 h-4" />
      <SkeletonLoader className="w-16 h-4" />
      <SkeletonLoader className="w-8 h-4" />
    </div>
  </div>
);

export const SessionSkeleton = () => (
  <div className="bg-black/80 rounded-3xl p-6 md:p-8 mb-8 shadow-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-indigo-500/15 to-purple-600/15">
    <div className="mb-6">
      <SkeletonLoader className="w-32 h-6 mb-4" />
      <SkeletonLoader className="w-full h-4 mb-2" />
      <SkeletonLoader className="w-3/4 h-4" />
    </div>
    <div className="flex flex-col sm:flex-row gap-4">
      <SkeletonLoader className="w-full h-12 rounded-xl" />
      <SkeletonLoader className="w-full h-12 rounded-xl" />
    </div>
  </div>
);
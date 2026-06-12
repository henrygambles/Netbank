export function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
      <div className="h-7 bg-gray-200 dark:bg-white/10 rounded-lg w-48 mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-36 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="h-44 bg-gray-200 dark:bg-white/10 rounded-2xl" />
          <div className="h-20 bg-gray-200 dark:bg-white/10 rounded-2xl" />
          <div className="h-48 bg-gray-200 dark:bg-white/10 rounded-2xl" />
        </div>
        <div className="lg:col-span-1 h-96 bg-gray-200 dark:bg-white/10 rounded-2xl" />
      </div>
    </div>
  )
}

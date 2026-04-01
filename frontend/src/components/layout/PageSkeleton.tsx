export default function PageSkeleton() {
  return (
    <div className="max-w-4xl animate-pulse animate-fade-in">
      <div className="h-7 bg-surface-200 dark:bg-surface-800 rounded-lg w-48 mb-2" />
      <div className="h-4 bg-surface-200 dark:bg-surface-800 rounded w-32 mb-8" />
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-surface-200 dark:bg-surface-800 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-surface-200 dark:bg-surface-800 rounded-2xl mb-6" />
      <div className="h-48 bg-surface-200 dark:bg-surface-800 rounded-2xl" />
    </div>
  );
}

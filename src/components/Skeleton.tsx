export default function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-200 dark:bg-stone-700 rounded-xl ${className}`} />;
}

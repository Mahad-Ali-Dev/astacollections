export default function Loading() {
  return (
    <div className="container py-12">
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 shimmer rounded" />
        <div className="product-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-square shimmer rounded-xl" />
              <div className="h-4 shimmer rounded w-3/4" />
              <div className="h-4 shimmer rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

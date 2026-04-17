function Block({ className }: { className?: string }) {
  return <div className={`bg-gray-200 rounded-lg animate-pulse ${className ?? ""}`} />;
}

export function CustomerCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <Block className="h-4 w-36" />
          <Block className="h-3 w-24" />
        </div>
        <Block className="h-5 w-5 rounded-full" />
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <Block className="h-4 w-32" />
        <Block className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex items-center justify-between">
        <Block className="h-4 w-24" />
        <Block className="h-3 w-20" />
      </div>
    </div>
  );
}

export function DebtCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 space-y-1.5">
          <Block className="h-4 w-28" />
          <Block className="h-3 w-20" />
        </div>
        <Block className="h-5 w-14 rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="text-center space-y-1.5">
            <Block className="h-3 w-10 mx-auto" />
            <Block className="h-4 w-16 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <div className="flex gap-2 items-center">
            <Block className="h-4 w-32" />
            <Block className="h-5 w-12 rounded-full" />
          </div>
          <Block className="h-3 w-24" />
        </div>
        <div className="space-y-1.5">
          <Block className="h-5 w-8 ms-auto" />
          <Block className="h-3 w-10 ms-auto" />
        </div>
      </div>
    </div>
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-start gap-3">
        <Block className="w-5 h-5 rounded-full shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <Block className="h-4 w-48" />
          <Block className="h-3 w-28" />
        </div>
      </div>
    </div>
  );
}

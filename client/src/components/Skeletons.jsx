export function ProductSkeleton() {
  return (
    <div className="bg-white rounded-xl2 overflow-hidden shadow-saffron border border-saffron/5">
      <div className="skeleton w-full" style={{ aspectRatio: '4/3' }} />
      <div className="p-4 space-y-2.5">
        <div className="skeleton h-5 w-3/4 rounded" />
        <div className="skeleton h-3.5 w-1/2 rounded" />
        <div className="skeleton h-3.5 w-1/3 rounded" />
        <div className="flex justify-between mt-3">
          <div className="skeleton h-7 w-16 rounded" />
          <div className="skeleton h-8 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mt-8">
      <div className="skeleton rounded-xl2" style={{ aspectRatio: '3/4' }} />
      <div className="space-y-4 pt-4">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-9 w-3/4 rounded" />
        <div className="skeleton h-4 w-32 rounded" />
        <div className="skeleton h-10 w-28 rounded" />
        <div className="skeleton h-20 w-full rounded" />
        <div className="flex gap-3 mt-4">
          {[80, 64, 72].map((w) => <div key={w} className={`skeleton h-9 w-${w} rounded-full`} />)}
        </div>
        <div className="skeleton h-12 w-full rounded-full mt-4" />
      </div>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-32 w-full rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-80 w-full rounded-xl2" />
    </div>
  );
}

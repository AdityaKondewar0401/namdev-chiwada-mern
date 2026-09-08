export function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-saffron border border-saffron/5 flex flex-col sm:flex-row">
      <div className="skeleton w-full sm:w-[42%] sm:flex-shrink-0" style={{ aspectRatio: '1/1' }} />
      <div className="p-4 sm:p-8 flex-1 space-y-2.5 sm:space-y-3.5 sm:flex sm:flex-col sm:justify-center">
        <div className="skeleton h-5 sm:h-6 w-3/4 rounded" />
        <div className="skeleton h-3.5 w-1/2 rounded" />
        <div className="skeleton h-3.5 w-2/3 rounded" />
        <div className="flex justify-between mt-2 sm:mt-3">
          <div className="skeleton h-7 sm:h-8 w-16 sm:w-20 rounded" />
          <div className="skeleton h-9 sm:h-11 w-24 sm:w-28 rounded-full" />
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
          {[80, 64, 72].map((w) => (
            <div key={w} className="skeleton h-9 rounded-full" style={{ width: w }} />
          ))}
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

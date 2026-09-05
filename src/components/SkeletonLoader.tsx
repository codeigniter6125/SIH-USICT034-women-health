export function SkeletonLine({ w = "100%", h = 14, className = "" }: { w?: string | number; h?: number; className?: string }) {
  return (
    <div className={`skeleton ${className}`} style={{ width: w, height: h }} />
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white border border-[#E8E3DB] rounded-2xl p-4 space-y-3 ${className}`}>
      <SkeletonLine w="60%" h={14} />
      <SkeletonLine w="90%" h={10} />
      <SkeletonLine w="75%" h={10} />
    </div>
  );
}

export function SkeletonReport() {
  return (
    <div className="space-y-3">
      <div className="bg-white border border-[#E8E3DB] rounded-2xl p-4 space-y-3">
        <div className="flex justify-between">
          <SkeletonLine w="45%" h={16} />
          <SkeletonLine w="20%" h={20} />
        </div>
        <SkeletonLine w="100%" h={10} />
        <SkeletonLine w="80%" h={10} />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white border border-[#E8E3DB] rounded-2xl p-4 space-y-2">
          <div className="flex justify-between items-center">
            <SkeletonLine w="40%" h={13} />
            <SkeletonLine w="18%" h={22} />
          </div>
          <SkeletonLine w="30%" h={28} />
          <SkeletonLine w="55%" h={9} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChat() {
  return (
    <div className="space-y-4 px-4 py-4">
      {/* Maya message */}
      <div className="flex gap-2.5">
        <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
        <div className="space-y-1.5 max-w-[70%]">
          <SkeletonLine w={220} h={12} />
          <SkeletonLine w={180} h={12} />
          <SkeletonLine w={140} h={12} />
        </div>
      </div>
      {/* User message */}
      <div className="flex justify-end">
        <SkeletonLine w={160} h={36} className="rounded-2xl" />
      </div>
      {/* Maya */}
      <div className="flex gap-2.5">
        <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
        <div className="space-y-1.5 max-w-[75%]">
          <SkeletonLine w={200} h={12} />
          <SkeletonLine w={160} h={12} />
        </div>
      </div>
    </div>
  );
}

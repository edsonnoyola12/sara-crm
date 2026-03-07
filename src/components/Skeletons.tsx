const SkeletonBlock = ({ h = '1rem', w = '100%' }: { h?: string; w?: string }) => (
  <div className="skeleton" style={{ height: h, width: w }} />
)

export function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <SkeletonBlock h="2rem" w="40%" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-slate-800/50 rounded-xl p-4 space-y-3 border border-slate-700/50">
            <SkeletonBlock h="0.75rem" w="60%" />
            <SkeletonBlock h="2rem" w="40%" />
            <SkeletonBlock h="0.5rem" w="80%" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 rounded-xl p-4 space-y-3 border border-slate-700/50">
          <SkeletonBlock h="1rem" w="30%" />
          <SkeletonBlock h="12rem" w="100%" />
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 space-y-3 border border-slate-700/50">
          <SkeletonBlock h="1rem" w="30%" />
          {[1,2,3,4].map(i => <SkeletonBlock key={i} h="2rem" w="100%" />)}
        </div>
      </div>
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex justify-between">
        <SkeletonBlock h="2rem" w="30%" />
        <SkeletonBlock h="2rem" w="15%" />
      </div>
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="p-3 border-b border-slate-700/50 flex gap-4">
          {[1,2,3,4,5].map(i => <SkeletonBlock key={i} h="0.75rem" w="15%" />)}
        </div>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="p-3 border-b border-slate-700/30 flex gap-4">
            <SkeletonBlock h="0.75rem" w="20%" />
            <SkeletonBlock h="0.75rem" w="15%" />
            <SkeletonBlock h="0.75rem" w="10%" />
            <SkeletonBlock h="0.75rem" w="12%" />
            <SkeletonBlock h="0.75rem" w="18%" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonCards() {
  return (
    <div className="space-y-4 animate-fade-in-up">
      <SkeletonBlock h="2rem" w="30%" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            <SkeletonBlock h="8rem" w="100%" />
            <div className="p-4 space-y-2">
              <SkeletonBlock h="1rem" w="70%" />
              <SkeletonBlock h="0.75rem" w="50%" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonCalendar() {
  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex justify-between">
        <SkeletonBlock h="2rem" w="30%" />
        <SkeletonBlock h="2rem" w="20%" />
      </div>
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-2">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {[1,2,3,4,5,6,7].map(i => <SkeletonBlock key={i} h="0.75rem" />)}
        </div>
        {[1,2,3,4,5].map(row => (
          <div key={row} className="grid grid-cols-7 gap-2">
            {[1,2,3,4,5,6,7].map(col => <SkeletonBlock key={col} h="4rem" />)}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonGeneric() {
  return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
    </div>
  )
}

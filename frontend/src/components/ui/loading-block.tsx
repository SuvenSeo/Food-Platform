import { LoaderCircle } from 'lucide-react'

export function LoadingBlock({ message = 'Loading dashboard data...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center rounded-[2rem] border border-dashed border-slate-300 bg-white/80 p-10 text-slate-500 shadow-sm">
      <LoaderCircle className="mr-3 h-5 w-5 animate-spin" />
      {message}
    </div>
  )
}

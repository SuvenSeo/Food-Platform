import { motion } from 'framer-motion'
import { Soup } from 'lucide-react'

export function LoadingBlock({ message = 'Loading data...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-panel border py-16 text-center"
      style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: '#0a0a0a' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-transparent"
        style={{ borderTopColor: '#f97316', borderRightColor: 'rgba(249,115,22,0.2)' }}
      >
        <Soup className="h-4 w-4 text-orange-400/50" />
      </motion.div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

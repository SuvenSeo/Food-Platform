import { useMemo, useState } from 'react'

import { cn } from '../../lib/utils'

type FoodItemImageProps = {
  src?: string | null
  name: string
  category?: string | null
  source?: string | null
  showSourceBadge?: boolean
  className?: string
  imgClassName?: string
  priority?: boolean
}

const categoryTone: Record<string, string> = {
  bakery: 'from-[#f3d59a] via-[#f8ecce] to-[#f7f1e3]',
  beverage: 'from-[#bdd3c7] via-[#e4efe7] to-[#f7f1e3]',
  dairy: 'from-[#d7e4f2] via-[#edf4f9] to-[#f7f1e3]',
  fruit: 'from-[#dfb671] via-[#f4e0ba] to-[#f7f1e3]',
  fruits: 'from-[#dfb671] via-[#f4e0ba] to-[#f7f1e3]',
  meat: 'from-[#d79a91] via-[#f0cec8] to-[#f7f1e3]',
  seafood: 'from-[#a9c8d6] via-[#dcebf0] to-[#f7f1e3]',
  spice: 'from-[#df8f53] via-[#f3c391] to-[#f7f1e3]',
  spices: 'from-[#df8f53] via-[#f3c391] to-[#f7f1e3]',
  vegetable: 'from-[#b9c790] via-[#e1e6c7] to-[#f7f1e3]',
  vegetables: 'from-[#b9c790] via-[#e1e6c7] to-[#f7f1e3]',
}

function initialsFor(name: string) {
  const parts = name
    .replace(/[()]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  return (parts[0]?.[0] ?? 'F') + (parts[1]?.[0] ?? '')
}

function toneFor(category?: string | null) {
  const normalized = String(category ?? '').toLowerCase()
  const key = Object.keys(categoryTone).find((candidate) => normalized.includes(candidate))
  return key ? categoryTone[key] : 'from-[#d7c99d] via-[#efe4c6] to-[#f7f1e3]'
}

export function FoodItemImage({
  src,
  name,
  category,
  source,
  showSourceBadge = false,
  className,
  imgClassName,
  priority = false,
}: FoodItemImageProps) {
  const [failed, setFailed] = useState(false)
  const initials = useMemo(() => initialsFor(name), [name])
  const showImage = Boolean(src && !failed)

  return (
    <div
      data-food-item-image="true"
      className={cn(
        'group relative isolate flex shrink-0 items-center justify-center overflow-hidden border border-[color:var(--color-border)] bg-[color:var(--paper-100)]',
        className,
      )}
      aria-label={name}
    >
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-95', toneFor(category))} aria-hidden="true" />
      {showImage && (
        <>
          <img
            src={src ?? undefined}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-[0.18] blur-md saturate-[0.9]"
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onError={() => setFailed(true)}
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.70),rgba(255,255,255,0.18)_46%,rgba(14,14,12,0.12)_100%)]"
            aria-hidden="true"
          />
        </>
      )}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(180deg,transparent,rgba(14,14,12,0.10))]"
        aria-hidden="true"
      />
      {showImage ? (
        <img
          src={src ?? undefined}
          alt={name}
          className={cn(
            'relative z-10 h-full w-full scale-[1.18] object-contain p-1.5 drop-shadow-[0_8px_18px_rgba(14,14,12,0.20)] transition-transform duration-300 group-hover:scale-[1.26]',
            imgClassName,
          )}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="relative z-10 flex h-full w-full items-center justify-center">
          <div className="absolute inset-0 bg-halftone bg-halftone-md opacity-[0.10]" aria-hidden="true" />
          <div
            className="absolute inset-[18%] border border-[color:var(--color-border)] bg-[color:var(--paper-50)]/35 shadow-[0_10px_24px_rgba(14,14,12,0.10)]"
            aria-hidden="true"
          />
          <span className="sr-only">{initials || name}</span>
        </div>
      )}
      {source && showSourceBadge && (
        <span
          className="absolute bottom-1 left-1 z-20 max-w-[calc(100%-0.5rem)] truncate border border-black/10 bg-[color:var(--paper-50)] px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-[color:var(--ink-500)]"
          title={source}
        >
          {source.slice(0, 2)}
        </span>
      )}
    </div>
  )
}

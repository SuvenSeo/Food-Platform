import { Link } from 'react-router-dom'

import { footerSections } from '../../config/navigation'

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative mt-24 border-t-2 border-[color:var(--color-text-primary)] bg-[color:var(--paper-100)]">
      <div className="mx-auto max-w-[1320px] px-4 pt-10 sm:px-6">
        <section className="footer-cta" aria-label="Mandiya data tools">
          <div>
            <span className="text-kicker">§ Put the desk to work</span>
            <h2
              className="mt-3 max-w-[12ch] font-display text-[clamp(2rem,5vw,4.5rem)] font-semibold leading-[0.94] text-[color:var(--paper-50)]"
              style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30, 'wght' 660" }}
            >
              Alerts, exports, and one clean API.
            </h2>
          </div>
          <div className="footer-cta-copy">
            <p>
              Save baskets, track price drops, compare districts, or pull normalized food-price data
              into your own research stack.
            </p>
            <div className="footer-cta-actions">
              <Link to="/watchlists">Set alerts</Link>
              <Link to="/developers">Use API</Link>
              <Link to="/basket">Cost a basket</Link>
            </div>
          </div>
        </section>
      </div>

      {/* Halftone wordmark band */}
      <div className="relative overflow-hidden border-b border-[color:var(--color-border-hover)]">
        <div
          aria-hidden="true"
          className="select-none whitespace-nowrap text-center font-display font-bold leading-[0.85] text-[color:var(--color-text-primary)]"
          style={{
            fontSize: 'clamp(5.5rem, 18vw, 16rem)',
            letterSpacing: 0,
            fontVariationSettings: "'opsz' 144, 'SOFT' 30, 'wght' 700",
            backgroundImage:
              'radial-gradient(circle, rgba(14,14,12,0.95) 1px, transparent 1.3px)',
            backgroundSize: '4px 4px',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            padding: '0.4em 0.2em 0.15em',
          }}
        >
          MANDIYA.
        </div>
      </div>

      <div className="mx-auto max-w-[1320px] px-4 py-14 sm:px-6">
        {/* Top — sections + masthead */}
        <div className="grid gap-12 lg:grid-cols-[1.1fr_2fr]">
          {/* Masthead block */}
          <div>
            <span className="text-kicker">§ Masthead</span>
            <h3
              className="mt-3 font-display text-[40px] leading-[0.95] tracking-normal text-[color:var(--color-text-primary)]"
              style={{ fontVariationSettings: "'opsz' 96, 'wght' 700" }}
            >
              Mandiya<span className="text-[color:var(--chili-500)]">.</span>
            </h3>
            <p className="mt-4 max-w-[36ch] font-display text-[15px] italic leading-[1.55] text-[color:var(--color-text-secondary)]">
              Sri Lanka’s daily price desk. We walk shelves and stalls so you can read one number per
              item, one trend per week.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="stamp">Issue 01 · Vol. 01</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
                රු · LKR · Colombo
              </span>
            </div>
          </div>

          {/* Section index — 4 columns */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4">
            {Object.entries(footerSections).map(([title, links]) => (
              <div key={title}>
                <p className="text-kicker mb-3">§ {title}</p>
                <ul className="index-nav text-[15px]">
                  {links.map((l, index) => (
                    <li key={l.to}>
                      <Link to={l.to}>
                        <span>{l.label}</span>
                        <span className="num-tag">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Double rule */}
        <div className="rule-double mt-14 h-1.5 w-full" aria-hidden="true" />

        {/* Bottom — colophon */}
        <div className="mt-6 flex flex-col items-start justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)] sm:flex-row sm:items-baseline">
          <p>
            © {year} Mandiya · Set in <span className="text-[color:var(--color-text-primary)]">Fraunces</span> &amp;{' '}
            <span className="text-[color:var(--color-text-primary)]">JetBrains Mono</span> · Published from Colombo
          </p>
          <p>An Ardeno Studio thing · v1.0 · <span className="text-[color:var(--chili-500)]">— 30 —</span></p>
        </div>
      </div>
    </footer>
  )
}

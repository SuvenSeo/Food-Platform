import { Link } from 'react-router-dom'

const footerLinks = [
  { to: '/methods', label: 'Methods' },
  { to: '/developers', label: 'Developers' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
]

export function SiteFooter() {
  return (
    <footer className="rounded-[2rem] border border-white/60 bg-white/85 px-6 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Public product surfaces</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Food intelligence should explain itself as clearly as it ranks prices.
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Explore methodology, public data surfaces, and the trust layers that make this platform useful to everyday households and future life-platform integrations.
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            {footerLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-full bg-slate-100 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-200"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <a
            href="https://github.com/SuvenSeo/Food-Platform"
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-sm font-semibold text-orange-700 hover:text-orange-800"
          >
            View the public repository
          </a>
        </div>
      </div>
    </footer>
  )
}

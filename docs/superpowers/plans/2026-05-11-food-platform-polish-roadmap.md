# Food Platform Polish Roadmap

**Purpose:** Turn the food platform from a strong premium foundation into a launch-ready public intelligence product by borrowing the highest-leverage traits from the property, vehicle, and octane platforms.

## Audit conclusions

- The food platform now has healthy route coverage and real backend summary surfaces, but several pages still read like thin v1 slices rather than deeply productized workflows.
- The biggest gaps versus the other platforms are:
  - thinner trust/transparency surfaces
  - weaker public-product framing and footer/legal/developer layers
  - shallower compare/basket/detail workflows
  - less visible retention loops
  - lighter deployment/productization cues

## Priority tracks

### Track 1: Deployment reliability

- Keep Vercel connected directly to `SuvenSeo/Food-Platform`.
- Treat `main` as the production deployment branch.
- Keep frontend verification green on every push.
- Use direct production deploys only as fallback, not as the default path.

### Track 2: Trust and public-product surfaces

- Expand `Methods` into a proper trust hub with methodology, source freshness, coverage, citation guidance, and limitations.
- Add public `Developers`, `Privacy`, and `Terms` pages.
- Add a real site footer that makes these surfaces discoverable from every route.

### Track 3: Workflow depth

- Make district compare configurable rather than fixed to one comparison.
- Expand baskets from one preset into a small preset family.
- Make offer detail pages actionable with related offers, richer metadata, and save/source actions.

### Track 4: Product density

- Densify the homepage with tighter trust and utility integration.
- Continue replacing “future” or “phase” copy with user-facing product language.
- Keep every route connected to at least one adjacent workflow so pages do not dead-end.

### Track 5: Next expansions after this slice

- Add alert-style retention loops for baskets, categories, or districts.
- Promote markets from seeded support data into a more mature live-ingestion path.
- Build a deeper developers/data surface with downloadable datasets and embed-ready summaries.
- Strengthen the life-platform federation surface once these public pages stabilize.

## Execution order

1. Lock in deploy reliability and Vercel/Git linkage.
2. Ship trust/public-product surfaces.
3. Deepen compare, basket, and offer detail workflows.
4. Re-verify, deploy, and observe.
5. Start the retention and data-distribution wave next.

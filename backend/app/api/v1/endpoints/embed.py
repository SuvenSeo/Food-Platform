"""Embeddable HTML badge — category floor price or basket total."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.embed_summary import resolve_embed_summary

router = APIRouter(prefix="/embed", tags=["embed"])

_TEMPLATE = """<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>FoodLK — {label}</title>
<style>
  :root {{
    --bg: {bg};
    --fg: {fg};
    --muted: {muted};
    --accent: {accent};
    --border: {border};
  }}
  * {{ box-sizing: border-box; }}
  html, body {{ margin: 0; padding: 0; height: 100%; }}
  body {{
    background: var(--bg); color: var(--fg);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    padding: 16px; line-height: 1.4;
  }}
  .wrap {{ display: flex; flex-direction: column; gap: 8px; height: 100%; }}
  .head {{ display: flex; justify-content: space-between; align-items: baseline; }}
  .label {{ font-size: 12px; letter-spacing: .08em; color: var(--muted); text-transform: uppercase; }}
  .price {{ font-size: 36px; font-weight: 700; color: var(--accent); letter-spacing: -0.02em; }}
  .meta {{ font-size: 12px; color: var(--muted); }}
  .row {{ display: flex; justify-content: space-between; gap: 8px; padding-top: 8px; border-top: 1px solid var(--border); margin-top: auto; }}
  a {{ color: var(--accent); text-decoration: none; font-weight: 600; }}
</style>
</head><body>
<div class="wrap">
  <div class="head">
    <div class="label">{label}</div>
    <div class="meta">{kind_label}</div>
  </div>
  <div class="price">LKR {price}</div>
  <div class="meta">{meta}</div>
  <div class="row">
    <span class="meta">Sri Lanka food prices</span>
    <a href="https://food-platform-one.vercel.app" target="_blank" rel="noopener">foodlk →</a>
  </div>
</div>
</body></html>"""


def _theme(name: str) -> dict[str, str]:
    if name == "dark":
        return {
            "bg": "#0a0a0a",
            "fg": "#f4f4f5",
            "muted": "#9ca3af",
            "accent": "#f97316",
            "border": "#27272a",
        }
    return {
        "bg": "#ffffff",
        "fg": "#0a0a0a",
        "muted": "#6b7280",
        "accent": "#ea580c",
        "border": "#e5e7eb",
    }


@router.get("/summary", response_class=HTMLResponse)
def embed_summary(
    kind: str = Query("basket", pattern="^(basket|category)$"),
    category: str | None = Query(None),
    preset: str | None = Query(None),
    theme: str = Query("dark", pattern="^(light|dark)$"),
    db: Session = Depends(get_db),
):
    try:
        summary = resolve_embed_summary(db, kind=kind, category=category, preset=preset)
    except KeyError:
        raise HTTPException(status_code=404, detail="No data for embed parameters")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    kind_label = "Basket total" if summary["kind"] == "basket" else "Category from"
    html = _TEMPLATE.format(
        label=summary["label"],
        kind_label=kind_label,
        price=f"{float(summary['value']):,.0f}",
        meta=summary["meta"],
        **_theme(theme),
    )
    return HTMLResponse(html, headers={"Content-Security-Policy": "frame-ancestors *"})

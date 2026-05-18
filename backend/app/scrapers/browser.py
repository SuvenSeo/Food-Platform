"""Shared Playwright helpers for JS-rendered retail storefronts."""

from __future__ import annotations

import logging
import os
from contextlib import contextmanager
from typing import Iterator

from playwright.sync_api import Browser, Page, sync_playwright

logger = logging.getLogger(__name__)


@contextmanager
def chromium_browser(*, headless: bool = True) -> Iterator[Browser]:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=headless)
        try:
            yield browser
        finally:
            browser.close()


@contextmanager
def chromium_page(
    *,
    user_agent: str,
    timeout_ms: int = 30_000,
    headless: bool = True,
) -> Iterator[Page]:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=headless)
        try:
            context = browser.new_context(user_agent=user_agent)
            page = context.new_page()
            page.set_default_timeout(timeout_ms)
            yield page
        finally:
            browser.close()


def fetch_rendered_html(
    url: str,
    *,
    user_agent: str,
    wait_selector: str | None = None,
    timeout_ms: int = 30_000,
) -> str:
    """Navigate with headless Chromium and return fully rendered HTML."""
    try:
        with chromium_page(user_agent=user_agent, timeout_ms=timeout_ms) as page:
            page.goto(url, wait_until="domcontentloaded")
            if wait_selector:
                page.wait_for_selector(wait_selector, timeout=timeout_ms)
            else:
                page.wait_for_load_state("networkidle", timeout=timeout_ms)
            return page.content()
    except Exception:
        if os.environ.get("CI") == "true":
            _capture_failure_screenshot(url)
        raise


def _capture_failure_screenshot(url: str) -> None:
    """Best-effort debug artifact when scrapers fail in CI."""
    try:
        with chromium_page(user_agent="FoodPlatformBot/CI", timeout_ms=15_000) as page:
            page.goto(url, wait_until="domcontentloaded")
            path = os.environ.get("SCRAPER_FAILURE_SCREENSHOT", "scraper-failure.png")
            page.screenshot(path=path, full_page=True)
            logger.warning("Saved scraper failure screenshot to %s", path)
    except Exception:
        logger.debug("Unable to capture scraper failure screenshot", exc_info=True)

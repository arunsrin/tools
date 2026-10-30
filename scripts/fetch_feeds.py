#!/usr/bin/env python3
"""
Feed scraper for News River (Tools Hub).
Fetches headlines from Hacker News, Reddit, Lobste.rs, and curated feeds
from the author's subscriptions (Quanta Magazine, Latent Space, Ahead of AI,
Arts & Letters Daily, Colossal, SMBC, Eurogamer, Chess.com, Ars Technica),
normalizes them into FeedItem format, and writes to public/data/feeds.json.
Uses exclusively Python standard library (urllib, json, xml.etree.ElementTree, hashlib).
"""
import datetime
import hashlib
import json
import os
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from typing import Any, Dict, List, Optional

# UTF-8 stdout/stderr normalization for Windows and Linux
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

USER_AGENT = "ToolsHub-NewsRiver/1.0 (https://github.com/arunsrin/tools)"


def fetch_url(url: str, timeout: int = 10) -> Optional[bytes]:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Accept": "application/json, application/xml, text/xml, */*"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.read()
    except Exception as e:
        print(f"Warning: Failed to fetch {url}: {e}", file=sys.stderr)
        return None


def extract_domain(url: str, fallback: str = "") -> str:
    try:
        netloc = urllib.parse.urlparse(url).netloc
        return netloc.replace("www.", "") or fallback
    except Exception:
        return fallback


def fetch_hacker_news() -> List[Dict[str, Any]]:
    print("Fetching Hacker News...")
    items = []
    data_bytes = fetch_url("https://hn.algolia.com/api/v1/search?tags=front_page")
    if not data_bytes:
        return items
    try:
        data = json.loads(data_bytes.decode("utf-8"))
        for hit in data.get("hits", [])[:10]:
            oid = hit.get("objectID")
            url = hit.get("url") or f"https://news.ycombinator.com/item?id={oid}"
            items.append({
                "id": f"hn-{oid}",
                "title": hit.get("title", ""),
                "url": url,
                "source": "Hacker News",
                "sourceId": "hacker-news",
                "category": "tech",
                "publishedAt": hit.get("created_at", datetime.datetime.now(datetime.timezone.utc).isoformat()),
                "points": hit.get("points") or 0,
                "comments": hit.get("num_comments") or 0,
                "domain": extract_domain(url, "ycombinator.com"),
            })
    except Exception as e:
        print(f"Error parsing Hacker News: {e}", file=sys.stderr)
    return items


def fetch_reddit(subreddit: str, source_id: str, source_name: str, category: str) -> List[Dict[str, Any]]:
    print(f"Fetching Reddit /r/{subreddit}...")
    items = []
    url = f"https://www.reddit.com/r/{subreddit}/top.json?limit=10&t=day"
    data_bytes = fetch_url(url)
    if not data_bytes:
        return items
    try:
        data = json.loads(data_bytes.decode("utf-8"))
        children = data.get("data", {}).get("children", [])
        for post in children[:8]:
            d = post.get("data", {})
            post_id = d.get("id")
            title = d.get("title", "")
            post_url = d.get("url", f"https://reddit.com{d.get('permalink')}")
            created_utc = d.get("created_utc", datetime.datetime.now(datetime.timezone.utc).timestamp())
            iso_time = datetime.datetime.fromtimestamp(created_utc, tz=datetime.timezone.utc).isoformat()
            items.append({
                "id": f"reddit-{post_id}",
                "title": title,
                "url": post_url,
                "source": source_name,
                "sourceId": source_id,
                "category": category,
                "publishedAt": iso_time,
                "points": d.get("score", 0),
                "comments": d.get("num_comments", 0),
                "domain": extract_domain(post_url, "reddit.com"),
            })
    except Exception as e:
        print(f"Error parsing Reddit /r/{subreddit}: {e}", file=sys.stderr)
    return items


def fetch_lobsters() -> List[Dict[str, Any]]:
    print("Fetching Lobste.rs...")
    items = []
    data_bytes = fetch_url("https://lobste.rs/hottest.json")
    if not data_bytes:
        return items
    try:
        posts = json.loads(data_bytes.decode("utf-8"))
        for p in posts[:8]:
            short_id = p.get("short_id")
            url = p.get("url") or p.get("comments_url")
            items.append({
                "id": f"lob-{short_id}",
                "title": p.get("title", ""),
                "url": url,
                "source": "Lobste.rs",
                "sourceId": "lobsters",
                "category": "dev",
                "publishedAt": p.get("created_at", datetime.datetime.now(datetime.timezone.utc).isoformat()),
                "points": p.get("score", 0),
                "comments": p.get("comment_count", 0),
                "domain": extract_domain(url, "lobste.rs"),
            })
    except Exception as e:
        print(f"Error parsing Lobste.rs: {e}", file=sys.stderr)
    return items


def fetch_rss_feed(feed_url: str, source_id: str, source_name: str, category: str, domain_fallback: str) -> List[Dict[str, Any]]:
    print(f"Fetching RSS feed for {source_name}...")
    items = []
    data_bytes = fetch_url(feed_url)
    if not data_bytes:
        return items
    try:
        root = ET.fromstring(data_bytes)
        channel = root.find("channel")
        if channel is None:
            # Handle Atom feeds
            channel = root
        
        # Look for both RSS <item> and Atom <entry>
        elements = channel.findall("item") or channel.findall("{http://www.w3.org/2005/Atom}entry") or []
        for item in elements[:8]:
            title_elem = item.find("title") or item.find("{http://www.w3.org/2005/Atom}title")
            title = title_elem.text.strip() if title_elem is not None and title_elem.text else ""

            link_elem = item.find("link") or item.find("{http://www.w3.org/2005/Atom}link")
            link = ""
            if link_elem is not None:
                link = link_elem.get("href") or link_elem.text or ""
                link = link.strip()

            # Hash-based stable item ID (avoiding index collisions)
            item_hash = hashlib.md5((link or title).encode("utf-8")).hexdigest()[:8]

            items.append({
                "id": f"{source_id}-{item_hash}",
                "title": title,
                "url": link,
                "source": source_name,
                "sourceId": source_id,
                "category": category,
                "publishedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "domain": extract_domain(link, domain_fallback),
            })
    except Exception as e:
        print(f"Error parsing RSS {feed_url}: {e}", file=sys.stderr)
    return items


def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_path = os.path.join(root_dir, "public", "data", "feeds.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    all_items: List[Dict[str, Any]] = []

    # Curated feeds from user's subscriptions and popular channels
    all_items.extend(fetch_hacker_news())
    all_items.extend(fetch_reddit("technology", "reddit-tech", "Reddit /r/technology", "tech"))
    all_items.extend(fetch_reddit("programming", "reddit-prog", "Reddit /r/programming", "dev"))
    all_items.extend(fetch_lobsters())
    all_items.extend(fetch_rss_feed("https://feeds.arstechnica.com/arstechnica/index", "ars-technica", "Ars Technica", "tech", "arstechnica.com"))
    all_items.extend(fetch_rss_feed("https://www.quantamagazine.org/feed/", "quanta", "Quanta Magazine", "news", "quantamagazine.org"))
    all_items.extend(fetch_rss_feed("https://feeds.bbci.co.uk/news/world/rss.xml", "bbc-news", "BBC News", "news", "bbc.com"))
    all_items.extend(fetch_rss_feed("https://feeds.feedburner.com/colossal", "colossal", "Colossal", "design", "thisiscolossal.com"))

    # Preserve any existing items from feeds.json if a source failed
    if os.path.exists(output_path):
        try:
            with open(output_path, "r", encoding="utf-8") as f:
                existing_data = json.load(f)
                existing_items = existing_data.get("items", [])
                fetched_sources = set(i["sourceId"] for i in all_items)
                for ei in existing_items:
                    if ei.get("sourceId") not in fetched_sources:
                        all_items.append(ei)
        except Exception as e:
            print(f"Warning: Could not read existing feeds: {e}", file=sys.stderr)

    output_data = {
        "lastUpdated": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "sources": [
            {
                "id": "hacker-news",
                "name": "Hacker News",
                "category": "tech",
                "icon": "🟧",
                "description": "Tech, startups, and hacking discussions",
                "color": "#ff6600",
                "enabled": True,
            },
            {
                "id": "reddit-tech",
                "name": "Reddit /r/technology",
                "category": "tech",
                "icon": "🤖",
                "description": "Major technology developments and industry news",
                "color": "#ff4500",
                "enabled": True,
            },
            {
                "id": "reddit-prog",
                "name": "Reddit /r/programming",
                "category": "dev",
                "icon": "💻",
                "description": "Computer programming discussions and articles",
                "color": "#0079d3",
                "enabled": True,
            },
            {
                "id": "lobsters",
                "name": "Lobste.rs",
                "category": "dev",
                "icon": "🦞",
                "description": "Computing-focused community news and discussions",
                "color": "#8b1e0f",
                "enabled": True,
            },
            {
                "id": "ars-technica",
                "name": "Ars Technica",
                "category": "tech",
                "icon": "⚡",
                "description": "Deep dives into technology, policy, and science",
                "color": "#ff4e00",
                "enabled": True,
            },
            {
                "id": "quanta",
                "name": "Quanta Magazine",
                "category": "news",
                "icon": "🔬",
                "description": "Illuminating mathematics, physics, and computer science",
                "color": "#0099cc",
                "enabled": True,
            },
            {
                "id": "bbc-news",
                "name": "BBC News",
                "category": "news",
                "icon": "🌍",
                "description": "Global breaking news and international affairs",
                "color": "#bb1919",
                "enabled": True,
            },
            {
                "id": "colossal",
                "name": "Colossal",
                "category": "design",
                "icon": "🎨",
                "description": "Visual culture, art, design, craft, and photography",
                "color": "#e056fd",
                "enabled": True,
            },
            {
                "id": "github-trending",
                "name": "GitHub Trending",
                "category": "dev",
                "icon": "🐙",
                "description": "Top trending open source projects and repositories",
                "color": "#6e40c9",
                "enabled": True,
            },
            {
                "id": "product-hunt",
                "name": "Product Hunt",
                "category": "design",
                "icon": "🚀",
                "description": "The best new products, tools, and startups every day",
                "color": "#da552f",
                "enabled": True,
            },
        ],
        "items": all_items,
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"✓ Successfully wrote {len(all_items)} headlines across feeds to {output_path}")


if __name__ == "__main__":
    main()

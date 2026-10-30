#!/usr/bin/env python3
"""
Feed scraper for News River (Tools Hub).
Fetches real, live headlines across Hacker News, Lobste.rs (with comment thread links),
and the author's exact 28 subscriptions organized into Tech, Ideas & Science, Gaming, Chess, and Comics.
Uses exclusively Python standard library (urllib, json, xml.etree.ElementTree, hashlib, csv).
"""
import csv
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

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

FEED_METADATA: Dict[str, Dict[str, str]] = {
    # Tech & Software
    "https://www.arunsr.in/posts/index.xml": {"id": "arunsr-in", "name": "arunsrin's notes", "category": "tech", "icon": "📝", "color": "#10b981", "desc": "Notes and writings on software and systems"},
    "https://arstechnica.com/feed/?t=3774eb8d1c221c36c2589aae18e132d0": {"id": "ars-technica", "name": "Ars Technica", "category": "tech", "icon": "⚡", "color": "#ff4e00", "desc": "News, reviews, and in-depth tech analysis"},
    "https://techcrunch.com/feed/": {"id": "techcrunch", "name": "TechCrunch", "category": "tech", "icon": "🚀", "color": "#029e74", "desc": "Startup and technology news"},
    "https://www.wheresyoured.at/rss/": {"id": "wheres-your-ed-at", "name": "Where's Your Ed At", "category": "tech", "icon": "🎙️", "color": "#ec4899", "desc": "Essays and commentary by Ed Zitron"},
    "https://realpython.com/atom.xml": {"id": "real-python", "name": "Real Python", "category": "tech", "icon": "🐍", "color": "#306998", "desc": "Python tutorials and community articles"},
    "https://rss.acm.org/technews/TechNews.xml": {"id": "acm-technews", "name": "ACM TechNews", "category": "tech", "icon": "📰", "color": "#0284c7", "desc": "Timely computer science and computing developments"},
    "https://queue.acm.org/rss/feeds/queuecontent.xml": {"id": "acm-queue", "name": "ACM Queue", "category": "tech", "icon": "💻", "color": "#0369a1", "desc": "Software engineering research and practice"},
    "https://cacm.acm.org/issue/latest/feed/": {"id": "cacm", "name": "CACM", "category": "tech", "icon": "🔬", "color": "#075985", "desc": "Communications of the ACM"},
    "https://sreweekly.com/feed/": {"id": "sre-weekly", "name": "SRE WEEKLY", "category": "tech", "icon": "🛠️", "color": "#6366f1", "desc": "Scalability, availability, and incident response"},
    "https://feeds.feedburner.com/oreilly/radar/atom": {"id": "oreilly-radar", "name": "Radar (O'Reilly)", "category": "tech", "icon": "📡", "color": "#dc2626", "desc": "Need-to-know tech and business trends"},
    "https://tildes.net/topics.atom": {"id": "tildes", "name": "Tildes", "category": "tech", "icon": "💬", "color": "#8b5cf6", "desc": "Community conversations and link shares"},

    # Ideas & Science
    "https://www.aldaily.com/feed/": {"id": "aldaily", "name": "Arts & Letters Daily", "category": "ideas", "icon": "📚", "color": "#d97706", "desc": "Philosophy, literature, criticism, and debate"},
    "https://3quarksdaily.com/feed": {"id": "3quarksdaily", "name": "3 Quarks Daily", "category": "ideas", "icon": "⚛️", "color": "#84cc16", "desc": "Science, arts, philosophy, and politics"},
    "https://www.quantamagazine.org/feed/": {"id": "quanta", "name": "Quanta Magazine", "category": "ideas", "icon": "🌌", "color": "#0099cc", "desc": "Illuminating mathematics, physics, and computer science"},
    "https://psyche.co/feed.rss": {"id": "psyche", "name": "Psyche", "category": "ideas", "icon": "🧠", "color": "#a855f7", "desc": "Psychology, philosophy, and mental health"},
    "https://jasonpargin.substack.com/feed": {"id": "jason-pargin", "name": "Jason Pargin", "category": "ideas", "icon": "✍️", "color": "#f97316", "desc": "Observations on technology, culture, and life"},
    "https://fivebooks.com/feed/": {"id": "five-books", "name": "Five Books", "category": "ideas", "icon": "📖", "color": "#b45309", "desc": "Curated expert book recommendations"},
    "https://lithub.com/feed/": {"id": "lithub", "name": "Literary Hub", "category": "ideas", "icon": "🖋️", "color": "#b91c1c", "desc": "Literary essays, book news, and culture"},
    "https://www.dailyartmagazine.com/feed/": {"id": "dailyart", "name": "DailyArt Magazine", "category": "ideas", "icon": "🎨", "color": "#e11d48", "desc": "Art history stories and masterpieces"},

    # Gaming
    "https://www.eurogamer.net/feed/reviews": {"id": "eurogamer", "name": "Eurogamer Reviews", "category": "gaming", "icon": "🎮", "color": "#0ea5e9", "desc": "In-depth video game reviews"},
    "https://www.gamedeveloper.com/rss.xml": {"id": "gamedeveloper", "name": "Game Developer", "category": "gaming", "icon": "🕹️", "color": "#14b8a6", "desc": "Game design, engineering, and industry analysis"},
    "https://www.purexbox.com/feeds/latest": {"id": "pure-xbox", "name": "Pure Xbox", "category": "gaming", "icon": "🟢", "color": "#107c10", "desc": "Xbox news, reviews, and updates"},
    "https://www.trueachievements.com/newsrss.aspx": {"id": "trueachievements", "name": "TrueAchievements", "category": "gaming", "icon": "🏆", "color": "#f59e0b", "desc": "Gaming achievements and community news"},

    # Chess
    "https://www.chess.com/rss/articles": {"id": "chess-com", "name": "Chess.com Articles", "category": "chess", "icon": "♟️", "color": "#7fa650", "desc": "Chess master analysis and learning guides"},
    "https://theweekinchess.com/twic-rss-feed": {"id": "twic", "name": "The Week in Chess", "category": "chess", "icon": "⏱️", "color": "#4b5563", "desc": "Global chess tournaments and Grandmaster results"},
    "https://en.chessbase.com/feed/20": {"id": "chessbase", "name": "ChessBase News", "category": "chess", "icon": "♞", "color": "#2563eb", "desc": "World chess championships and software updates"},

    # Comics
    "https://www.smbc-comics.com/comic/rss": {"id": "smbc", "name": "SMBC Comics", "category": "comics", "icon": "🗯️", "color": "#eab308", "desc": "Saturday Morning Breakfast Cereal by Zach Weinersmith"},
    "https://explosm.net/rss.xml": {"id": "explosm", "name": "Explosm (Cyanide & Happiness)", "category": "comics", "icon": "😂", "color": "#ef4444", "desc": "Comics, animations, and humor"},
}


def fetch_url(url: str, timeout: int = 5) -> Optional[bytes]:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*"},
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
        for hit in data.get("hits", [])[:15]:
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
                "commentsUrl": f"https://news.ycombinator.com/item?id={oid}",
                "domain": extract_domain(url, "ycombinator.com"),
            })
    except Exception as e:
        print(f"Error parsing Hacker News: {e}", file=sys.stderr)
    return items


def fetch_lobsters() -> List[Dict[str, Any]]:
    print("Fetching Lobste.rs...")
    items = []
    data_bytes = fetch_url("https://lobste.rs/hottest.json")
    if not data_bytes:
        return items
    try:
        posts = json.loads(data_bytes.decode("utf-8"))
        for p in posts[:15]:
            short_id = p.get("short_id")
            url = p.get("url") or p.get("comments_url")
            comments_url = p.get("comments_url") or f"https://lobste.rs/s/{short_id}"
            items.append({
                "id": f"lob-{short_id}",
                "title": p.get("title", ""),
                "url": url,
                "source": "Lobste.rs",
                "sourceId": "lobsters",
                "category": "tech",
                "publishedAt": p.get("created_at", datetime.datetime.now(datetime.timezone.utc).isoformat()),
                "points": p.get("score", 0),
                "comments": p.get("comment_count", 0),
                "commentsUrl": comments_url,
                "domain": extract_domain(url, "lobste.rs"),
            })
    except Exception as e:
        print(f"Error parsing Lobste.rs: {e}", file=sys.stderr)
    return items


def fetch_rss_feed(feed_url: str, meta: Dict[str, str]) -> List[Dict[str, Any]]:
    source_id = meta["id"]
    source_name = meta["name"]
    category = meta["category"]
    print(f"Fetching {source_name}...")
    items = []
    data_bytes = fetch_url(feed_url)
    if not data_bytes:
        return items
    try:
        root = ET.fromstring(data_bytes)
        channel = root.find("channel")
        if channel is None:
            channel = root

        elements = channel.findall("item")
        if not elements:
            elements = channel.findall("{http://www.w3.org/2005/Atom}entry")
        if not elements:
            elements = root.findall(".//item")
        if not elements:
            elements = root.findall(".//{http://www.w3.org/2005/Atom}entry")

        for item in elements[:15]:
            title_elem = item.find("title")
            if title_elem is None:
                title_elem = item.find("{http://www.w3.org/2005/Atom}title")
            title = title_elem.text.strip() if title_elem is not None and title_elem.text else ""

            link_elem = item.find("link")
            if link_elem is None:
                link_elem = item.find("{http://www.w3.org/2005/Atom}link")

            link = ""
            if link_elem is not None:
                link = link_elem.get("href") or link_elem.text or ""
                link = link.strip()

            if not title:
                continue

            item_hash = hashlib.md5((link or title).encode("utf-8")).hexdigest()[:8]

            items.append({
                "id": f"{source_id}-{item_hash}",
                "title": title,
                "url": link,
                "source": source_name,
                "sourceId": source_id,
                "category": category,
                "publishedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "domain": extract_domain(link, urllib.parse.urlparse(feed_url).netloc),
            })
    except Exception as e:
        print(f"Error parsing RSS {feed_url}: {e}", file=sys.stderr)
    return items


def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_path = os.path.join(root_dir, "public", "data", "feeds.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    csv_path = os.path.join(root_dir, "scripts", "actual-subscriptions-2026-10-30.csv")
    feeds_to_fetch: List[tuple] = []

    if os.path.exists(csv_path):
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                url = row.get("url", "").strip()
                if url:
                    meta = FEED_METADATA.get(url)
                    if not meta:
                        title = row.get("title", "").strip() or extract_domain(url, "feed")
                        slug = "".join(c if c.isalnum() else "-" for c in title.lower())[:20].strip("-")
                        meta = {
                            "id": slug,
                            "name": title,
                            "category": "tech",
                            "icon": "📰",
                            "color": "#6366f1",
                            "desc": row.get("description", "").strip() or title,
                        }
                    feeds_to_fetch.append((url, meta))

    if not feeds_to_fetch:
        for url, meta in FEED_METADATA.items():
            feeds_to_fetch.append((url, meta))

    all_items: List[Dict[str, Any]] = []
    sources_list: List[Dict[str, Any]] = []

    # 1. Add Hacker News & Lobste.rs
    sources_list.append({
        "id": "hacker-news",
        "name": "Hacker News",
        "category": "tech",
        "icon": "🟧",
        "description": "Tech, startups, and hacking discussions",
        "color": "#ff6600",
        "enabled": True,
        "fetchType": "hn",
    })
    sources_list.append({
        "id": "lobsters",
        "name": "Lobste.rs",
        "category": "tech",
        "icon": "🦞",
        "description": "Computing-focused community news and discussions",
        "color": "#8b1e0f",
        "enabled": True,
        "fetchType": "lobsters",
        "fetchUrl": "https://lobste.rs/hottest.json",
    })

    all_items.extend(fetch_hacker_news())
    all_items.extend(fetch_lobsters())

    # 2. Add feeds from user subscriptions
    seen_ids = {"hacker-news", "lobsters"}

    for url, meta in feeds_to_fetch:
        if meta["id"] not in seen_ids:
            seen_ids.add(meta["id"])
            sources_list.append({
                "id": meta["id"],
                "name": meta["name"],
                "category": meta["category"],
                "icon": meta["icon"],
                "description": meta.get("desc", ""),
                "color": meta["color"],
                "enabled": True,
            })

        items = fetch_rss_feed(url, meta)
        all_items.extend(items)

    # Preserve any existing items from feeds.json for feeds that timed out
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
        "sources": sources_list,
        "items": all_items,
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"✓ Successfully wrote {len(all_items)} headlines across {len(sources_list)} feeds to {output_path}")


if __name__ == "__main__":
    main()

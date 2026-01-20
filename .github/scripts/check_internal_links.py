#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse


EXCLUDE_SCHEMES = {"http", "https", "mailto", "tel"}
RE_INLINE_LINK = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")
RE_REF_DEF = re.compile(r"^\s*\[([^\]]+)\]:\s*(\S+)")
RE_FENCE = re.compile(r"^\s*```")


@dataclass(frozen=True)
class Link:
    source: Path
    raw_target: str
    line_number: int


def strip_target(raw: str) -> str:
    target = raw.strip()
    if (target.startswith('"') and target.endswith('"')) or (
        target.startswith("'") and target.endswith("'")
    ):
        target = target[1:-1].strip()
    if " " in target:
        target = target.split()[0]
    target = target.split("#", 1)[0].split("?", 1)[0]
    return target.strip()


def is_liquid(text: str) -> bool:
    return "{{" in text or "{%" in text


def should_skip_target(raw: str) -> bool:
    if not raw:
        return True
    if raw.startswith("#") or raw.startswith("//"):
        return True
    if is_liquid(raw):
        return True
    return False


def iter_links(md_path: Path) -> list[Link]:
    text = md_path.read_text(encoding="utf-8")
    links: list[Link] = []

    in_fence = False
    for i, line in enumerate(text.splitlines(), start=1):
        if RE_FENCE.match(line):
            in_fence = not in_fence
            continue
        if in_fence:
            continue

        for m in RE_INLINE_LINK.finditer(line):
            links.append(Link(source=md_path, raw_target=m.group(1), line_number=i))

        ref = RE_REF_DEF.match(line)
        if ref:
            links.append(Link(source=md_path, raw_target=ref.group(2), line_number=i))

    return links


def candidates(resolved: Path, had_trailing_slash: bool) -> list[Path]:
    if had_trailing_slash:
        return [resolved / "index.md", resolved.with_suffix(".md")]
    return [resolved, resolved.with_suffix(".md"), resolved / "index.md"]


def resolve_target(link: Link, docs_root: Path) -> tuple[str, Path] | None:
    raw = link.raw_target.strip()
    if should_skip_target(raw):
        return None

    parsed = urlparse(raw)
    if parsed.scheme in EXCLUDE_SCHEMES:
        return None

    target = strip_target(raw)
    if not target or should_skip_target(target):
        return None

    if target.startswith("/"):
        resolved = docs_root / target.lstrip("/")
    else:
        resolved = link.source.parent / target

    return target, resolved.resolve()


def main() -> int:
    repo_root = Path(__file__).resolve().parents[2]
    docs_root = repo_root / "docs"
    if not docs_root.is_dir():
        print("docs/ not found", file=sys.stderr)
        return 1

    md_files = sorted(docs_root.rglob("*.md"))
    failures: list[str] = []

    for md in md_files:
        for link in iter_links(md):
            resolved = resolve_target(link, docs_root)
            if resolved is None:
                continue
            target, path = resolved

            had_trailing_slash = target.endswith("/")
            if any(c.exists() for c in candidates(path, had_trailing_slash)):
                continue

            failures.append(
                f"{link.source.relative_to(repo_root)}:{link.line_number} -> {target}"
            )

    if failures:
        print("Broken internal links detected:", file=sys.stderr)
        for item in failures:
            print(f"- {item}", file=sys.stderr)
        return 1

    print("OK: no broken internal links (docs/**/*.md)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

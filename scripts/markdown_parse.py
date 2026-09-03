import html
import json
import os
import re
import sys

# ==========================================
# Configuration & Paths
# ==========================================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

INPUT_DIR = os.environ.get("DND_NOTES_DIR", sys.argv[1] if len(sys.argv) > 1 else None)
if not INPUT_DIR:
    print("Error: Input directory must be provided via DND_NOTES_DIR env var or command line argument.")
    sys.exit(1)

OUTPUT_JSON = os.path.join(BASE_DIR, "src", "data", "campaignData.json")

EXCLUDED_KEYWORDS = ["secret"]


# ==========================================
# Parsing Helpers
# ==========================================
def parse_inline(text: str) -> str:
    """Escapes HTML and parses inline markdown (bold, italic, code, links)."""
    escaped = html.escape(text)

    # Inline Code
    escaped = re.sub(r"`([^`]+)`", r"<code>\1</code>", escaped)
    # Bold + Italic
    escaped = re.sub(r"\*\*\*(.+?)\*\*\*", r"<strong><em>\1</em></strong>", escaped)
    escaped = re.sub(r"___(.+?)___", r"<strong><em>\1</em></strong>", escaped)
    # Bold
    escaped = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", escaped)
    escaped = re.sub(r"__(.+?)__", r"<strong>\1</strong>", escaped)
    # Italic
    escaped = re.sub(r"\*(.+?)\*", r"<em>\1</em>", escaped)
    escaped = re.sub(r"(?<!\w)_(.+?)_(?!\w)", r"<em>\1</em>", escaped)
    # Standard Markdown Links
    escaped = re.sub(
        r"\[(.+?)\]\(((?:https?://|/)[^\s)]+)\)",
        r'<a href="\2" target="_blank" rel="noopener noreferrer">\1</a>',
        escaped,
    )
    # Obsidian Wikilinks [[Link Target]] or [[Link Target|Display Text]]
    escaped = re.sub(
        r"\[\[([^|\]]+)(?:\|([^\]]+))?\]\]",
        lambda m: m.group(2) if m.group(2) else m.group(1),
        escaped,
    )

    return escaped


def parse_session_body(lines: list[str], excluded_keywords: list[str]) -> str:
    """Converts a session's markdown lines into structured HTML body content."""
    output = []
    in_code_block = False
    code_buffer = []
    excluding_subsection = False
    list_depth = 0

    def close_lists_to_depth(target_depth: int):
        nonlocal list_depth
        while list_depth > target_depth:
            list_depth -= 1
            indent = "\t" * list_depth
            output.append(f"{indent}</ul>")

    for line in lines:
        stripped = line.strip()

        # 1. Code Fence Handling (```)
        if stripped.startswith("```"):
            close_lists_to_depth(0)
            if not in_code_block:
                in_code_block = True
                code_buffer = []
            else:
                if not excluding_subsection:
                    escaped_code = "\n".join(
                        html.escape(code_line) for code_line in code_buffer
                    )
                    output.append(f"<pre><code>{escaped_code}</code></pre>")
                in_code_block = False
                code_buffer = []
            continue

        if in_code_block:
            if not excluding_subsection:
                code_buffer.append(line)
            continue

        # Skip empty lines outside code blocks
        if not stripped:
            close_lists_to_depth(0)
            continue

        # 2. Subheading Handling (###, ####)
        if stripped.startswith(("### ", "#### ")):
            close_lists_to_depth(0)
            heading_title = re.sub(r"^#+\s*", "", stripped)

            # Check for excluded subsection keywords (e.g. secret, commune)
            if any(kw in heading_title.lower() for kw in excluded_keywords):
                excluding_subsection = True
                continue

            excluding_subsection = False
            tag = "h4" if stripped.startswith("#### ") else "h3"
            output.append(f"<{tag}>{parse_inline(heading_title)}</{tag}>")
            continue

        # Skip content if inside an excluded section
        if excluding_subsection:
            continue

        # 3. List Item Handling
        list_match = re.match(r"^(\t*|[ ]{2,4})- (.*)$", line)
        if list_match:
            indent_str, item_content = list_match.groups()
            target_depth = (
                len(indent_str.replace("    ", "\t")) if indent_str else 0
            ) + 1

            while list_depth < target_depth:
                indent = "\t" * list_depth
                output.append(f"{indent}<ul>")
                list_depth += 1

            close_lists_to_depth(target_depth)

            item_indent = "\t" * list_depth
            output.append(
                f"{item_indent}<li>{parse_inline(item_content)}</li>"
            )
            continue

        # 4. Standard Paragraph
        close_lists_to_depth(0)
        output.append(f"<p>{parse_inline(stripped)}</p>")

    # Flush unclosed elements at EOF if necessary
    close_lists_to_depth(0)
    if in_code_block and not excluding_subsection:
        escaped_code = "\n".join(
            html.escape(code_line) for code_line in code_buffer
        )
        output.append(f"<pre><code>{escaped_code}</code></pre>")

    return "\n".join(output)


def natural_sort_key(filename: str):
    """Sorts filenames with embedded numbers naturally (e.g. Arc 1, Arc 2, Arc 10)."""
    return [
        float(text) if re.match(r"^\d+(\.\d+)?$", text) else text.lower()
        for text in re.split(r"(\d+(?:\.\d+)?)", filename)
    ]


# ==========================================
# Main Build Pipeline
# ==========================================
def main():
    if not os.path.exists(INPUT_DIR):
        print(f"Error: Input directory not found at '{INPUT_DIR}'")
        sys.exit(1)

    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)

    md_files = sorted(
        [f for f in os.listdir(INPUT_DIR) if f.lower().endswith(".md")],
        key=natural_sort_key,
    )
    if not md_files:
        print("No markdown files found.")
        return

    all_sessions = []
    arcs = []

    for md_file in md_files:
        base_name = os.path.splitext(md_file)[0].strip()
        slug_prefix = re.sub(r"[^a-zA-Z0-9]", "", base_name).lower()

        file_path = os.path.join(INPUT_DIR, md_file)
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.read().splitlines()

        file_sessions = []
        current_session = None

        for line in lines:
            stripped = line.strip()

            # Split on ## Level 2 Headings
            if stripped.startswith("## "):
                if current_session:
                    file_sessions.append(current_session)

                sess_title = stripped[3:].strip()
                order_num = len(file_sessions) + 1
                session_id = f"{slug_prefix}-{order_num:02d}"

                current_session = {
                    "id": session_id,
                    "arc_id": slug_prefix,
                    "arc_title": base_name,
                    "title": sess_title,
                    "order": order_num,
                    "lines": [],
                }
            elif current_session:
                current_session["lines"].append(line)

        if current_session:
            file_sessions.append(current_session)

        # Process session HTML for this arc
        processed_arc_sessions = []
        for s in file_sessions:
            content_html = parse_session_body(s["lines"], EXCLUDED_KEYWORDS)
            session_obj = {
                "id": s["id"],
                "arc_id": s["arc_id"],
                "arc_title": s["arc_title"],
                "title": s["title"],
                "order": s["order"],
                "content_html": content_html,
            }
            processed_arc_sessions.append(session_obj)
            all_sessions.append(session_obj)

        if processed_arc_sessions:
            arcs.append(
                {
                    "id": slug_prefix,
                    "title": base_name,
                    "session_count": len(processed_arc_sessions),
                    "sessions": [
                        {
                            "id": s["id"],
                            "title": s["title"],
                            "order": s["order"],
                        }
                        for s in processed_arc_sessions
                    ],
                }
            )

    payload = {
        "generated_at": None,
        "total_arcs": len(arcs),
        "total_sessions": len(all_sessions),
        "arcs": arcs,
        "sessions": all_sessions,
    }

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated campaign data: {OUTPUT_JSON}")
    print(f"Total Arcs: {len(arcs)} | Total Sessions: {len(all_sessions)}")


if __name__ == "__main__":
    main()
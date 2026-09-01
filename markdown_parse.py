import html
import os
import re

# ==========================================
# Configuration & Paths
# ==========================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_DIR = r"C:\Users\cjw92\OpenCloud\Personal\DnD\Daggerheart H1\Session Journal"
OUTPUT_DIR = os.path.join(BASE_DIR, "public", "session-journal")
SESSION_DATA_JS = os.path.join(BASE_DIR, "public", "js", "sessionData.js")
SESSION_JOURNAL_HTML = os.path.join(BASE_DIR, "public", "session-journal.html")

EXCLUDED_KEYWORDS = ["commune", "letter", "secret"]

# ==========================================
# HTML Templates
# ==========================================
SESSION_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <div class="site-container">
    <div id="sidebar-container"></div>

    <main class="content">
      <nav class="session-nav-bar">
        <a class="prev-session" href="#">← Previous</a>
        <select class="session-select"></select>
        <a class="next-session" href="#">Next →</a>
      </nav>

      <h1>{title}</h1>

{content}

      <nav class="session-nav-bar">
        <a class="prev-session" href="#">← Previous</a>
        <select class="session-select"></select>
        <a class="next-session" href="#">Next →</a>
      </nav>
    </main>
  </div>

  <script src="/js/loadMenu.js"></script>
  <script type="module" src="/js/sessions.js"></script>
</body>
</html>
"""

JOURNAL_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Session Journal</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <div class="site-container">
    <div id="sidebar-container"></div>

    <main class="content">
      <h1>Session Journal</h1>
{arc_sections}
    </main>
  </div>

  <script src="/js/loadMenu.js"></script>
  <script type="module" src="/js/sessions.js"></script>
</body>
</html>
"""

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
    # Links
    escaped = re.sub(
        r"\[(.+?)\]\(((?:https?://\vert{}/)[^\s)]+)\)",
        r'<a href="\2">\1</a>',
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
            output.append(f"<h3>{parse_inline(heading_title)}</h3>")
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
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r"(\d+)", filename)]

# ==========================================
# Main Build Pipeline
# ==========================================
def main():
    if not os.path.exists(INPUT_DIR):
        print(f"Error: Input directory not found at '{INPUT_DIR}'")
        return

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(SESSION_DATA_JS), exist_ok=True)

    md_files = sorted([f for f in os.listdir(INPUT_DIR) if f.lower().endswith(".md")], key=natural_sort_key)
    if not md_files:
        print("No markdown files found.")
        return

    all_sessions = []
    groups = []

    # 1. Parse markdown files into grouped sessions
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
                filename = f"{slug_prefix}-{order_num:02d}.html"

                current_session = {
                    "group_name": base_name,
                    "title": sess_title,
                    "filename": filename,
                    "file_path": f"/session-journal/{filename}",
                    "lines": []
                }
            elif current_session:
                current_session["lines"].append(line)

        if current_session:
            file_sessions.append(current_session)

        if file_sessions:
            groups.append({
                "group_name": base_name,
                "sessions": file_sessions
            })
            all_sessions.extend(file_sessions)

    # 2. Write individual session HTML pages
    for s in all_sessions:
        content_html = parse_session_body(s["lines"], EXCLUDED_KEYWORDS)
        page_html = SESSION_TEMPLATE.format(title=s["title"], content=content_html)

        out_path = os.path.join(OUTPUT_DIR, s["filename"])
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(page_html)
        print(f"Generated: {out_path}")

    # 3. Generate sessionData.js
    js_entries = []
    for s in all_sessions:
        full_title = f"{s['group_name']}: {s['title']}"
        js_entries.append(f'  {{ file: "{s["file_path"]}", title: "{full_title}" }},')

    js_content = "export const campaignSessions = [\n" + "\n".join(js_entries) + "\n];\n"
    with open(SESSION_DATA_JS, "w", encoding="utf-8") as f:
        f.write(js_content)
    print(f"Updated: {SESSION_DATA_JS}")

    # 4. Generate session-journal.html Table of Contents
    arc_sections = []
    for group in groups:
        section = [
            '      <details class="arc-details">',
            f'        <summary>{group["group_name"]}</summary>',
            '        <ul class="session-list">'
        ]
        for s in group["sessions"]:
            section.append(f'          <li><a href="{s["file_path"]}">{s["title"]}</a></li>')
        section.append('        </ul>')
        section.append('      </details>\n')
        arc_sections.append("\n".join(section))

    journal_html = JOURNAL_TEMPLATE.format(arc_sections="\n".join(arc_sections))
    with open(SESSION_JOURNAL_HTML, "w", encoding="utf-8") as f:
        f.write(journal_html)
    print(f"Generated: {SESSION_JOURNAL_HTML}")


if __name__ == "__main__":
    main()
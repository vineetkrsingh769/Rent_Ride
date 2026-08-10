"""Export DETAILED_PROJECT_REPORT.md to a printable PDF."""
from pathlib import Path

import markdown
from xhtml2pdf import pisa

ROOT = Path(__file__).resolve().parent
MD_PATH = ROOT / "DETAILED_PROJECT_REPORT.md"
PDF_PATH = ROOT / "DETAILED_PROJECT_REPORT.pdf"

CSS = """
@page {
  size: A4;
  margin: 18mm 16mm 18mm 16mm;
}
body {
  font-family: Helvetica, Arial, sans-serif;
  font-size: 10.5pt;
  line-height: 1.45;
  color: #1a1a1a;
}
h1 {
  font-size: 18pt;
  color: #0f3d2e;
  border-bottom: 2px solid #1f6b4a;
  padding-bottom: 6px;
  margin-top: 0;
}
h2 {
  font-size: 13pt;
  color: #0f3d2e;
  margin-top: 22px;
  border-bottom: 1px solid #cfe3d8;
  padding-bottom: 4px;
}
h3 {
  font-size: 11.5pt;
  color: #1f6b4a;
  margin-top: 14px;
}
p, li { margin: 4px 0; }
ul, ol { margin: 6px 0 10px 18px; }
code, pre {
  font-family: Courier, monospace;
  font-size: 8.5pt;
  background: #f4f7f5;
}
pre {
  border: 1px solid #d7e5dd;
  padding: 8px;
  white-space: pre-wrap;
  word-wrap: break-word;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0 14px 0;
  font-size: 9pt;
}
th, td {
  border: 1px solid #c9d8cf;
  padding: 5px 6px;
  vertical-align: top;
  text-align: left;
}
th {
  background: #e8f3ec;
  color: #0f3d2e;
  font-weight: bold;
}
hr {
  border: none;
  border-top: 1px solid #d0ddd5;
  margin: 16px 0;
}
strong { color: #123528; }
blockquote {
  border-left: 3px solid #1f6b4a;
  margin: 8px 0;
  padding: 4px 10px;
  color: #333;
  background: #f7faf8;
}
"""


def main() -> None:
    md_text = MD_PATH.read_text(encoding="utf-8")
    body = markdown.markdown(
        md_text,
        extensions=["tables", "fenced_code", "sane_lists", "nl2br"],
    )
    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>RentRide — Detailed Project Report</title>
  <style>{CSS}</style>
</head>
<body>
{body}
</body>
</html>
"""
    with PDF_PATH.open("wb") as out:
        result = pisa.CreatePDF(html, dest=out, encoding="utf-8")
    if result.err:
        raise SystemExit(f"PDF generation failed with {result.err} error(s)")
    print(f"Wrote {PDF_PATH} ({PDF_PATH.stat().st_size} bytes)")


if __name__ == "__main__":
    main()

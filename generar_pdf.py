"""Script per generar el PDF de documentacio de Lab FA."""
import markdown
from xhtml2pdf import pisa
import os

MARKDOWN_FILE = "DOCUMENTACIO.md"
OUTPUT_PDF = "DOCUMENTACIO.pdf"

HTML_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {{
    size: A4;
    margin: 2cm 1.8cm;
    @frame footer {{
      -pdf-frame-content: footerContent;
      bottom: 0.5cm;
      margin-left: 1.8cm;
      margin-right: 1.8cm;
      height: 1cm;
    }}
  }}
  body {{
    font-family: Helvetica, Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.45;
    color: #1a1a1a;
  }}
  h1 {{
    font-size: 22pt;
    color: #2c3e50;
    border-bottom: 3px solid #3498db;
    padding-bottom: 8px;
    margin-top: 30px;
    margin-bottom: 12px;
  }}
  h2 {{
    font-size: 16pt;
    color: #2c3e50;
    border-bottom: 1px solid #bdc3c7;
    padding-bottom: 5px;
    margin-top: 24px;
    margin-bottom: 10px;
  }}
  h3 {{
    font-size: 13pt;
    color: #34495e;
    margin-top: 18px;
    margin-bottom: 8px;
  }}
  h4 {{
    font-size: 11pt;
    color: #34495e;
    margin-top: 14px;
    margin-bottom: 6px;
  }}
  p {{
    margin-bottom: 6px;
  }}
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 14px 0;
    font-size: 9pt;
  }}
  th {{
    background-color: #2c3e50;
    color: white;
    padding: 6px 8px;
    text-align: left;
    font-weight: bold;
  }}
  td {{
    padding: 5px 8px;
    border-bottom: 1px solid #dee2e6;
  }}
  tr:nth-child(even) td {{
    background-color: #f8f9fa;
  }}
  code {{
    font-family: Courier, monospace;
    font-size: 9pt;
    background-color: #f0f0f0;
    padding: 1px 4px;
    border-radius: 3px;
  }}
  pre {{
    background-color: #f4f4f4;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 10px 12px;
    font-family: Courier, monospace;
    font-size: 8.5pt;
    line-height: 1.35;
    overflow: hidden;
    margin: 8px 0 12px 0;
  }}
  pre code {{
    background-color: transparent;
    padding: 0;
  }}
  strong {{
    color: #2c3e50;
  }}
  em {{
    color: #555;
  }}
  ul, ol {{
    margin: 4px 0 8px 0;
    padding-left: 20px;
  }}
  li {{
    margin-bottom: 3px;
  }}
  hr {{
    border: none;
    border-top: 2px solid #ecf0f1;
    margin: 20px 0;
  }}
  .footer-text {{
    font-size: 8pt;
    color: #999;
    text-align: center;
  }}
</style>
</head>
<body>
{content}
<div id="footerContent">
  <p class="footer-text">Lab FA - Documentacio Tecnica</p>
</div>
</body>
</html>"""


def main():
    md_path = os.path.join(os.path.dirname(__file__), MARKDOWN_FILE)
    pdf_path = os.path.join(os.path.dirname(__file__), OUTPUT_PDF)

    with open(md_path, "r", encoding="utf-8") as f:
        md_text = f.read()

    html_content = markdown.markdown(
        md_text,
        extensions=["tables", "fenced_code", "codehilite", "toc"],
    )

    full_html = HTML_TEMPLATE.format(content=html_content)

    with open(pdf_path, "wb") as pdf_file:
        status = pisa.CreatePDF(full_html, dest=pdf_file)

    if status.err:
        print(f"Error generant el PDF: {status.err}")
    else:
        print(f"PDF generat correctament: {pdf_path}")


if __name__ == "__main__":
    main()

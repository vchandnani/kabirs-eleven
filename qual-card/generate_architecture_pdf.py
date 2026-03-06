#!/usr/bin/env python3
"""Generate a one-page system architecture diagram PDF for Kabir's Eleven."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


PAGE_WIDTH = 792  # Letter landscape
PAGE_HEIGHT = 612


def pdf_escape(value: str) -> str:
  return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


@dataclass
class Box:
  x: int
  y: int
  w: int
  h: int
  title: str
  lines: list[str]
  fill_r: float
  fill_g: float
  fill_b: float
  body_indent: int = 10
  text_shift_y: int = 0


def rect_with_text(box: Box) -> str:
  cmds: list[str] = []
  cmds.append(f"{box.fill_r:.2f} {box.fill_g:.2f} {box.fill_b:.2f} rg")
  cmds.append("0 0 0 RG")
  cmds.append("1 w")
  cmds.append(f"{box.x} {box.y} {box.w} {box.h} re B")
  cmds.append("0 0 0 rg")

  # Title (supports manual line breaks with '\n')
  title_x = box.x + 10
  title_y = box.y + box.h - 16 + box.text_shift_y
  for idx, title_line in enumerate(box.title.split("\n")):
    cmds.append("BT")
    cmds.append("/F1 10 Tf")
    cmds.append(f"{title_x} {title_y - idx * 10} Td")
    cmds.append(f"({pdf_escape(title_line)}) Tj")
    cmds.append("ET")

  # Body lines
  body_x = box.x + box.body_indent
  line_y = title_y - 14 - (len(box.title.split("\n")) - 1) * 10
  for line in box.lines:
    cmds.append("BT")
    cmds.append("/F1 8.5 Tf")
    cmds.append(f"{body_x} {line_y} Td")
    cmds.append(f"({pdf_escape(line)}) Tj")
    cmds.append("ET")
    line_y -= 10

  return "\n".join(cmds)


def line(x1: int, y1: int, x2: int, y2: int) -> str:
  return f"0 0 0 RG 1.4 w {x1} {y1} m {x2} {y2} l S"


def arrow_right(x1: int, y1: int, x2: int, y2: int) -> str:
  return "\n".join(
    [
      line(x1, y1, x2, y2),
      line(x2, y2, x2 - 6, y2 + 4),
      line(x2, y2, x2 - 6, y2 - 4),
    ]
  )


def arrow_down(x1: int, y1: int, x2: int, y2: int) -> str:
  return "\n".join(
    [
      line(x1, y1, x2, y2),
      line(x2, y2, x2 - 4, y2 + 6),
      line(x2, y2, x2 + 4, y2 + 6),
    ]
  )


def arrow_left(x1: int, y1: int, x2: int, y2: int) -> str:
  return "\n".join(
    [
      line(x1, y1, x2, y2),
      line(x2, y2, x2 + 6, y2 + 4),
      line(x2, y2, x2 + 6, y2 - 4),
    ]
  )


def polyline_arrow(points: list[tuple[int, int]]) -> str:
  cmds: list[str] = []
  for i in range(len(points) - 1):
    x1, y1 = points[i]
    x2, y2 = points[i + 1]
    cmds.append(line(x1, y1, x2, y2))

  x1, y1 = points[-2]
  x2, y2 = points[-1]
  dx = x2 - x1
  dy = y2 - y1

  def filled_triangle(points_str: str) -> str:
    return f"0 0 0 rg {points_str} f"

  if abs(dx) >= abs(dy):
    if dx >= 0:
      cmds.append(
        filled_triangle(f"{x2} {y2} m {x2 - 6} {y2 + 3} l {x2 - 6} {y2 - 3} l h")
      )
    else:
      cmds.append(
        filled_triangle(f"{x2} {y2} m {x2 + 6} {y2 + 3} l {x2 + 6} {y2 - 3} l h")
      )
  else:
    if dy >= 0:
      cmds.append(
        filled_triangle(f"{x2} {y2} m {x2 - 3} {y2 - 6} l {x2 + 3} {y2 - 6} l h")
      )
    else:
      cmds.append(
        filled_triangle(f"{x2} {y2} m {x2 - 3} {y2 + 6} l {x2 + 3} {y2 + 6} l h")
      )
  return "\n".join(cmds)


def label(text: str, x: int, y: int, size: int = 9, font: str = "F1") -> str:
  return "\n".join(
    [
      "BT",
      f"/{font} {size} Tf",
      f"{x} {y} Td",
      f"({pdf_escape(text)}) Tj",
      "ET",
    ]
  )


def centered_label(text: str, y: int, size: int = 9, font: str = "F1") -> str:
  approx_char_width = size * 0.52
  text_width = int(len(text) * approx_char_width)
  x = max(10, (PAGE_WIDTH - text_width) // 2)
  return label(text, x, y, size, font)


def build_content_stream() -> str:
  cmds: list[str] = []

  cmds.append(centered_label("Kabir's Eleven - System Architecture Diagram", 582, 15, "F2"))

  ui = Box(
    20,
    214,
    170,
    220,
    "Web UI",
    [
      "Capture inputs - Render outputs",
      "Files: index.html, app.js, styles.css",
      "Forms + Lists + action icons",
    ],
    1.00,
    0.93,
    0.95,
  )
  players = Box(
    220,
    404,
    180,
    120,
    "Players Capability",
    [
      "Purpose: Player master data",
      "Create | Read | Update | Delete",
      "Unique number + name validation",
    ],
    1.00,
    0.97,
    0.82,
  )
  teams = Box(
    220,
    264,
    180,
    120,
    "Teams Capability",
    [
      "Purpose: Team rosters from players",
      "Create | Read | Update | Delete",
      "Up to 11 player numbers per team",
    ],
    1.00,
    0.97,
    0.82,
  )
  matches = Box(
    220,
    124,
    180,
    120,
    "Matches Capability",
    [
      "Purpose: Match records and outcomes",
      "Create | Read (Update/Delete ready)",
      "Batter runs + bowler wickets input",
    ],
    1.00,
    0.97,
    0.82,
  )
  validation = Box(
    430,
    350,
    180,
    156,
    "Validation Layer",
    [
      "Purpose: Rule enforcement",
      "player-validation.js",
      "team-validation.js",
      "match-validation.js",
      "Input parsing + consistency checks",
    ],
    0.90,
    0.98,
    0.90,
  )
  scoring = Box(
    430,
    156,
    180,
    156,
    "Match Scoring Engine",
    [
      "Purpose: Score computation",
      "Batter runs -> total runs",
      "Bowler wickets -> wickets lost",
      "Winner computed and stored",
    ],
    0.90,
    0.98,
    0.90,
  )
  storage = Box(
    630,
    214,
    142,
    220,
    "Data Layer\n(Browser localStorage)",
    [
      "Purpose: Persist app state",
      "cricketPlayers",
      "cricketTeams",
      "cricketMatches",
      "Used to rehydrate UI",
    ],
    0.87,
    0.94,
    1.00,
    10,
    -16,
  )

  for box in [ui, players, teams, matches, validation, scoring, storage]:
    cmds.append(rect_with_text(box))

  # UI -> CRUD capabilities (horizontal, no crossings)
  cmds.append(polyline_arrow([(190, 434), (190, 464), (220, 464)]))
  cmds.append(polyline_arrow([(190, 324), (220, 324)]))
  cmds.append(polyline_arrow([(190, 214), (190, 184), (220, 184)]))

  # CRUD interactions
  cmds.append(polyline_arrow([(310, 404), (310, 384)]))
  cmds.append(polyline_arrow([(310, 264), (310, 244)]))
  cmds.append(label("number lookup", 318, 392))
  cmds.append(label("team rosters", 318, 252))

  # CRUD -> processing layers
  cmds.append(polyline_arrow([(400, 464), (430, 464)]))
  cmds.append(polyline_arrow([(400, 324), (415, 324), (415, 390), (430, 390)]))
  cmds.append(polyline_arrow([(400, 184), (430, 184)]))

  # Validation -> scoring -> data
  cmds.append(polyline_arrow([(520, 350), (520, 312)]))
  cmds.append(label("validated input", 528, 332))
  cmds.append(polyline_arrow([(610, 420), (630, 420)]))
  cmds.append(polyline_arrow([(610, 234), (630, 234)]))
  cmds.append(label("persist entities", 632, 418, 7))
  cmds.append(label("totals + winner", 632, 232, 7))

  # Data -> UI read path
  cmds.append(polyline_arrow([(701, 214), (701, 88), (105, 88), (105, 214)]))
  cmds.append(label("rehydrate lists and cards", 362, 96))

  return "\n".join(cmds)


def build_pdf(content_stream: str) -> bytes:
  objects: list[bytes] = []

  def add_object(data: bytes) -> int:
    objects.append(data)
    return len(objects)

  add_object(b"<< /Type /Catalog /Pages 2 0 R >>")
  add_object(b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
  page_obj = (
    f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_WIDTH} {PAGE_HEIGHT}] "
    "/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>"
  )
  add_object(page_obj.encode("ascii"))
  add_object(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
  add_object(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")

  stream_data = content_stream.encode("latin-1")
  add_object(
    b"<< /Length "
    + str(len(stream_data)).encode("ascii")
    + b" >>\nstream\n"
    + stream_data
    + b"\nendstream"
  )

  header = b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"
  body = bytearray()
  offsets = [0]
  cursor = len(header)

  for i, obj in enumerate(objects, start=1):
    offsets.append(cursor)
    obj_bytes = f"{i} 0 obj\n".encode("ascii") + obj + b"\nendobj\n"
    body.extend(obj_bytes)
    cursor += len(obj_bytes)

  xref_start = len(header) + len(body)
  xref = bytearray()
  xref.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
  xref.extend(b"0000000000 65535 f \n")
  for off in offsets[1:]:
    xref.extend(f"{off:010d} 00000 n \n".encode("ascii"))

  trailer = (
    b"trailer\n<< /Size "
    + str(len(objects) + 1).encode("ascii")
    + b" /Root 1 0 R >>\nstartxref\n"
    + str(xref_start).encode("ascii")
    + b"\n%%EOF\n"
  )

  return header + body + xref + trailer


def main() -> None:
  output_path = Path(__file__).resolve().parent / "system-architecture-diagram.pdf"
  content = build_content_stream()
  pdf = build_pdf(content)
  output_path.write_bytes(pdf)
  print(f"Wrote {output_path}")


if __name__ == "__main__":
  main()

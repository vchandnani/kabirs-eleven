#!/usr/bin/env python3
"""Generate one-page capability guide PDFs for players, teams, and matches."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


PAGE_WIDTH = 612   # Letter portrait
PAGE_HEIGHT = 792
MARGIN = 28
SECTION_GAP = 12


def pdf_escape(value: str) -> str:
  return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def wrap_text(text: str, max_chars: int) -> list[str]:
  words = text.split()
  if not words:
    return [""]
  lines: list[str] = []
  current = words[0]
  for word in words[1:]:
    proposal = f"{current} {word}"
    if len(proposal) <= max_chars:
      current = proposal
    else:
      lines.append(current)
      current = word
  lines.append(current)
  return lines


@dataclass
class Section:
  title: str
  bullets: list[str]


@dataclass
class Guide:
  filename: str
  title: str
  subtitle: str
  sections: list[Section]


def section_commands(x: int, y_top: int, section: Section) -> tuple[str, int]:
  cmds: list[str] = []
  cmds.append("0 0 0 RG")
  cmds.append("0 0 0 rg")

  title_x = x + 10
  title_y = y_top
  cmds.append("BT")
  cmds.append("/F2 12 Tf")
  cmds.append(f"{title_x} {title_y} Td")
  cmds.append(f"({pdf_escape(section.title)}) Tj")
  cmds.append("ET")

  line_y = title_y - 18
  lines_used = 1
  for bullet in section.bullets:
    wrapped = wrap_text(bullet, 68)
    for i, chunk in enumerate(wrapped):
      prefix = "- " if i == 0 else "  "
      cmds.append("BT")
      cmds.append("/F1 10.5 Tf")
      cmds.append(f"{title_x} {line_y} Td")
      cmds.append(f"({pdf_escape(prefix + chunk)}) Tj")
      cmds.append("ET")
      line_y -= 12
      lines_used += 1

  used_height = 17 + (lines_used - 1) * 12
  return "\n".join(cmds), used_height


def build_content_stream(guide: Guide) -> str:
  cmds: list[str] = []

  title_x = MARGIN
  title_y = PAGE_HEIGHT - MARGIN
  cmds.append("BT")
  cmds.append("/F2 18 Tf")
  cmds.append(f"{title_x} {title_y} Td")
  cmds.append(f"({pdf_escape(guide.title)}) Tj")
  cmds.append("ET")

  cmds.append("BT")
  cmds.append("/F1 12 Tf")
  cmds.append(f"{title_x} {title_y - 18} Td")
  cmds.append(f"({pdf_escape(guide.subtitle)}) Tj")
  cmds.append("ET")

  content_top = title_y - 40
  y = content_top
  for section in guide.sections:
    section_cmds, used_height = section_commands(MARGIN, y, section)
    cmds.append(section_cmds)
    y -= used_height + SECTION_GAP

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

  stream_data = content_stream.encode("latin-1", errors="replace")
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


def guides() -> list[Guide]:
  return [
    Guide(
      filename="manage-players-capability.pdf",
      title="Manage Players - Capability Guide",
      subtitle="5-minute onboarding: code map, runtime flow, validation, and tests",
      sections=[
        Section(
          "1) Capability Scope",
          [
            "CRUD for players in Web UI: create, list, edit, delete.",
            "Data model fields: number, firstName, lastName, teamAffiliation, specialization.",
            "Storage key: cricketPlayers in browser localStorage.",
          ],
        ),
        Section(
          "2) Key Code Paths",
          [
            "app.js: player form submit handler validates + saves new/updated record.",
            "app.js: renderPlayers() builds list rows and wires edit/delete icons.",
            "app.js: setEditingMode(), clearEditingMode(), fillForm(), deletePlayer().",
            "player-validation.js: validatePlayer() + duplicate checks (number and full name).",
          ],
        ),
        Section(
          "3) Validation + Runtime Rules",
          [
            "All fields required.",
            "Player number must be unique (trimmed + case-insensitive).",
            "First+last name combination must be unique (trimmed + case-insensitive).",
            "During edit, current row is excluded from duplicate checks via ignoreIndex.",
          ],
        ),
        Section(
          "4) Automated Tests (Associated)",
          [
            "Unit: test/player-validation.test.js covers normalize, missing fields, duplicates, edit ignoreIndex, valid path.",
            "UI integration: test/app-ui.test.js covers edit flow, cancel edit, delete flow, duplicate block on edit, delete edge cases while editing.",
            "Run locally: npm test | npm run test:coverage.",
          ],
        ),
        Section(
          "5) Fast Review Checklist",
          [
            "Read player-validation.js first (business rules).",
            "Then inspect app.js player handlers and renderPlayers().",
            "Finally scan player unit tests + player UI tests to confirm expected behavior.",
          ],
        ),
      ],
    ),
    Guide(
      filename="manage-teams-capability.pdf",
      title="Manage Teams - Capability Guide",
      subtitle="5-minute onboarding: code map, runtime flow, validation, and tests",
      sections=[
        Section(
          "1) Capability Scope",
          [
            "CRUD for teams in UI: create, list, edit, delete.",
            "Team fields: name, selected logo, playerNumbers roster (max 11).",
            "Storage key: cricketTeams in browser localStorage.",
          ],
        ),
        Section(
          "2) Key Code Paths",
          [
            "app.js: teamForm submit handler validates then saves/updates team.",
            "app.js: renderTeamLogoOptions(), selectTeamLogo(), resetTeamLogoSelection().",
            "app.js: renderTeams() builds team cards + member name lookup by player number.",
            "app.js: setTeamEditingMode(), clearTeamEditingMode(), fillTeamForm(), deleteTeam().",
          ],
        ),
        Section(
          "3) Validation + Runtime Rules",
          [
            "Team name required; logo selection required.",
            "Roster needs at least one player number and at most 11.",
            "No duplicate player numbers inside one team.",
            "Every player number must already exist in players dataset.",
            "Validation source: team-validation.js validateTeam().",
          ],
        ),
        Section(
          "4) Automated Tests (Associated)",
          [
            "Unit: test/team-validation.test.js covers parse input, required fields, max 11, duplicates, unknown numbers, valid path.",
            "UI integration: test/app-ui.test.js covers team create success, unknown-number failure, edit/update, cancel edit, delete, and delete-while-editing index shifts.",
            "Cross-capability: team display confirms player number -> full name mapping.",
          ],
        ),
        Section(
          "5) Fast Review Checklist",
          [
            "Start with team-validation.js to learn acceptance rules.",
            "Read app.js team logo selector + team submit/edit/delete handlers.",
            "Confirm behavior via team unit tests and team-focused UI tests.",
          ],
        ),
      ],
    ),
    Guide(
      filename="manage-matches-capability.pdf",
      title="Manage Matches - Capability Guide",
      subtitle="5-minute onboarding: code map, runtime flow, scoring logic, and tests",
      sections=[
        Section(
          "1) Capability Scope",
          [
            "Create + list matches between two teams (UI currently implements create/read).",
            "Stores batter runs and bowler wickets per team, computes totals and winner.",
            "Storage key: cricketMatches in browser localStorage.",
          ],
        ),
        Section(
          "2) Key Code Paths",
          [
            "app.js: matchForm submit handler builds payload and calls validateMatch().",
            "app.js: populateMatchTeamOptions() keeps Team A/Team B selections valid.",
            "app.js: renderMatches() outputs scoreline, winner, and stat breakdowns.",
            "match-validation.js: parseStats(), validateMembers(), validateMatch(), sumValues().",
          ],
        ),
        Section(
          "3) Scoring + Winner Rules",
          [
            "Input format: playerNumber:value (comma/newline separated).",
            "Runs total: sum of batter runs entries per team.",
            "Wickets lost: derived from opposing team bowler wickets entries.",
            "Winner: higher runs; if tie on runs, fewer wickets lost wins; else Draw.",
            "Roster guard: all entered player numbers must belong to selected team.",
          ],
        ),
        Section(
          "4) Automated Tests (Associated)",
          [
            "Unit: test/match-validation.test.js covers parsing, invalid formats, roster validation errors, runs/wickets totals, and winner tie-break scenarios.",
            "UI integration: test/app-ui.test.js covers create match success, same-team rejection, disabled submit guard, team selector auto-adjust logic, and stat input field type assertions.",
            "All tests run under Node test runner with c8 coverage thresholds.",
          ],
        ),
        Section(
          "5) Fast Review Checklist",
          [
            "Read validateMatch() first to understand all decision logic.",
            "Then inspect match form submit + renderMatches() in app.js.",
            "Use match-validation + app-ui tests as executable documentation for edge cases.",
          ],
        ),
      ],
    ),
  ]


def main() -> None:
  out_dir = Path(__file__).resolve().parent
  for guide in guides():
    content = build_content_stream(guide)
    pdf = build_pdf(content)
    out_path = out_dir / guide.filename
    out_path.write_bytes(pdf)
    print(f"Wrote {out_path}")


if __name__ == "__main__":
  main()

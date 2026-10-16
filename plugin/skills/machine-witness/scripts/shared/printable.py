#!/usr/bin/env python3
"""A printable checklist, written as a PDF with nothing but the standard library.

═══════════════════════════════════════════════════════════════════════════════
🔴 WHY THIS EXISTS AT ALL.

A reader finished the flow and said the list of things to do "is not helpful at
all" as text on a screen, and asked for something they could print and carry. It
is a checklist of errands, several of which have to be run in a building with no
computer in front of them, on a day when they are not thinking clearly. A file
they can put in a pocket is a different object from a paragraph in a terminal.

⛔ NO LIBRARY, AND NO NETWORK. Nothing in this project may install anything or
reach anything, so the PDF is assembled byte by byte here. It is a small format
if you refuse every optional part of it, and every optional part is refused: no
compression, no embedded font, no metadata, no outline, no annotations, no
JavaScript, no attachments.

🔴 COURIER, AND NOT AS A STYLE CHOICE. Every glyph in Courier is exactly 600/1000
of an em, so a line's width is its length times the size times 0.6 and wrapping
is arithmetic. Any other base-14 font would need a per-character width table
transcribed into this file to wrap correctly, and a transcribed table is a
hundred numbers that can each be wrong. It is also the right face for a list full
of filesystem paths.

🔴 THE ENCODING IS THE TRAP, AND IT FAILS CLOSED.

The base-14 fonts are WinAnsi: one byte per glyph, and nothing above 0xFF exists.
The rest of this project writes ⛔, ⚠️, ⚖️ and 🔴 constantly, and those markers are
not decoration — they sit on the fences and the double-edged notes, which is
precisely the material RAIL 4 says must not be quieter than the rest. A writer
that dropped them silently, or replaced them with `?`, would take the emphasis
off the lines that carry the cost and leave it on the ones that do not.

So they are TRANSLITERATED into words, and anything left above 0xFF after that is
a refusal rather than a substitution. A wrong character in a document somebody
carries into a police station is worth stopping for.
═══════════════════════════════════════════════════════════════════════════════
"""

import re

__all__ = ["PrintableError", "render_pdf", "transliterate", "selfcheck"]


class PrintableError(ValueError):
    """A document this writer will not produce. Raised, never worked around."""


# ── the page ──────────────────────────────────────────────────────────────────
# A4 in points, because a checklist that prints short on the more widely used
# paper size is worse than one that prints short on the other. ⚠️ US Letter is
# WIDER and SHORTER, so A4 content fits the width and may run a line onto another
# page. The reverse choice would cut text off the right edge, which loses it.
PAGE_WIDTH = 595.28
PAGE_HEIGHT = 841.89
MARGIN = 54.0

COURIER_EM = 0.6  # every glyph, exactly. The whole reason this font was chosen.

# style -> (font resource, size, leading, left indent, prefix)
STYLES = {
    "title": ("F2", 15.0, 22.0, 0.0, ""),
    "heading": ("F2", 11.0, 16.0, 0.0, ""),
    "item": ("F2", 10.0, 14.0, 0.0, "[ ] "),
    "body": ("F1", 9.5, 12.5, 24.0, ""),
    "path": ("F1", 9.5, 12.5, 24.0, ""),
    "blank": ("F1", 9.5, 7.0, 0.0, ""),
}


# ── encoding ──────────────────────────────────────────────────────────────────

# ⛔ ORDER MATTERS: the two-codepoint forms come first, because ⚠️ is U+26A0
# followed by U+FE0F and replacing the base character alone would leave the
# variation selector behind to fail the range check on its own.
TRANSLITERATE = (
    ("⚠️", "WARNING: "),
    ("⚖️", "LAW: "),
    ("⛔", "STOP: "),
    ("⚠", "WARNING: "),
    ("⚖", "LAW: "),
    ("✅", "OK: "),
    ("\U0001f534", "IMPORTANT: "),
    ("→", "->"),
    ("·", "-"),
    ("‹", "<"),
    ("›", ">"),
)

# Codepoints WinAnsi does hold above Latin-1, at the byte it holds them at. These
# are substitutions of a byte, not of a word: the character really is available.
WINANSI_HIGH = {
    "€": 0x80,
    "‚": 0x82,
    "ƒ": 0x83,
    "„": 0x84,
    "…": 0x85,
    "†": 0x86,
    "‡": 0x87,
    "ˆ": 0x88,
    "‰": 0x89,
    "Š": 0x8A,
    "Œ": 0x8C,
    "Ž": 0x8E,
    "‘": 0x91,
    "’": 0x92,
    "“": 0x93,
    "”": 0x94,
    "•": 0x95,
    "–": 0x96,
    "—": 0x97,
    "˜": 0x98,
    "™": 0x99,
    "š": 0x9A,
    "œ": 0x9C,
    "ž": 0x9E,
    "Ÿ": 0x9F,
}


def transliterate(text):
    """Marker glyphs into words. ⛔ Never lossy, and never a `?`."""
    for glyph, word in TRANSLITERATE:
        text = text.replace(glyph, word)
    # A marker at the start of a line becomes a word plus a space, so tidy the
    # doubled space that leaves rather than shipping it into a printed document.
    return re.sub(r"  +", " ", text).rstrip()


def to_winansi(text):
    """One byte per glyph, or a refusal naming the character and what it was in.

    ⛔ THE REFUSAL IS THE POINT. Every other option here is a silent lie: `?`
    claims a character was there and unreadable, dropping it claims it was never
    written, and `latin-1` with `errors="replace"` does the first of those
    invisibly. This is a document somebody may hand to a lawyer.
    """
    out = bytearray()
    for char in text:
        point = ord(char)
        if point in (0x0A, 0x0D):
            continue  # lines are split before this is called
        if point < 0x100:
            out.append(point)
            continue
        replacement = WINANSI_HIGH.get(char)
        if replacement is not None:
            out.append(replacement)
            continue
        raise PrintableError(
            f"I will not write this page: the character {char!r} (U+{point:04X}) "
            "has no place in the font this document uses, and the alternatives are "
            "all silent. Add it to the transliteration table in printable.py.\n"
            f"  in this line: {text[:70]!r}"
        )
    return bytes(out)


# ── layout ────────────────────────────────────────────────────────────────────


def wrap(text, columns):
    """Break on spaces at a fixed column count. Never mid-word unless it must.

    ⚠️ A word longer than the column count is HARD-BROKEN rather than allowed to
    run off the edge, because the words that do this are absolute paths and the
    end of a path is the part that says which folder.
    """
    if columns < 8:
        raise PrintableError(f"a column count of {columns} cannot hold anything")
    lines = []
    for paragraph in text.split("\n"):
        words = paragraph.split()
        if not words:
            lines.append("")
            continue
        current = ""
        for word in words:
            while len(word) > columns:
                if current:
                    lines.append(current)
                    current = ""
                lines.append(word[: columns - 1] + "-")
                word = word[columns - 1 :]
            candidate = f"{current} {word}".strip()
            if len(candidate) <= columns:
                current = candidate
            else:
                lines.append(current)
                current = word
        if current:
            lines.append(current)
    return lines


def _columns(size, indent):
    """How many Courier glyphs fit one line at this size. Derived, never typed."""
    usable = PAGE_WIDTH - (2 * MARGIN) - indent
    return max(8, int(usable // (size * COURIER_EM)))


def _lay_out(blocks):
    """`[(style, text)]` into `[[(x, y, font, size, bytes)]]`, one list per page."""
    pages = [[]]
    y = PAGE_HEIGHT - MARGIN
    floor = MARGIN + 24.0  # room for the footer

    for style, text in blocks:
        if style not in STYLES:
            raise PrintableError(f"there is no style called {style!r}")
        font, size, leading, indent, prefix = STYLES[style]
        if style == "blank":
            y -= leading
            continue
        body = transliterate(str(text))
        columns = _columns(size, indent + (len(prefix) * size * COURIER_EM))
        for index, line in enumerate(wrap(body, columns)):
            shown = (prefix if index == 0 else " " * len(prefix)) + line
            if y - leading < floor:
                pages.append([])
                y = PAGE_HEIGHT - MARGIN
            y -= leading
            pages[-1].append((MARGIN + indent, y, font, size, to_winansi(shown)))
    return pages


# ── the file ──────────────────────────────────────────────────────────────────


def _escape(raw):
    """PDF string escaping. Three characters, and all three really happen."""
    return raw.replace(b"\\", b"\\\\").replace(b"(", b"\\(").replace(b")", b"\\)")


def _content(page, number, total):
    parts = [b"BT\n"]
    for x, y, font, size, raw in page:
        parts.append(f"/{font} {size:g} Tf\n1 0 0 1 {x:.2f} {y:.2f} Tm\n".encode("ascii"))
        parts.append(b"(" + _escape(raw) + b") Tj\n")
    footer = to_winansi(f"page {number} of {total}")
    parts.append(
        f"/F1 8 Tf\n1 0 0 1 {MARGIN:.2f} {MARGIN - 12:.2f} Tm\n".encode("ascii")
    )
    parts.append(b"(" + _escape(footer) + b") Tj\n")
    parts.append(b"ET\n")
    return b"".join(parts)


def render_pdf(blocks):
    """`[(style, text)]` -> the bytes of a PDF. ⛔ Uncompressed and inspectable.

    Deliberately readable when opened in a text editor: this is a project whose
    output may be examined, and a stream somebody cannot read without a tool is a
    stream they have to take on trust.
    """
    pages = _lay_out(blocks)
    total = len(pages)

    # 1 catalog · 2 pages · 3 Courier · 4 Courier-Bold · then page, content, …
    objects = {
        1: b"<< /Type /Catalog /Pages 2 0 R >>",
        3: b"<< /Type /Font /Subtype /Type1 /BaseFont /Courier "
        b"/Encoding /WinAnsiEncoding >>",
        4: b"<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold "
        b"/Encoding /WinAnsiEncoding >>",
    }
    page_ids = []
    next_id = 5
    for index, page in enumerate(pages, start=1):
        page_id, content_id = next_id, next_id + 1
        next_id += 2
        page_ids.append(page_id)
        stream = _content(page, index, total)
        objects[page_id] = (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_WIDTH:g} "
            f"{PAGE_HEIGHT:g}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> "
            f"/Contents {content_id} 0 R >>"
        ).encode("ascii")
        objects[content_id] = (
            f"<< /Length {len(stream)} >>\nstream\n".encode("ascii")
            + stream
            + b"endstream"
        )
    kids = b" ".join(f"{pid} 0 R".encode("ascii") for pid in page_ids)
    objects[2] = b"<< /Type /Pages /Kids [" + kids + b"] /Count " + str(total).encode() + b" >>"

    out = bytearray(b"%PDF-1.4\n")
    offsets = {}
    for obj_id in sorted(objects):
        offsets[obj_id] = len(out)
        out += f"{obj_id} 0 obj\n".encode("ascii") + objects[obj_id] + b"\nendobj\n"

    # ⚠️ The xref offsets are BYTE positions into this exact buffer, so they are
    # recorded as the buffer is built rather than computed afterwards. Computing
    # them a second way is how a PDF ends up opening in one reader and not another.
    start = len(out)
    highest = max(objects)
    out += f"xref\n0 {highest + 1}\n".encode("ascii")
    out += b"0000000000 65535 f \n"
    for obj_id in range(1, highest + 1):
        if obj_id in offsets:
            out += f"{offsets[obj_id]:010d} 00000 n \n".encode("ascii")
        else:
            out += b"0000000000 65535 f \n"
    out += (
        f"trailer\n<< /Size {highest + 1} /Root 1 0 R >>\nstartxref\n{start}\n"
    ).encode("ascii")
    out += b"%%EOF\n"
    return bytes(out)


# ── the writer's own checks ───────────────────────────────────────────────────


def selfcheck():
    """Prove the refusal fires and the structure holds. Returns a note list."""
    notes = []

    # 1. The refusal is reachable. ⛔ Planted, because a check that has never been
    #    seen to fail is a check nobody knows the shape of.
    try:
        render_pdf([("body", "a bell: ॐ")])
    except PrintableError as exc:
        if "U+0950" not in str(exc):
            raise PrintableError("the refusal does not name the character it refused")
        notes.append("refuses an unmappable character, naming it")
    else:
        raise PrintableError("an unmappable character was written anyway")

    # 2. Every marker this project uses survives as WORDS.
    for glyph, word in TRANSLITERATE:
        got = transliterate(f"{glyph} something")
        if word.strip() not in got:
            raise PrintableError(f"{glyph!r} did not become {word!r}: {got!r}")
    notes.append(f"transliterates {len(TRANSLITERATE)} marker glyph(s) to words")

    # 3. A real document, with the structure a reader needs to open it.
    # ⚠️ Big enough to really overflow, computed rather than guessed: the first
    # fixture here was 1800 characters and produced one page, so the multi-page
    # assertion below passed nothing while looking like it passed something.
    per_page = int((PAGE_HEIGHT - (2 * MARGIN)) // STYLES["body"][2]) * 80
    blocks = [("title", "What to do"), ("item", "x" * 400), ("body", "y " * per_page)]
    data = render_pdf(blocks)
    for needed in (b"%PDF-1.4", b"/Type /Catalog", b"xref", b"trailer", b"%%EOF"):
        if needed not in data:
            raise PrintableError(f"the file has no {needed!r}")

    # 4. 🔴 THE XREF OFFSETS REALLY POINT AT THE OBJECTS. This is the one defect
    #    that produces a file some readers open and others reject, and it cannot be
    #    seen by eye.
    tail = data.rsplit(b"startxref\n", 1)[1]
    start = int(tail.split(b"\n")[0])
    if not data[start:].startswith(b"xref"):
        raise PrintableError("startxref does not point at the xref table")
    # ⚠️ `[2:]` drops `xref` and the `0 N` header, so the first row left is object
    # ZERO's free entry — hence numbering from 0. Getting this wrong made the check
    # compare object 2's offset against object 1's bytes and report a corrupt file
    # that was fine, which is the false red that teaches people to delete a check.
    rows = data[start:].split(b"\n")[2:]
    checked = 0
    for number, row in enumerate(rows):
        if len(row) != 19 or not row.endswith(b" n "):
            continue
        at = int(row[:10])
        if not data[at:].startswith(f"{number} 0 obj".encode("ascii")):
            raise PrintableError(f"xref row {number} points at {data[at:at + 20]!r}")
        checked += 1
    if checked < 5:
        raise PrintableError(f"only {checked} xref row(s) checked, so this proves little")
    notes.append(f"{checked} xref offset(s) verified against the objects they name")

    pages = data.count(b"/Type /Page\n") + data.count(b"/Type /Page ")
    if pages < 2:
        raise PrintableError(f"400 and 1800 characters produced {pages} page(s)")
    notes.append(f"{len(data)} bytes, {pages} page(s), no compression")
    return notes


if __name__ == "__main__":
    for note in selfcheck():
        print(f"printable: {note}")
    print("printable: ✅ all checks passed")

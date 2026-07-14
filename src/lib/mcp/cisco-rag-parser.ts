/**
 * Pure parsers for Cisco RAG markdown — no Node-only imports, safe to bundle
 * into client components.
 *
 * Split out from cisco-rag.ts because that module uses `require("node:fs")` for
 * disk caching, and client components (which use the parser) cannot resolve
 * `node:fs` in webpack. Keep all parse logic here, keep network/cache code in
 * cisco-rag.ts. Both modules can import these freely.
 */

export interface LicenseTier {
  /** "Network Essentials", "Network Advantage", "Cisco DNA Essentials", etc. */
  name: string;
  /** "Perpetual License", "Term-based License", parenthetical hint, or empty. */
  qualifier?: string;
  /**
   * Real feature bullets — only lines that match `Category: details`. The UI
   * groups these into icon-tagged cards, one per category.
   */
  features: string[];
  /**
   * Lifted from `Includes all <baseline> features plus:` lines. When present,
   * the UI renders "Adds N capabilities on top of <baseline>" instead of
   * showing the awkward meta-statement as a feature card.
   */
  baseline?: string;
  /**
   * Non-feature bullets that aren't a baseline either — disclaimers, bonus
   * entitlements ("Includes a 3-year limited term…"), or stray prose. The UI
   * renders these as a quiet footer banner below the feature grid.
   */
  notes: string[];
  /** Heuristic kind, used to color the tier button. */
  kind: "essentials" | "advantage" | "dna-essentials" | "dna-advantage" | "other";
}

export interface ParsedLicenseTiers {
  intro?: string;
  tiers: LicenseTier[];
  outro?: string;
}

/**
 * Lightweight reference link extractor — picks up `[N](url)` entries in the
 * `**Reference Document Links:**` trailer block. Used by client components that
 * need to render sources without pulling in the full DocsHighlights parser
 * (which lives next to a Node-only fs require).
 */
export interface ParsedReference {
  index: number;
  title: string;
  url: string;
}

export function parseReferenceLinks(raw: string): ParsedReference[] {
  if (!raw) return [];
  const refs: ParsedReference[] = [];
  const headerMatch = raw.match(/\*\*Reference Document Links:?\*\*|Reference Document Links:/i);
  if (!headerMatch || typeof headerMatch.index !== "number") return [];
  const refSection = raw.slice(headerMatch.index + headerMatch[0].length);
  const refRe = /(\d+)\.\s*\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = refRe.exec(refSection)) !== null) {
    refs.push({ index: Number(m[1]), title: m[2].trim(), url: m[3].trim() });
  }
  return refs;
}

/**
 * One parsed markdown table — header strings + a 2D array of row cells.
 * Used by the SkuVariantsTable on portfolio detail pages.
 */
export interface ParsedTable {
  headers: string[];
  rows: string[][];
}

/**
 * Lift markdown tables out of a free-form RAG / Docs answer. RAG often emits
 * SKU / configuration / spec data as `| col | col |` GitHub-flavored tables;
 * this returns every such table in order.
 *
 * The parser is lenient:
 *   - Accepts both `| col |` and `col | col` (with or without leading/trailing pipes)
 *   - Skips the `|---|---|` separator row by detecting cells with only dashes/spaces/colons
 *   - Strips inline `**bold**` markers around cell values (RAG sometimes emphasizes SKU codes)
 *   - Tolerates the leading `**Table N:**` style markdown headers used by some Cisco responses
 *   - Drops tables with <2 columns or <1 data row (likely false positives from bullet lists)
 */
export function parseMarkdownTables(raw: string): ParsedTable[] {
  if (!raw) return [];
  const lines = raw.split(/\r?\n/);
  const tables: ParsedTable[] = [];
  let cursor = 0;
  while (cursor < lines.length) {
    const line = lines[cursor];
    if (!isTableRow(line)) {
      cursor++;
      continue;
    }
    // Found a candidate row. The next non-blank line must be a separator row
    // (something like `|---|---|---|`) for this to be a real markdown table.
    const headerCells = splitTableRow(line);
    let sepIdx = cursor + 1;
    while (sepIdx < lines.length && lines[sepIdx].trim() === "") sepIdx++;
    if (sepIdx >= lines.length || !isSeparatorRow(lines[sepIdx])) {
      cursor++;
      continue;
    }
    // Walk forward collecting data rows until we hit a non-row line.
    const rows: string[][] = [];
    let i = sepIdx + 1;
    while (i < lines.length && isTableRow(lines[i])) {
      const cells = splitTableRow(lines[i]);
      // Pad short rows + trim long rows so the table is rectangular.
      const normalized = headerCells.map((_, idx) => (cells[idx] ?? "").trim());
      // Skip completely empty rows.
      if (normalized.some((c) => c.length > 0)) rows.push(normalized);
      i++;
    }
    if (headerCells.length >= 2 && rows.length >= 1) {
      tables.push({
        headers: headerCells.map((h) => stripBoldMarkers(h.trim())),
        rows: rows.map((r) => r.map((c) => stripBoldMarkers(c)))
      });
    }
    cursor = i;
  }
  return tables;
}

function isTableRow(line: string): boolean {
  const t = line.trim();
  // Must contain at least one pipe and at least 2 segments after splitting.
  if (!t.includes("|")) return false;
  // Strip leading/trailing pipes for the count.
  const inner = t.replace(/^\|/, "").replace(/\|$/, "");
  return inner.split("|").length >= 2;
}

function isSeparatorRow(line: string): boolean {
  const t = line.trim();
  if (!t.includes("|")) return false;
  const cells = splitTableRow(t);
  return cells.length >= 2 && cells.every((c) => /^:?-{2,}:?$/.test(c.trim()));
}

function splitTableRow(line: string): string[] {
  const t = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return t.split("|").map((c) => c.trim());
}

function stripBoldMarkers(s: string): string {
  // Remove leading + trailing ** that wrap an entire cell, plus any inline ones.
  return s.replace(/\*\*/g, "").trim();
}

export function parseLicenseTiers(raw: string): ParsedLicenseTiers {
  if (!raw) return { tiers: [] };

  // Strip the Reference Document Links section so it doesn't get folded into the outro.
  let body = raw;
  const refHeaderMatch = body.match(/\*\*Reference Document Links:?\*\*|Reference Document Links:/i);
  if (refHeaderMatch && typeof refHeaderMatch.index === "number") {
    body = body.slice(0, refHeaderMatch.index).trimEnd();
  }

  const lines = body.split(/\r?\n/);

  //   "**1. Network Essentials (Perpetual License)**"
  //   "**Network Advantage (Perpetual License)**"
  //   "**Network Advantage Perpetual License**"
  const headingRe = /^\s*\*\*\s*(?:\d+\.\s*)?([^*]+?)\s*\*\*\s*$/;
  const bulletRe = /^\s*(?:[-*•]|\d+[.)])\s+(.+)$/;

  const introLines: string[] = [];
  const outroLines: string[] = [];
  const tiers: LicenseTier[] = [];
  let current: LicenseTier | null = null;
  let phase: "intro" | "tiers" | "outro" = "intro";

  /**
   * Classify a bullet text into one of:
   *   - {kind:"baseline", value:"Network Essentials"}   from "Includes all Network Essentials features plus:"
   *   - {kind:"note", text}                              from "Includes a 3-year limited term...", "Bundled at no extra cost", etc.
   *   - {kind:"feature", line}                           everything else \u2014 with OR without a `Category:` prefix
   *
   * The earlier version required a strict `^[A-Z][\w ...]:\s+` prefix for
   * features, which dropped legitimate bullets like "LAN Automation for
   * error-free underlay network..." into notes by mistake. Now notes are
   * limited to true meta-statements: lines that start with "Includes" (other
   * than the baseline pattern) or "Bundled"/"Complementary" entitlement
   * language. Everything else renders as a feature card; the feature parser
   * downstream gracefully handles missing categories by showing body-only.
   */
  const classifyBullet = (
    bulletText: string
  ):
    | { kind: "baseline"; value: string }
    | { kind: "feature"; line: string }
    | { kind: "note"; text: string } => {
    // 1. Strip inline numbered citations.
    // 2. RAG often emits bullets like `**Switching:** body` — unwrap the bold
    //    markers around the leading category label so downstream feature parsers
    //    (which expect `Category: body`) see a clean prefix. Without this every
    //    bold-prefixed bullet fell into the "loose" bucket and rendered as a
    //    single packed run-on row instead of one row per category.
    let clean = stripInlineCitations(bulletText.trim());
    clean = clean.replace(/^\*\*\s*([^*]+?)\s*\*\*\s*[:—–-]?\s*/, (_full, cat: string) => {
      const trimmed = cat.trim().replace(/:\s*$/, "");
      return trimmed ? `${trimmed}: ` : "";
    });
    // Baseline detection — matches both common wordings:
    //   "Includes all Network Essentials features plus:"      (older RAG output)
    //   "Includes all features of Network Essentials plus:"   (newer RAG variant)
    // Both lift the named tier to `baseline` so the UI shows "adds N on top of X"
    // instead of rendering this meta-statement as a feature row.
    const baseline =
      clean.match(/^Includes all\s+(.+?)\s+features?\s+plus[:.]?\s*$/i) ||
      clean.match(/^Includes all\s+features?\s+of\s+(.+?)\s+plus[:.]?\s*$/i);
    if (baseline) return { kind: "baseline", value: baseline[1].trim() };
    // Recognize "Includes all <X> features" / "Same as <X>" inside a tier body
    // as a note (cross-reference) instead of a real feature line.
    if (/^(includes\s+all\s+.+\s+features|same as\s+)/i.test(clean)) {
      return { kind: "note", text: clean };
    }
    if (/^(includes\s+(?:a|an|the|\d)|bundled|complementary|comes with|offered as|provided at)\b/i.test(clean)) {
      return { kind: "note", text: clean };
    }
    return { kind: "feature", line: clean };
  };

  const pushBulletToCurrent = (bulletText: string, leadingIndent = 0) => {
    if (!current) return;
    const c = classifyBullet(bulletText);
    if (c.kind === "baseline") {
      if (!current.baseline) current.baseline = c.value;
      return;
    }
    if (c.kind === "note") {
      current.notes.push(c.text);
      return;
    }

    // RAG often emits a "header bullet" with only a category and no body,
    // followed by an indented sub-bullet with the actual content. Example:
    //   - **Switching:**
    //     - IEEE 802.1Q, 802.1w, ...
    // The first bullet's body is just "Switching:" (or empty) — useless on
    // its own. Merge the next indented bullet into it instead of producing
    // two rows: an empty "Switching:" header + a categoryless standalone
    // line that fell into the loose bucket.
    const isCategoryHeader = /^[A-Z][\w \-/()&+]{2,40}:\s*$/.test(c.line);
    const lastFeature = current.features[current.features.length - 1];
    const lastIsCategoryHeader =
      lastFeature !== undefined && /^[A-Z][\w \-/()&+]{2,40}:\s*$/.test(lastFeature);

    if (leadingIndent >= 2 && lastIsCategoryHeader) {
      // Indented continuation of the previous category header. Glue them
      // together so parseFeatureLine downstream can split on the colon and
      // render one clean row per category.
      current.features[current.features.length - 1] = `${lastFeature.trim()} ${c.line}`.trim();
      return;
    }

    if (isCategoryHeader && lastIsCategoryHeader) {
      // Two header bullets in a row (RAG sometimes emits an empty category).
      // Replace the previous empty header rather than stacking dead rows.
      current.features[current.features.length - 1] = c.line;
      return;
    }

    current.features.push(c.line);
  };

  const finalize = () => {
    if (current && (current.features.length > 0 || current.notes.length > 0 || current.baseline)) {
      tiers.push(current);
    }
    current = null;
  };

  for (const rawLine of lines) {
    const line = rawLine;
    const trimmed = line.trim();
    if (!trimmed) continue;

    const h = trimmed.match(headingRe);
    if (h) {
      const text = h[1].trim();
      // Only accept tier-ish headings — avoids accidentally turning prose bold text into a tier.
      if (/essential|advantage|perpetual|subscription|term|license|tier|premier|standard|premium/i.test(text)) {
        finalize();
        phase = "tiers";
        const { name, qualifier, kind } = splitTierHeading(text);
        current = { name, qualifier, features: [], notes: [], kind };
        continue;
      }
      // Non-tier bold heading (e.g. "**Additional Notes:**") — terminates the
      // current tier and switches us into outro phase so trailing meta-prose
      // doesn't get attached as a feature bullet.
      finalize();
      phase = "outro";
      continue;
    }

    const b = trimmed.match(bulletRe);
    if (b && current) {
      // Measure raw leading whitespace to detect indented sub-bullets.
      const indent = (line.match(/^(\s*)[-*•\d]/) || ["", ""])[1].length;
      pushBulletToCurrent(b[1], indent);
      continue;
    }

    // Bullets after the last tier closed (outro phase) — fold into outro prose
    // rather than dropping them. This keeps the "Notes:" / disclaimer block
    // attached to the page somewhere instead of vanishing.
    if (b && phase === "outro") {
      outroLines.push(stripInlineCitations(b[1].trim()));
      continue;
    }

    // Indented continuation of last bullet — only meaningful if we currently
    // have at least one feature line we can extend.
    if (current && current.features.length > 0 && line.match(/^\s{2,}\S/)) {
      const cont = stripInlineCitations(trimmed);
      if (cont) {
        current.features[current.features.length - 1] =
          current.features[current.features.length - 1] + " " + cont;
      }
      continue;
    }

    if (phase === "intro" && !current) {
      introLines.push(trimmed);
    } else if (phase === "tiers" && !current) {
      phase = "outro";
      outroLines.push(trimmed);
    } else if (phase === "outro") {
      outroLines.push(trimmed);
    } else if (current) {
      // Prose attached to a current tier. Two paths:
      //
      // 1. The tier ALREADY has bullets AND this prose looks like a meta /
      //    disclaimer paragraph ("These licenses require...", "This feature
      //    structure applies...", "Reference:", "Note:") — that means we've
      //    fallen off the end of the tier's bullet block into outro prose.
      //    Finalize the tier and switch to outro so we don't dump the entire
      //    disclaimer block as a single CAPABILITIES row.
      //
      // 2. Otherwise (tier is empty OR prose looks like a real feature) —
      //    route through the classifier so it becomes a feature/note. This
      //    preserves the case where RAG puts feature text directly under a
      //    heading without a bullet marker.
      const hasContent =
        current.features.length > 0 || current.notes.length > 0 || !!current.baseline;
      const looksLikeOutro = /^(these\s+licenses?\b|this\s+(feature|table|table\s+summarizes|guide|summary|comparison|page)\b|reference[s:]?\s*$|note[s:]?\s*$|see\s+(also|the\b)|for\s+more\s+(details|information)|disclaimer\b|note\s*[:\u2014\u2013-])/i.test(trimmed);
      if (hasContent && looksLikeOutro) {
        finalize();
        phase = "outro";
        outroLines.push(trimmed);
      } else {
        pushBulletToCurrent(trimmed);
      }
    } else {
      introLines.push(trimmed);
    }
  }
  finalize();

  return {
    intro: stripInlineCitations(introLines.join(" ").trim()) || undefined,
    tiers,
    outro: stripInlineCitations(outroLines.join(" ").trim()) || undefined
  };
}

function splitTierHeading(text: string): {
  name: string;
  qualifier?: string;
  kind: LicenseTier["kind"];
} {
  const m = text.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  let name = (m ? m[1] : text).trim();
  const qualifier = m ? m[2].trim() : undefined;

  name = name.replace(/[\s\-:]+$/, "").trim();
  name = name.replace(/^\d+[.)]\s*/, "");

  const lower = name.toLowerCase();
  let kind: LicenseTier["kind"] = "other";
  if (/dna\s+advantage|dna-?advantage/i.test(lower)) kind = "dna-advantage";
  else if (/dna\s+essentials|dna-?essentials/i.test(lower)) kind = "dna-essentials";
  else if (/network\s+advantage|network-?advantage|advantage$/i.test(lower)) kind = "advantage";
  else if (/network\s+essentials|network-?essentials|essentials$/i.test(lower)) kind = "essentials";

  return { name, qualifier, kind };
}

function stripInlineCitations(text: string): string {
  return text
    .replace(/\[\d+\]\((?:https?:\/\/[^)]+)\)/g, "")
    .replace(/\[\d+\]/g, "")
    .replace(/\s+,/g, ",")
    .replace(/,\s*\./g, ".")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+\./g, ".")
    .trim();
}

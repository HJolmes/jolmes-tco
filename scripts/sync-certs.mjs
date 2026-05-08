#!/usr/bin/env node
// Crawlt jolmes.de/zertifikate/, lädt verlinkte PDFs nach public/zertifikate/,
// extrahiert per pdftotext Cert-Typ / Geltungsbereich (Firma) / Ablaufdatum
// und schreibt public/zertifikate/index.json. Manuelle Mappings aus
// scripts/cert-overrides.json überschreiben/ergänzen die Auto-Erkennung.
//
// Schreibt eine stabile syncedAt: das Datum ändert sich nur, wenn sich der
// Inhalt der entries-Liste geändert hat — sonst kein Diff, kein Commit.

import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC_DIR = join(ROOT, 'public', 'zertifikate');
const INDEX_FILE = join(PUBLIC_DIR, 'index.json');
const OVERRIDES_FILE = join(__dirname, 'cert-overrides.json');

const CERT_PAGE = 'https://jolmes.de/zertifikate/';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

const CERT_PATTERNS = [
  { id: 'iso9001',    label: 'DIN EN ISO 9001 (Qualität)',                 keywords: ['ISO 9001'] },
  { id: 'iso14001',   label: 'DIN EN ISO 14001 (Umwelt)',                  keywords: ['ISO 14001'] },
  { id: 'amsbgbau',   label: 'AMS BG Bau (Arbeitsschutz)',                 keywords: ['AMS BAU', 'AMS BG BAU', 'BG BAU'] },
  { id: 'dguv201028', label: 'DGUV 201-028 (Schimmelsanierung)',           keywords: ['DGUV 201-028', 'DGUV-INFORMATION 201-028', '201-028'] },
  { id: 'asbest',     label: 'TRGS 519 / Asbest-Sachkunde',                keywords: ['TRGS 519', 'TRGS-519', 'ASBEST'] },
  { id: 'meister',    label: 'Meisterbetrieb',                             keywords: ['MEISTERBETRIEB', 'MEISTERBRIEF'] },
  { id: 'innung',     label: 'Innungsmitglied (Gebäudereiniger-Innung)',   keywords: ['INNUNG', 'INNUNGSMITGLIED'] },
];

const FIRMA_PATTERNS = [
  { id: 'gebaeudereinigung', regex: /Jolmes\s+Geb[äa]udereinigung/i },
  { id: 'handwerk',          regex: /Jolmes\s+Handwerk/i },
  { id: 'energie',           regex: /Jolmes\s+Energie/i },
];

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'de-DE,de;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function fetchPdf(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept': 'application/pdf,*/*;q=0.8' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function extractPdfLinks(html, baseUrl) {
  const set = new Set();
  for (const m of html.matchAll(/href=["']([^"']+\.pdf[^"']*)["']/gi)) {
    let u = m[1];
    if (u.startsWith('//')) u = 'https:' + u;
    else if (u.startsWith('/')) {
      const b = new URL(baseUrl);
      u = `${b.protocol}//${b.host}${u}`;
    } else if (!/^https?:/i.test(u)) {
      try { u = new URL(u, baseUrl).toString(); } catch { continue; }
    }
    set.add(u);
  }
  return [...set];
}

function pdftotext(pdfPath) {
  return new Promise((resolve, reject) => {
    const proc = spawn('pdftotext', ['-layout', '-enc', 'UTF-8', pdfPath, '-']);
    let out = '', err = '';
    proc.stdout.on('data', d => out += d);
    proc.stderr.on('data', d => err += d);
    proc.on('error', reject);
    proc.on('close', code => {
      if (code !== 0) reject(new Error(`pdftotext exited ${code}: ${err}`));
      else resolve(out);
    });
  });
}

function detectCertType(text) {
  const upper = text.toUpperCase();
  for (const c of CERT_PATTERNS) {
    if (c.keywords.some(k => upper.includes(k))) return c;
  }
  return null;
}

function detectFirmen(text) {
  return FIRMA_PATTERNS.filter(f => f.regex.test(text)).map(f => f.id);
}

// Sucht das LETZTE Datum, das nach einem Gültigkeits-/Ablauf-Schlüsselwort steht
// (deutsche & englische Varianten). Liefert ISO-Format YYYY-MM-DD oder null.
function detectGueltigBis(text) {
  const candidates = [];
  // gültig bis 31.12.2026
  for (const m of text.matchAll(/g[üu]ltig\s+bis\s*[:\-]?\s*(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})/gi)) {
    candidates.push(toIso(m[3], m[2], m[1]));
  }
  // valid until 2026-12-31
  for (const m of text.matchAll(/valid\s+(?:until|to|through)\s*[:\-]?\s*(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/gi)) {
    candidates.push(toIso(m[1], m[2], m[3]));
  }
  // valid until 31/12/2026
  for (const m of text.matchAll(/valid\s+(?:until|to|through)\s*[:\-]?\s*(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/gi)) {
    candidates.push(toIso(m[3], m[2], m[1]));
  }
  // Ablaufdatum 31.12.2026
  for (const m of text.matchAll(/Ablauf(?:datum)?\s*[:\-]?\s*(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})/gi)) {
    candidates.push(toIso(m[3], m[2], m[1]));
  }
  // Zertifikat gültig: 2024-12-31 (ISO)
  for (const m of text.matchAll(/g[üu]ltig\s*(?:bis)?\s*[:\-]?\s*(\d{4})-(\d{2})-(\d{2})/gi)) {
    candidates.push(toIso(m[1], m[2], m[3]));
  }
  if (candidates.length === 0) return null;
  // Plausibel: Datum darf nicht in ferner Vergangenheit liegen; nimm das spätere
  const valid = candidates.filter(d => d && d >= '2000-01-01' && d <= '2099-12-31');
  if (valid.length === 0) return null;
  valid.sort();
  return valid[valid.length - 1];
}

function toIso(y, m, d) {
  if (!y || !m || !d) return null;
  if (y.length === 2) y = (parseInt(y, 10) > 50 ? '19' : '20') + y;
  return `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function safeFilename(url) {
  return basename(new URL(url).pathname).split('?')[0].replace(/[^A-Za-z0-9._-]/g, '_');
}

async function main() {
  await mkdir(PUBLIC_DIR, { recursive: true });

  const overrides = existsSync(OVERRIDES_FILE)
    ? JSON.parse(await readFile(OVERRIDES_FILE, 'utf8'))
    : [];

  let pdfLinks = [];
  let crawlError = null;
  try {
    const html = await fetchHtml(CERT_PAGE);
    pdfLinks = extractPdfLinks(html, CERT_PAGE);
    console.log(`✓ Fetched cert page (${html.length} bytes), ${pdfLinks.length} PDF link(s)`);
  } catch (e) {
    crawlError = String(e?.message || e);
    console.warn(`⚠ Could not fetch ${CERT_PAGE}: ${crawlError}`);
  }

  const downloaded = new Set();
  const autoEntries = [];
  for (const url of pdfLinks) {
    const filename = safeFilename(url);
    const filePath = join(PUBLIC_DIR, filename);
    try {
      const buf = await fetchPdf(url);
      await writeFile(filePath, buf);
      downloaded.add(filename);
      const text = await pdftotext(filePath);
      const cert = detectCertType(text);
      if (!cert) {
        console.log(`  · ${filename}: no cert pattern matched`);
        continue;
      }
      const firmen = detectFirmen(text);
      const gueltigBis = detectGueltigBis(text);
      autoEntries.push({
        id: cert.id,
        label: cert.label,
        firmen,
        gueltigBis,
        downloadUrl: `zertifikate/${filename}`,
        sourceUrl: url,
      });
      console.log(`  ✓ ${filename} → ${cert.id} (firmen=${firmen.join(',') || '?'}, gültig bis ${gueltigBis || '?'})`);
    } catch (e) {
      console.warn(`  ✗ ${url}: ${e?.message || e}`);
    }
  }

  // Merge: Overrides bilden die kanonische Liste (label, firmen). Auto-Funde
  // füllen downloadUrl + gueltigBis pro Cert-ID auf.
  const byId = new Map();
  for (const ov of overrides) byId.set(ov.id, { ...ov });
  for (const auto of autoEntries) {
    const existing = byId.get(auto.id) || { id: auto.id, label: auto.label, firmen: [] };
    byId.set(auto.id, {
      ...existing,
      // Wenn Override-Firmen gesetzt sind, gewinnen die. Sonst Auto-Erkennung.
      firmen: existing.firmen?.length ? existing.firmen : auto.firmen,
      downloadUrl: auto.downloadUrl,
      gueltigBis: auto.gueltigBis,
      sourceUrl: auto.sourceUrl,
    });
  }
  const entries = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));

  // Stale PDFs aufräumen: alles unter public/zertifikate/, das wir nicht mehr
  // referenzieren UND keine geschützte Datei ist (.gitkeep, index.json), löschen.
  const referenced = new Set([...downloaded, 'index.json', '.gitkeep']);
  for (const f of await readdir(PUBLIC_DIR)) {
    if (!referenced.has(f) && /\.pdf$/i.test(f)) {
      await unlink(join(PUBLIC_DIR, f));
      console.log(`  · removed stale ${f}`);
    }
  }

  // Stabile syncedAt: nur ändern, wenn sich entries tatsächlich geändert haben
  let prev = null;
  try { prev = JSON.parse(await readFile(INDEX_FILE, 'utf8')); } catch {}
  const entriesEqual = prev && JSON.stringify(prev.entries) === JSON.stringify(entries);
  const out = {
    syncedAt: entriesEqual ? prev.syncedAt : new Date().toISOString(),
    sourcePage: CERT_PAGE,
    crawlError,
    entries,
  };
  await writeFile(INDEX_FILE, JSON.stringify(out, null, 2) + '\n');
  console.log(`✓ Wrote ${INDEX_FILE} (${entries.length} entries, ${entriesEqual ? 'unchanged' : 'updated'})`);
}

main().catch(e => { console.error(e); process.exit(1); });

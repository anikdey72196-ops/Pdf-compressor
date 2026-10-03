# Graph Report - Compressed_pdf  (2026-10-03)

## Corpus Check
- 18 files · ~15,029 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 3, .css 1)

## Summary
- 180 nodes · 265 edges · 12 communities (10 shown, 2 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c8453394`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- config.js
- pdfToImg.js
- package.json
- app.js
- officeToPdf.js
- dependencies
- pdfToExcel.js
- compress.py
- imgToPdf.js
- bolt.md
- rules/graphify.md
- workflows/graphify.md

## God Nodes (most connected - your core abstractions)
1. `express` - 12 edges
2. `COMPRESSED_DIR` - 12 edges
3. `upload` - 6 edges
4. `pollProtectJobStatus()` - 5 edges
5. `isValidPdfHeader()` - 5 edges
6. `execGhostscript()` - 5 edges
7. `pdf-lib` - 4 edges
8. `runDiagnostics()` - 4 edges
9. `renderImgQueue()` - 4 edges
10. `UPLOADS_DIR` - 4 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (12 total, 2 thin omitted)

### Community 0 - "config.js"
Cohesion: 0.08
Nodes (29): ref_child_process, pdf-lib, express, fs, { jobs, upload, COMPRESSED_DIR, execGhostscript, getGsDiagnosticInfo, isValidPdfHeader }, path, router, execGhostscript() (+21 more)

### Community 1 - "pdfToImg.js"
Cohesion: 0.12
Nodes (15): adm-zip, express, UPLOADS_DIR, ALLOWED_EXTENSIONS, { COMPRESSED_DIR, UPLOADS_DIR }, express, fs, path (+7 more)

### Community 2 - "package.json"
Cohesion: 0.07
Nodes (30): author, description, keywords, license, main, name, optionalDependencies, @img/sharp-linux-x64 (+22 more)

### Community 3 - "app.js"
Cohesion: 0.21
Nodes (12): formatBytes(), handleUnlockFileSelect(), parseResponseJson(), pollProtectJobStatus(), removeItem(), renderImgQueue(), resetProtectUI(), runDiagnostics() (+4 more)

### Community 4 - "officeToPdf.js"
Cohesion: 0.14
Nodes (12): libreoffice-convert, ref_util, uploadOffice, express, fs, libre, libreConvert, path (+4 more)

### Community 5 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, adm-zip, docx, dotenv, exceljs, express, express-rate-limit, helmet (+5 more)

### Community 6 - "pdfToExcel.js"
Cohesion: 0.20
Nodes (9): exceljs, pdf-parse, ExcelJS, express, fs, path, pdfParse, router (+1 more)

### Community 7 - "compress.py"
Cohesion: 0.25
Nodes (8): compress_pdf(), find_ghostscript(), Compresses a PDF using Ghostscript. quality: 'screen' (72 dpi), 'ebook' (150…, Finds the Ghostscript executable on the system. Scans system PATH and common…, os, shutil, subprocess, sys

### Community 8 - "imgToPdf.js"
Cohesion: 0.10
Nodes (22): docx, ref_fs, ref_path, express, fs, path, router, { uploadImages, COMPRESSED_DIR } (+14 more)

### Community 9 - "bolt.md"
Cohesion: 0.40
Nodes (4): 2024-11-20 - Avoid Blocking the Event Loop in Periodic Tasks, 2024-11-21 - Async Sequential IO for Image Batching, 2026-07-20 - Fix Duplicate Logic Causing Syntax Error, 2026-08-29 - Non-blocking File Operations in Image to Word Route

## Knowledge Gaps
- **109 isolated node(s):** `name`, `version`, `description`, `main`, `start` (+104 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 125 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `express` connect `pdfToImg.js` to `config.js`, `package.json`, `officeToPdf.js`, `pdfToExcel.js`, `imgToPdf.js`?**
  _High betweenness centrality (0.154) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `COMPRESSED_DIR` connect `imgToPdf.js` to `config.js`, `pdfToImg.js`, `package.json`, `officeToPdf.js`, `pdfToExcel.js`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _109 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `config.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08021390374331551 - nodes in this community are weakly interconnected._
- **Should `pdfToImg.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06653225806451613 - nodes in this community are weakly interconnected._
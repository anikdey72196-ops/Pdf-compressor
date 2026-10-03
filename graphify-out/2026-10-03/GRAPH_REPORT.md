# Graph Report - Compressed_pdf  (2026-10-03)

## Corpus Check
- 18 files · ~14,144 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 3, .css 1)

## Summary
- 166 nodes · 245 edges · 12 communities (10 shown, 2 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c8453394`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- compressPdf.js
- config.js
- package.json
- app.js
- officeToPdf.js
- dependencies
- pdfToImg.js
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
5. `execGhostscript()` - 5 edges
6. `pdf-lib` - 4 edges
7. `runDiagnostics()` - 4 edges
8. `renderImgQueue()` - 4 edges
9. `UPLOADS_DIR` - 4 edges
10. `jobs` - 4 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (12 total, 2 thin omitted)

### Community 0 - "compressPdf.js"
Cohesion: 0.10
Nodes (21): express, express, fs, { jobs, upload, COMPRESSED_DIR, execGhostscript, getGsDiagnosticInfo }, path, router, execGhostscript(), getGsDiagnosticInfo() (+13 more)

### Community 1 - "config.js"
Cohesion: 0.10
Nodes (21): ref_child_process, multer, ref_path, fs, isGsInstalled, multer, path, { spawn } (+13 more)

### Community 2 - "package.json"
Cohesion: 0.08
Nodes (23): author, description, keywords, license, main, name, scripts, dev (+15 more)

### Community 3 - "app.js"
Cohesion: 0.21
Nodes (12): formatBytes(), handleUnlockFileSelect(), parseResponseJson(), pollProtectJobStatus(), removeItem(), renderImgQueue(), resetProtectUI(), runDiagnostics() (+4 more)

### Community 4 - "officeToPdf.js"
Cohesion: 0.15
Nodes (11): ref_util, uploadOffice, express, fs, libre, libreConvert, path, { PDFDocument, StandardFonts, rgb } (+3 more)

### Community 5 - "dependencies"
Cohesion: 0.17
Nodes (12): dependencies, adm-zip, docx, dotenv, express, @img/sharp-linux-x64, libreoffice-convert, multer (+4 more)

### Community 6 - "pdfToImg.js"
Cohesion: 0.25
Nodes (7): adm-zip, AdmZip, express, fs, path, router, { upload, UPLOADS_DIR, COMPRESSED_DIR, execGhostscript }

### Community 7 - "compress.py"
Cohesion: 0.25
Nodes (8): compress_pdf(), find_ghostscript(), Compresses a PDF using Ghostscript. quality: 'screen' (72 dpi), 'ebook' (150…, Finds the Ghostscript executable on the system. Scans system PATH and common…, os, shutil, subprocess, sys

### Community 8 - "imgToPdf.js"
Cohesion: 0.09
Nodes (22): docx, ref_fs, pdf-lib, express, fs, path, router, { uploadImages, COMPRESSED_DIR } (+14 more)

### Community 9 - "bolt.md"
Cohesion: 0.40
Nodes (4): 2024-11-20 - Avoid Blocking the Event Loop in Periodic Tasks, 2024-11-21 - Async Sequential IO for Image Batching, 2026-07-20 - Fix Duplicate Logic Causing Syntax Error, 2026-08-29 - Non-blocking File Operations in Image to Word Route

## Knowledge Gaps
- **101 isolated node(s):** `name`, `version`, `description`, `main`, `start` (+96 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 116 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `express` connect `compressPdf.js` to `config.js`, `package.json`, `officeToPdf.js`, `pdfToImg.js`, `imgToPdf.js`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `COMPRESSED_DIR` connect `imgToPdf.js` to `compressPdf.js`, `config.js`, `package.json`, `officeToPdf.js`, `pdfToImg.js`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _101 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compressPdf.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10144927536231885 - nodes in this community are weakly interconnected._
- **Should `config.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09666666666666666 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
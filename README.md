# DnD Group 2 Wiki: The Chronicles of Melody's Tempest

A modern static wiki for D&D session notes, built with **React**, **TypeScript**, and **Vite**, powered by a **Python** data pre-processing pipeline and served with **Nginx**.

---

## 🛠️ Architecture

* **Content Pipeline (`markdown_parse.py`):** Reads raw markdown notes from your campaign folder, filters out keywords (e.g. `secret`), parses markdown/inline elements, and generates `src/data/campaignData.json`.
* **Frontend (`src/`):** React + TypeScript single-page application (SPA) with Vite.
  * Fantasy parchment theme, typography (Cinzel & Lora), and paper texture overlay.
  * Instant client-side search across all arcs and sessions.
  * Interactive arc accordions with session counts.
  * In-session navigation (Previous / Next buttons, dropdown jump menu, and `←` / `→` arrow keys).
* **Containerization (`Dockerfile`):** Multi-stage Docker build that builds the React application and serves it through high-performance `nginx:alpine` with SPA route fallback.

---

## 🚀 Quick Start

### 1. Update Campaign Data from Notes
Whenever you update your campaign notes in Obsidian or Markdown:
```powershell
python3.11 markdown_parse.py
```
*(Optionally specify a custom path: `python3.11 markdown_parse.py "path/to/notes"`)*

### 2. Run Local Development Server
```powershell
npm run dev
```
Starts the Vite development server with Hot Module Replacement (HMR) at `http://localhost:5173`.

### 3. Build for Production
```powershell
npm run build
```
Typechecks via `tsc` and compiles optimized static assets into `dist/`.

### 4. Run via Docker
```powershell
docker build -t dnd-wiki-g2 .
docker run -p 8080:80 dnd-wiki-g2
```
Access the wiki in your browser at `http://localhost:8080`.

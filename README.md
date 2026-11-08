# POD Design Studio (State-Aware US Market)

> **A 100% Local Full-Stack Print-on-Demand (POD) Design & Realistic Mockup Studio tailored for the US Market (Military & Veteran Niches).**

Runs completely on `localhost`, stores generated master assets on your local filesystem, and features a secure **Bring Your Own Key (BYOK)** system for external AI model generation or an offline local procedural engine.

---

## 🌟 Key Features

### 🏛️ US State Cultural & Demographic Intelligence (50 States)
- Pre-populated local database covering all **50 US States** derived from **Census ACS & Pew Research**.
- **Demographics**: Population, Median Age, Gender %, Race/Ethnicity distributions.
- **Religion & Values**: Christian %, Evangelical %, Catholic %, Unaffiliated %.
- **Cultural & Heritage Emblems**: State symbols, official birds, state outlines, flags, mottos, and regional vibes.
- **Military Ties**: Major military installations (e.g., Fort Cavazos, Camp Lejeune, Parris Island, Nellis AFB, JBER, Norfolk Naval Station) and veteran population density per state.

### 🎨 Module 1: Artwork Generator (DTG Print-Ready Decals)
- **Prompt Synthesis**: Automatically fuses State Cultural Identity + Niche Keywords (Army, Navy, Air Force, Marines, Coast Guard, Veteran, Patriotic, 4th of July, Military Dad/Grandpa).
- **Strict Negative Prompts**: Injects anti-human, anti-mockup, anti-fold, and anti-blur rules to produce isolated artwork decals.
- **Background Removal**: Isolates decals with transparent background.
- **DTG Master Format**: Outputs **4500 &times; 5400 px, 300 DPI transparent PNG** ready for direct-to-garment (DTG) apparel printing.

### 👕 Module 2: Realistic Mockup Generator (Zero-Hallucination)
- **Zero-Hallucination Technical Constraint**: Guarantees that AI will **never** alter, regenerate, or hallucinate your artwork typography or emblems.
- **Realistic Fabric Displacement & Multiply Compositing**: Extracts underlying shirt wrinkles and folds to naturally shade and curve the decal onto the shirt.
- **Commercial Presentation**:
  - **Lifestyle Model**: State-specific lifestyle settings (e.g., Texas Hill Country Ranch, Suburban Midwest Porch, Rocky Mountain Pine Trail, Coastal Florida Marina).
  - **Flat-Lay Studio**: Clean apparel product shots.
  - **Commercial Ratios**: 4:5 commercial apparel lifestyle and 1:1 square.
  - **4 Classic POD Colors**: Black, Navy Heather, Military Green, and Sport Grey.

### 📦 Module 3: Generation History & One-Click ZIP Bundles
- Complete generation history viewer for transparent decals and mockups.
- **One-Click Export Bundle**: Downloads a single ZIP containing:
  - `ARTWORK_DTG_4500x5400_300DPI.png` (Transparent DTG Print Master)
  - Commercial Mockups (Front, Lifestyle, Flat-Lay)
  - `SEO_LISTING_METADATA.json` (Optimized Etsy Title, Amazon Merch Title, Shopify Title, Etsy 13 Tags, 5 Amazon Bullet Points, Print Specs)
  - `LISTING_COPY_PASTE.txt` (Instant copy-paste text for Printify, Printful, Etsy, or Shopify)

### 🔑 Bring Your Own Key (BYOK) Router
Configure external API keys directly from the Studio UI (`localStorage` persistence, no keys stored in Git):
- **Image Generation**: Fal.ai (Flux.1 Schnell/Dev), Replicate (Flux/SDXL), Google Gemini / Imagen 3, OpenAI (DALL-E 3).
- **Mockup / VTON**: Local High-Fidelity Compositor, FASHN.ai API, Fal.ai CatVTON.
- **Offline / Local Demo Engine**: Included out-of-the-box so you can test and use the software immediately without paid API keys!

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Backend**: Python 3.10+, FastAPI, Uvicorn, Pydantic v2, HTTPX, Pillow (PIL), NumPy, `rembg`, ONNX Runtime.
- **Database & Storage**: SQLite (`studio.db`), local JSON files for 50 US States demographic intelligence.
- **Local File System**: Output folders `./output/artworks/` and `./output/mockups/` with instant static preview mounts.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+ installed
- Node.js 18+ and npm installed

### 2. Automated 1-Click Launch (Windows)
Double-click:
```cmd
start-studio.bat
```
This automatically launches the FastAPI backend on port 8000 and the Next.js frontend on port 3000, and opens your browser to `http://localhost:3000`.

---

### 3. Manual Step-by-Step Launch

#### Step A: Backend Setup
```bash
# Navigate to project root
cd D:\TaoanhbangAI

# Create Python virtual environment (if not already created)
python -m venv backend\venv

# Activate virtual environment
# Windows:
backend\venv\Scripts\activate
# macOS/Linux:
source backend/venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Start the FastAPI server
python backend/run.py
```
Backend API will be running at **http://127.0.0.1:8000**
- Interactive API documentation: **http://127.0.0.1:8000/docs**

#### Step B: Frontend Setup
```bash
# Open a new terminal
cd D:\TaoanhbangAI\frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```
Frontend will be running at **http://localhost:3000**

---

## 🧭 How to Use

### 1. Create Artwork (Module 1)
1. In the **Left Column**, choose your target **US State** (e.g., Texas, North Carolina, Ohio). Notice the demographic intelligence card updates automatically.
2. Select a **Theme** (e.g., *Veteran*, *Army*, *Marines*, *Military Dad/Grandpa*).
3. Pick a **Design Style** (*Vintage Distressed*, *Bold Screen-Print*, *Retro Tactical*, etc.).
4. Select or edit the suggested **Slogan**.
5. In the **Middle Column**, inspect the real-time prompt. You can edit it manually or keep it auto-generated.
6. Click **GENERATE ARTWORK**.
7. In the **Right Column**, preview your isolated transparent decal on the checkerboard canvas, test it on different shirt colors, and click **Download DTG PNG** or **Create Mockup With This Design**.

### 2. Create Realistic Mockup (Module 2)
1. Click the **2. Create Mockup** tab.
2. Select your artwork from the dropdown.
3. Choose your **Garment Color** (Black, Navy Heather, Military Green, Sport Grey).
4. Choose **Presentation Type**:
   - *Lifestyle Model*: Select setting (*Texas Hill Country Ranch*, *Midwest Porch*, etc.), Gender, and Age bracket.
   - *Flat-Lay Studio*: Clean product shoot.
5. Select aspect ratio (**4:5** commercial apparel or **1:1** square).
6. Click **RENDER COMMERCIAL MOCKUP**.
7. Preview the photorealistic lifestyle result and download high-resolution photos for your online store.

### 3. Export POD Seller Bundles (Module 3)
1. Open the **History & Export** tab or drawer.
2. Click **Export ZIP Bundle** on any artwork.
3. Unzip to receive:
   - 4500x5400 px, 300 DPI transparent PNG.
   - All commercial mockups.
   - Complete Etsy title, description, and 13 tags.
   - Amazon Merch title and 5 bullet points.

---

## 📂 Project Architecture

```
d:\TaoanhbangAI\
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI server entry point, CORS, static mounts
│   │   ├── config.py                  # Directory paths, color definitions, constants
│   │   ├── database.py                # SQLite ORM & helpers (artworks, mockups, settings)
│   │   ├── data/
│   │   │   └── us_states.json         # 50 US States demographic, cultural & military dataset
│   │   ├── services/
│   │   │   ├── prompt_builder.py      # State-aware prompt synthesis & negative prompts
│   │   │   ├── ai_providers.py        # Fal.ai, Replicate, Gemini, OpenAI & procedural generator
│   │   │   ├── background_removal.py  # rembg & precision alpha cutout to 4500x5400 300 DPI
│   │   │   ├── mockup_engine.py       # Fabric displacement & multiply blend compositor
│   │   │   └── export_service.py      # ZIP bundle builder & SEO metadata generator
│   │   └── routers/
│   │       ├── states.py              # GET /api/states
│   │       ├── artwork.py             # POST /api/artwork/generate, /suggest-slogans
│   │       ├── mockup.py              # POST /api/mockup/generate, /presets
│   │       ├── settings.py            # POST /api/settings/verify
│   │       └── history.py             # GET /api/history, POST /export-bundle
│   ├── templates/                     # Blank POD garments & regional lifestyle base templates
│   ├── requirements.txt               # Backend Python dependencies
│   └── run.py                         # Startup script
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx             # Root layout with dark theme
│   │   │   ├── page.tsx               # Studio 3-Column main workspace
│   │   │   └── globals.css            # Tailwind & checkerboard CSS
│   │   ├── components/
│   │   │   ├── Header.tsx             # Navigation header & localhost status
│   │   │   ├── SettingsModal.tsx      # BYOK keys manager & live connection testers
│   │   │   ├── HistoryDrawer.tsx      # Past generations & one-click bundle exports
│   │   │   ├── artwork/
│   │   │   │   ├── StateDemographicsCard.tsx # Detailed census, faith & military cards
│   │   │   │   ├── ArtworkConfigPanel.tsx    # Left panel (State, Theme, Style, Slogan)
│   │   │   │   ├── PromptInspector.tsx       # Middle panel (Real-time prompt editor)
│   │   │   │   └── CanvasPreview.tsx         # Right panel (Checkerboard preview & zoom)
│   │   │   └── mockup/
│   │   │       ├── MockupConfigPanel.tsx     # Mockup parameters & model presets
│   │   │       └── MockupCanvasPreview.tsx   # Lifestyle preview & decal comparison
│   │   └── lib/
│   │       ├── api.ts                 # Backend API client
│   │       ├── storage.ts             # Browser localStorage BYOK manager
│   │       └── types.ts               # TypeScript interfaces
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── output/
│   ├── artworks/                      # Local 4500x5400 px DTG PNGs
│   └── mockups/                       # Local commercial mockups
├── start-studio.bat                   # 1-click launcher for Windows
├── start-backend.bat                  # Backend launcher
├── start-frontend.bat                 # Frontend launcher
└── README.md
```

---

## 🔒 Security & Privacy
- **Bring Your Own Key**: External AI keys are saved directly in your browser's private `localStorage`.
- **Zero Cloud Leakage**: Decals and mockups are rendered and stored **100% locally** in `./output/`.
- **No Third-Party Tracking**: All API requests communicate directly between your machine and official AI provider endpoints.


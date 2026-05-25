# TalentSphere: Cognitive Candidate Ranking Engine

TalentSphere is a premium, AI-driven Applicant Tracking System (ATS) and candidate evaluation dashboard. It replaces fragile keyword filters with multi-stage hybrid ranking—combining dense vector search, quantitative career trajectory scoring, and deep qualitative LLM analysis—delivering a recruiter-trusted shortlist.

![Glassmorphic Recruiter HUD Cockpit](https://lh3.googleusercontent.com/aida-public/AB6AXuDqiFzBD-ZNJPMFS2vyfiNhdzLomKywHLD0gIn5KJ3NeRLM6-gWqQpO9neXdPQTCOytEafy4iJpCYNGenrNnS6TW0gt_y2MPXE7j78RMbC-eO1jBD870ntaJZY5JHSpUsOE3_6s8zc1sF_dE-dLWSqSCLvepbge_pPOFWC5f8VJrIOV4fOU4J1oqGjf8T1E9e9tIGx9eIn-F1EpXSI26DIBs8GyFOBVvmrGjIPD_Qm9u6oamXiBEtw-Q3LpG2K-SaD0Vj2vxg1X-kw)

---

## 🚀 Key Architectural Features
- **In-Memory Multi-Format Parsing**: Decodes PDF, Word (`.doc`/`.docx`), Markdown, and plain text files strictly in-memory.
- **Section Partitioning**: Isolates lines sequentially into `HEADER`, `SUMMARY`, `SKILLS`, `EXPERIENCE`, and `EDUCATION` blocks, guaranteeing academic credentials never contaminate professional work experience.
- **Name-Designation Splitting**: Automatically splits candidate name and title at keyword boundaries (e.g. splits `Dandothkar Manik Prabhu` from `Senior Inside Sales Manager`).
- **3D Perspective Hologram Sweep Scanner**: Fully responsive glassmorphic nocturnal interface with vertical scanning sweeps and dynamic result-settle card animations.
- **Robust Local Uptime Fallback**: Safe local mathematical cosine-similarity buffers that sustain system operational health even when cloud third-party LLM endpoints are unreachable.

---

## 🛠️ Technology Stack
- **Backend API**: FastAPI, Pydantic, Uvicorn, Python.
- **Data & Vector Math**: NumPy, Cosine Metric, In-Memory Local Vector Index, Pinecone SDK support.
- **Document Extractors**: `pypdf` (native PDF binary parsing), `python-docx` (Word streams).
- **Frontend HUD**: React, Vite, Vanilla HSL CSS variables, custom 3D CSS transforms.
- **Completions & Vectors**: `gemini-embedding-2-preview` (3072 dimensions) and `gemini-3.5-flash` model scoring.

---

## 📁 Repository Structure
```
├── backend/
│   ├── main.py          # FastAPI application server & multipart binary ingestion routes
│   ├── parser.py        # Section-based fallback parser & LLM parser orchestrations
│   ├── ranker.py        # Hybrid ranking engine (Tenure, growth, target exp delta)
│   ├── vector_store.py  # Gemini Embedding v2 creator & local math/Pinecone store
│   ├── schemas.py       # Pydantic schemas (profiles, scores, descriptions)
│   └── test_engine.py   # Automated backend test suites
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Main HUD glassmorphism component (interactive details drawer)
│   │   ├── App.css      # Core component layout styles
│   │   ├── index.css    # Premium CSS design token system & 3D hologram keys
│   │   └── main.jsx     # Vite renderer entry point
│   ├── vite.config.js   # Vite configuration configurations
│   └── package.json     # Node script modules & packages
├── PRD.md               # Product Requirements Document
├── requirements.txt     # Python backend dependencies
└── README.md            # Sourcing director onboarding guide
```

---

## 🚦 Getting Started & Local Setup

### 1. Prerequisites
- **Python**: Python 3.8 to 3.11 installed.
- **NodeJS**: Node 18+ and `npm` installed.

---

### 2. Backend Installation & Start
Open a terminal in the root of the workspace directory:

```bash
# 1. Create a virtual environment
python -m venv venv

# 2. Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# 3. Install core dependencies
pip install -r requirements.txt

# 4. Set up environment configuration
# Ensure your EURI_API_KEY is configured in the .env file in the workspace root
```

Run the backend development reload server:
```bash
uvicorn backend.main:app --reload
```
The API documentation and active endpoints will be available at `http://127.0.0.1:8000/docs`.

---

### 3. Frontend Installation & Start
Open a separate terminal window in the `frontend` folder:

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install package modules
npm install

# 3. Launch Vite local dev HUD
npm run dev
```
Open your browser and navigate to `http://localhost:5173` to access the TalentSphere recruitment command dashboard.

---

## 🧪 Running Automated Tests
TalentSphere includes a rigorous mathematical unit test suite verifying parser fallbacks, vector similarities, career progression metrics, and final scoring loops.

Run the tests inside the virtual environment:
```bash
python -m unittest backend.test_engine
```
All 4 core test stages should return `OK`.

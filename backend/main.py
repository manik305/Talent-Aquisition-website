from fastapi import FastAPI, HTTPException, Body, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import logging
import io
from .schemas import CandidateProfile, JobDescription, RankedCandidate
from .parser import LLMParser
from .vector_store import VectorStore
from .ranker import HybridRanker

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TalentSphere.Main")

app = FastAPI(title="TalentSphere Cognitive Candidate Ranking Engine")

# Configure CORS for Vite Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development, allow Vite origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global in-memory storage for active Job Description
current_jd: Optional[JobDescription] = None

# Bootstrapping: Ingest pre-seeded, high-fidelity technical candidates for immediate evaluation
preseeded_candidates = [
    """
    Sarah Chen
    Email: sarah.chen@ai-atrium.io
    Phone: 555-019-3824
    Location: San Francisco, CA
    Skills: Python, FastAPI, Pinecone, React, Docker, Kubernetes, AWS, SQL, TypeScript
    
    Work Experience:
    - AI Solutions Lab | Lead Software Engineer
      Duration: 36 months (3 years)
      Description: Architected and scaled a distributed candidate search backend using FastAPI and Pinecone vector store, reducing latency by 45%. Promoted from Senior Engineer for leading high-throughput ingestion pipelines.
      Technologies: Python, FastAPI, Pinecone, AWS, Docker
      Role Growth: True
      
    - Quantum Systems Inc | Senior Engineer
      Duration: 24 months (2 years)
      Description: Built real-time analytical dashboards using React, TypeScript, and Python. Supervised a team of 4 junior engineers on clean coding and unit test suites.
      Technologies: React, TypeScript, Python, SQL, Docker
      Role Growth: True
      
    - Blue Ocean Software | Software Developer
      Duration: 36 months (3 years)
      Description: Optimized database queries and restructured REST APIs, increasing query speeds by 20%.
      Technologies: Python, SQL, JavaScript
      Role Growth: False
      
    Education:
    - University of California, Berkeley | BS in Computer Science | 2017
    """,
    """
    Marcus Knight
    Email: m.knight@cloudspace.co
    Phone: 555-014-9988
    Location: New York, NY
    Skills: Java, Spring Boot, AWS, SQL, Kubernetes, Redis, Docker, System Design
    
    Work Experience:
    - CloudSpace LLC | Senior Staff Architect
      Duration: 48 months (4 years)
      Description: Spearheaded the migration of monolithic financial operations into AWS serverless microservices. Designed high-availability ledger databases capable of 10k transactions per second.
      Technologies: Java, AWS, Spring Boot, Redis, Kubernetes
      Role Growth: True
      
    - Apex Financial Corp | Senior Backend Developer
      Duration: 30 months (2.5 years)
      Description: Re-engineered transaction processing logic, boosting computational efficiency by 30%.
      Technologies: Java, SQL, Spring Boot, Docker
      Role Growth: False
      
    Education:
    - Cornell University | MS in Software Engineering | 2019
    """,
    """
    Aria Lopez
    Email: aria.l@gradient.tech
    Phone: 555-901-4432
    Location: Seattle, WA
    Skills: Python, PyTorch, TensorFlow, FastAPI, Docker, SQL, Machine Learning, Transformers
    
    Work Experience:
    - Gradient Technologies | AI Research Engineer
      Duration: 18 months (1.5 years)
      Description: Fine-tuned large language transformer models for proprietary domain parsing. Integrated custom tokenizers and embedding vectors into production search APIs.
      Technologies: Python, PyTorch, FastAPI, Docker
      Role Growth: False
      
    - Neo-Intelligence | Backend ML Developer
      Duration: 24 months (2 years)
      Description: Developed automated data labelling microservices and deployed distributed deep learning training pipelines in Kubernetes.
      Technologies: Python, TensorFlow, SQL, Kubernetes
      Role Growth: True
      
    Education:
    - University of Washington | BS in Mathematics & Computer Science | 2022
    """,
    """
    James Wu
    Email: j.wu@atrium-dev.net
    Phone: 555-481-9022
    Location: Austin, TX
    Skills: Python, FastAPI, React, JavaScript, SQL, TailwindCSS, PostgreSQL
    
    Work Experience:
    - Atrium Developer Labs | Software Engineer II
      Duration: 14 months (1.2 years)
      Description: Developed and styled administrative dashboards and applicant tables using React and TailwindCSS. Designed local relational tables for user metrics.
      Technologies: React, TailwindCSS, JavaScript, SQL, Python
      Role Growth: False
      
    - Horizon Software | Junior Developer
      Duration: 10 months (0.8 years)
      Description: Wrote unit test suites and resolved UI layout responsiveness issues.
      Technologies: JavaScript, Python, SQL
      Role Growth: False
      
    Education:
    - University of Texas at Austin | BS in Computer Science | 2023
    """,
    """
    Elena Rostova
    Email: elena.r@fintech-ventures.com
    Phone: 555-783-0919
    Location: Boston, MA
    Skills: Python, FastAPI, Go, Docker, PostgreSQL, Kubernetes, Redis, Prometheus
    
    Work Experience:
    - Fintech Ventures | Principal Platform Engineer
      Duration: 36 months (3 years)
      Description: Designed core platform framework for high-availability financial tools. Integrated Prometheus monitoring, reducing incident resolution times by 50%. Promoted from Lead Engineer.
      Technologies: Go, Python, Docker, Kubernetes, Redis, Prometheus
      Role Growth: True
      
    - Helix Solutions | Senior DevOps Engineer
      Duration: 24 months (2 years)
      Description: Set up full CI/CD deployment pipelines on AWS and migrated system clusters to Kubernetes.
      Technologies: Kubernetes, Docker, AWS, Go, PostgreSQL
      Role Growth: True
      
    Education:
    - Massachusetts Institute of Technology | BS in Computer Science | 2020
    """
]

# Initial seeding routine
def seed_candidates():
    logger.info("Pre-seeding candidate database with premium technical profiles...")
    for idx, raw_text in enumerate(preseeded_candidates):
        cand_id = f"cand-{idx+1}"
        profile = LLMParser.parse_resume(raw_text, cand_id)
        VectorStore.index_candidate(profile)

@app.on_event("startup")
def startup_event():
    seed_candidates()
    # Also set a default job description so the engine is immediately testable upon startup
    global current_jd
    default_jd_text = """
    Senior Backend Engineer
    Requirements:
    - Minimum 4+ years of relevant experience
    - Strong skills in Python backend frameworks, especially FastAPI or Flask
    - Deep familiarity with Vector Databases like Pinecone, ChromaDB, or Qdrant for semantic search applications
    - Experience in containerization and deployment (Docker, AWS)
    - Experience building scalable REST APIs and handling database performance optimization
    """
    current_jd = LLMParser.parse_job_description(default_jd_text)
    logger.info("System primed with default Job Description and preseeded candidate base.")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "pinecone_configured": VectorStore.get_embedding("test") is not None,
        "preseeded_count": len(preseeded_candidates)
    }

@app.post("/api/job-description", response_model=JobDescription)
def post_job_description(text: str = Body(..., media_type="text/plain")):
    """
    Upload and parse a new Job Description.
    """
    global current_jd
    if not text.strip():
        raise HTTPException(status_code=400, detail="Job description text cannot be empty.")
    
    try:
        parsed_jd = LLMParser.parse_job_description(text)
        current_jd = parsed_jd
        logger.info(f"Updated active Job Description to: {parsed_jd.title}")
        return parsed_jd
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse job description: {e}")

@app.get("/api/job-description", response_model=Optional[JobDescription])
def get_job_description():
    """
    Retrieves the currently loaded active Job Description.
    """
    return current_jd

async def extract_text_from_file(file: UploadFile) -> str:
    content = await file.read()
    filename = file.filename.lower()
    logger.info(f"Extracting text from file: {file.filename} (size: {len(content)} bytes)")
    
    if filename.endswith(".pdf"):
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(content))
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            if not text.strip():
                text = f"PDF Ingestion Fallback: {file.filename}. Content length: {len(content)} bytes."
            return text
        except Exception as e:
            logger.error(f"Failed to parse PDF file {file.filename}: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF file: {e}")
            
    elif filename.endswith(".docx") or filename.endswith(".doc"):
        try:
            import docx
            doc = docx.Document(io.BytesIO(content))
            text = "\n".join([para.text for para in doc.paragraphs])
            if not text.strip():
                text = f"DOCX Ingestion Fallback: {file.filename}. Content length: {len(content)} bytes."
            return text
        except Exception as e:
            # Legacy doc extractor fallback
            try:
                decoded = content.decode("utf-8", errors="ignore")
                cleaned = "".join(c for c in decoded if c.isalnum() or c.isspace() or c in ".,-@:()[]")
                if len(cleaned.strip()) > 100:
                    return cleaned
            except:
                pass
            logger.error(f"Failed to parse Word file {file.filename}: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to parse Word file: {e}")
            
    elif filename.endswith(".md") or filename.endswith(".txt") or filename.endswith(".json"):
        try:
            return content.decode("utf-8")
        except Exception as e:
            try:
                return content.decode("latin-1")
            except Exception as e2:
                logger.error(f"Failed to decode text file {file.filename}: {e2}")
                raise HTTPException(status_code=400, detail=f"Failed to decode uploaded text file: {e2}")
    else:
        # Default fallback string decoder
        try:
            return content.decode("utf-8")
        except Exception:
            try:
                return content.decode("latin-1")
            except Exception:
                raise HTTPException(status_code=400, detail=f"Unsupported file format and failed to decode as text: {file.filename}")

@app.post("/api/candidates/upload", response_model=CandidateProfile)
async def upload_candidate(file: UploadFile = File(...), custom_id: Optional[str] = None):
    """
    Ingests and parses a new candidate CV, then indexes it in the vector DB.
    """
    try:
        text = await extract_text_from_file(file)
        if not text.strip():
            raise HTTPException(status_code=400, detail="Extracted resume text is empty.")
        
        import uuid
        cand_id = custom_id if custom_id else f"cand-{uuid.uuid4().hex[:8]}"
        profile = LLMParser.parse_resume(text, cand_id)
        VectorStore.index_candidate(profile)
        return profile
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Upload and indexing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to parse and index resume: {e}")

@app.post("/api/candidates/structured", response_model=CandidateProfile)
def create_structured_candidate(candidate: CandidateProfile):
    """
    Ingests a pre-structured candidate profile directly and indexes it in the vector DB.
    """
    try:
        import uuid
        if not candidate.id or candidate.id == "string" or candidate.id == "auto":
            candidate.id = f"cand-{uuid.uuid4().hex[:8]}"
        VectorStore.index_candidate(candidate)
        return candidate
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to index structured candidate: {e}")

@app.get("/api/rank", response_model=List[RankedCandidate])
def get_rankings(top_n: int = 10):
    """
    Performs multi-stage hybrid ranking of all candidates against the active Job Description.
    """
    global current_jd
    if not current_jd:
        raise HTTPException(status_code=400, detail="No active Job Description set. Please upload a JD first.")
        
    try:
        # Stage 1: Dense Retrieval (Semantic Similarity)
        # Search all index candidates using the active JD text
        semantic_results = VectorStore.search_similar_candidates(
            jd_text=current_jd.parsed_raw_text or current_jd.title,
            top_n=top_n
        )
        
        # Stage 2 & 3: Run Career Trajectory and Cognitive Scoring
        ranked_candidates = []
        for idx, item in enumerate(semantic_results):
            candidate = item["candidate"]
            semantic_score = item["semantic_score"]
            
            # Orchestrate overall scoring calculations
            ranked_cand = HybridRanker.rank_candidate(
                candidate=candidate,
                jd=current_jd,
                semantic_score=semantic_score
            )
            ranked_candidates.append(ranked_cand)
            
        # Re-sort overall results by Final Overall Score descending
        ranked_candidates.sort(key=lambda x: x.scores.overall_score, reverse=True)
        
        # Assign formal rank numbers
        for rank_idx, candidate in enumerate(ranked_candidates):
            candidate.rank = rank_idx + 1
            
        return ranked_candidates
    except Exception as e:
        logger.error(f"Ranking orchestrations failed: {e}")
        raise HTTPException(status_code=500, detail=f"Ranking engine failure: {e}")

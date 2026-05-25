import os
import logging
import numpy as np
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

import httpx
# Idempotently monkeypatch httpx.Client to support legacy proxies argument from older openai libraries
if hasattr(httpx.Client, "__init__") and not getattr(httpx.Client.__init__, "_is_patched", False):
    original_init = httpx.Client.__init__
    def patched_init(self, *args, **kwargs):
        if 'proxies' in kwargs:
            kwargs['proxy'] = kwargs.pop('proxies')
        original_init(self, *args, **kwargs)
    patched_init._is_patched = True
    httpx.Client.__init__ = patched_init

if hasattr(httpx.AsyncClient, "__init__") and not getattr(httpx.AsyncClient.__init__, "_is_patched", False):
    original_async_init = httpx.AsyncClient.__init__
    def patched_async_init(self, *args, **kwargs):
        if 'proxies' in kwargs:
            kwargs['proxy'] = kwargs.pop('proxies')
        original_async_init(self, *args, **kwargs)
    patched_async_init._is_patched = True
    httpx.AsyncClient.__init__ = patched_async_init

# Strip all system proxy environment variables to prevent httpx/openai version mismatches
for var in ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy", "ALL_PROXY", "all_proxy"]:
    os.environ.pop(var, None)


from .schemas import CandidateProfile

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TalentSphere.VectorStore")

# Load env
load_dotenv(override=True)

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV = os.getenv("PINECONE_ENVIRONMENT", "us-east-1")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "talentsphere")

pinecone_available = False
pc_client = None
pc_index = None

if PINECONE_API_KEY and "YOUR" not in PINECONE_API_KEY:
    try:
        from pinecone import Pinecone, ServerlessSpec
        pc_client = Pinecone(api_key=PINECONE_API_KEY)
        
        existing_indexes = [idx.name for idx in pc_client.list_indexes()]
        if PINECONE_INDEX_NAME not in existing_indexes:
            logger.info(f"Creating Pinecone index '{PINECONE_INDEX_NAME}'...")
            pc_client.create_index(
                name=PINECONE_INDEX_NAME,
                dimension=3072, # gemini-embedding-2-preview uses 3072 dimensions
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region=PINECONE_ENV)
            )
        pc_index = pc_client.Index(PINECONE_INDEX_NAME)
        pinecone_available = True
        logger.info("Pinecone DB connection established successfully.")
    except Exception as e:
        logger.warning(f"Failed to initialize Pinecone: {e}. Falling back to in-memory vector store.")

# Global in-memory index for local fallback
local_index_db: Dict[str, Dict[str, Any]] = {}

class VectorStore:
    @staticmethod
    def get_embedding(text: str) -> List[float]:
        """
        Retrieves embedding using Euri OpenAI text-embedding endpoint, or returns a simulated embedding vector.
        """
        euri_api_key = os.getenv("EURI_API_KEY") or os.getenv("API_KEY")
        if euri_api_key and "YOUR" not in euri_api_key:
            try:
                import httpx
                from openai import OpenAI
                client = OpenAI(
                    api_key=euri_api_key,
                    base_url="https://api.euron.one/api/v1/euri",
                    http_client=httpx.Client()
                )
                response = client.embeddings.create(
                    input=text,
                    model="gemini-embedding-2-preview"
                )
                return response.data[0].embedding
            except Exception as e:
                logger.warning(f"Failed to fetch Euri embedding: {e}. Falling back to simulated vector.")

        # Local deterministic mock embedding generator based on word hashes
        # Ensures that similar terms yield closer cosine distances
        dim = 3072
        vec = np.zeros(dim)
        words = text.lower().split()
        for w in words:
            seed = sum(ord(c) for c in w) % 10000
            rng = np.random.default_rng(seed)
            vec += rng.normal(0, 0.1, dim)
        
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    @classmethod
    def index_candidate(cls, candidate: CandidateProfile) -> None:
        """
        Indexes candidate profile into the vector database (Pinecone or Local In-Memory).
        """
        content_to_embed = f"{candidate.name} {candidate.skills} " + " ".join(
            f"{exp.title} at {exp.company}: {exp.description}" for exp in candidate.experience
        )
        
        embedding = cls.get_embedding(content_to_embed)
        
        if pinecone_available and pc_index:
            try:
                metadata = {
                    "id": candidate.id,
                    "name": candidate.name,
                    "email": candidate.email,
                    "skills": ",".join(candidate.skills),
                    "total_years_exp": candidate.total_years_exp
                }
                pc_index.upsert(vectors=[(candidate.id, embedding, metadata)])
                logger.info(f"Successfully upserted candidate {candidate.name} to Pinecone.")
            except Exception as e:
                logger.error(f"Pinecone upsert failed: {e}. Falling back to local index.")
                cls._index_locally(candidate, embedding)
        else:
            cls._index_locally(candidate, embedding)

    @classmethod
    def _index_locally(cls, candidate: CandidateProfile, embedding: List[float]) -> None:
        local_index_db[candidate.id] = {
            "candidate": candidate,
            "vector": embedding
        }
        logger.info(f"Successfully indexed candidate {candidate.name} in local memory vector database.")

    @classmethod
    def search_similar_candidates(cls, jd_text: str, top_n: int = 10) -> List[Dict[str, Any]]:
        """
        Queries the vector database using the JD embedding to find matching candidates.
        """
        jd_embedding = cls.get_embedding(jd_text)
        results = []

        if pinecone_available and pc_index:
            try:
                response = pc_index.query(
                    vector=jd_embedding,
                    top_k=top_n,
                    include_metadata=True
                )
                for match in response.get("matches", []):
                    cand_id = match.get("id")
                    score = match.get("score", 0.0)
                    scaled_score = float(max(0, min(100, (score + 1.0) / 2.0 * 100.0)))
                    
                    cand_data = local_index_db.get(cand_id)
                    if cand_data:
                        results.append({
                            "candidate": cand_data["candidate"],
                            "semantic_score": scaled_score
                        })
                    else:
                        meta = match.get("metadata", {})
                        results.append({
                            "candidate": CandidateProfile(
                                id=cand_id,
                                name=meta.get("name", "Unknown"),
                                email=meta.get("email", ""),
                                skills=meta.get("skills", "").split(",") if meta.get("skills") else [],
                                total_years_exp=float(meta.get("total_years_exp", 0.0))
                            ),
                            "semantic_score": scaled_score
                        })
                return results
            except Exception as e:
                logger.error(f"Pinecone query failed: {e}. Querying local memory index.")

        # Fallback local mathematical cosine-similarity search
        query_vec = np.array(jd_embedding)
        scored_candidates = []
        
        for cand_id, item in local_index_db.items():
            cand_vec = np.array(item["vector"])
            dot_product = np.dot(query_vec, cand_vec)
            norm_q = np.linalg.norm(query_vec)
            norm_c = np.linalg.norm(cand_vec)
            
            cosine_sim = 0.0
            if norm_q > 0 and norm_c > 0:
                cosine_sim = dot_product / (norm_q * norm_c)
            
            match_score = float((cosine_sim + 1.0) / 2.0 * 100.0)
            
            skills_overlap = set(s.lower() for s in item["candidate"].skills).intersection(set(jd_text.lower().split()))
            if skills_overlap:
                match_score = min(100.0, match_score + len(skills_overlap) * 2.0)
                
            scored_candidates.append({
                "candidate": item["candidate"],
                "semantic_score": match_score
            })
            
        scored_candidates.sort(key=lambda x: x["semantic_score"], reverse=True)
        return scored_candidates[:top_n]

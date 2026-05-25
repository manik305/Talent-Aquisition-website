import os
import json
import logging
from typing import List, Dict, Any
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


from .schemas import CandidateProfile, JobDescription, ScoreBreakdown, RankedCandidate, clean_and_parse_json

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TalentSphere.Ranker")

load_dotenv(override=True)

class HybridRanker:
    @staticmethod
    def compute_trajectory_score(candidate: CandidateProfile, jd: JobDescription) -> float:
        """
        Algorithmic calculation of career trajectory score S_trajectory (30% weight).
        Evaluates tenure, experience alignment, and growth/promotion signals.
        """
        # 1. Tenure Score (100 points max)
        avg_tenure = 0.0
        tenure_score = 0.0
        if candidate.experience:
            total_months = sum(exp.duration_months for exp in candidate.experience)
            avg_tenure = total_months / len(candidate.experience)
            if avg_tenure >= 36:
                tenure_score = 100.0
            elif avg_tenure >= 24:
                tenure_score = 90.0
            elif avg_tenure >= 12:
                tenure_score = 60.0 + (avg_tenure - 12) * 2.5
            else:
                tenure_score = max(0.0, avg_tenure * 5.0)
        else:
            tenure_score = 50.0

        # 2. Title / Role Growth Score (100 points max)
        growth_points = 0
        if candidate.experience:
            for exp in candidate.experience:
                if exp.role_growth:
                    growth_points += 40
                lower_title = exp.title.lower()
                if any(k in lower_title for k in ["senior", "sr.", "lead", "architect", "principal", "manager", "head"]):
                    growth_points += 20
            growth_score = min(100.0, 50.0 + growth_points)
        else:
            growth_score = 50.0

        # 3. Experience Match Score (100 points max)
        exp_delta = candidate.total_years_exp - jd.min_experience_years
        if exp_delta >= 0:
            match_score = min(100.0, 90.0 + min(5.0, exp_delta) * 2.0)
        else:
            match_score = max(20.0, 90.0 + exp_delta * 15.0)

        # Weighted sum: 40% Tenure, 30% Growth, 30% Target Experience Match
        s_trajectory = (0.4 * tenure_score) + (0.3 * growth_score) + (0.3 * match_score)
        return float(round(s_trajectory, 1))

    @staticmethod
    def compute_cognitive_score(candidate: CandidateProfile, jd: JobDescription) -> Dict[str, Any]:
        """
        Deep qualitative analysis S_cognitive (40% weight) utilizing Euri API.
        """
        euri_api_key = os.getenv("EURI_API_KEY") or os.getenv("API_KEY")
        euri_model = os.getenv("EURI_MODEL", "gemini-3.5-flash")
        
        if euri_api_key and "YOUR" not in euri_api_key:
            try:
                import httpx
                from openai import OpenAI
                client = OpenAI(
                    api_key=euri_api_key,
                    base_url="https://api.euron.one/api/v1/euri",
                    http_client=httpx.Client()
                )
                
                prompt = (
                    "You are an elite principal software architect and tech executive recruiter.\n"
                    "Evaluate the candidate profile against the job description. Analyze the depth of their skills, "
                    "domain fit, years of experience, and leadership cues. "
                    "Output a strict JSON matching this structure exactly:\n"
                    "{\n"
                    "  \"technical_depth_score\": integer, // 0 to 100\n"
                    "  \"soft_skills_score\": integer, // 0 to 100\n"
                    "  \"domain_fit_score\": integer, // 0 to 100\n"
                    "  \"growth_potential_score\": integer, // 0 to 100\n"
                    "  \"key_strengths\": [\"string\"],\n"
                    "  \"gaps\": [\"string\"],\n"
                    "  \"fit_justification\": \"string\",\n"
                    "  \"custom_interview_questions\": [\"string\"]\n"
                    "}\n\n"
                    f"JOB DESCRIPTION:\n{jd.json()}\n\n"
                    f"CANDIDATE PROFILE:\n{candidate.json()}"
                )
                
                response = client.chat.completions.create(
                    model=euri_model,
                    messages=[
                        {"role": "system", "content": "You are an elite recruiter assistant that outputs only valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    max_tokens=1500,
                    temperature=0.1
                )
                
                data = clean_and_parse_json(response.choices[0].message.content)
                
                tech = data.get("technical_depth_score", 70)
                soft = data.get("soft_skills_score", 70)
                dom = data.get("domain_fit_score", 70)
                gro = data.get("growth_potential_score", 70)
                
                avg_cognitive = (tech + soft + dom + gro) / 4.0
                
                return {
                    "cognitive_score": float(round(avg_cognitive, 1)),
                    "key_strengths": data.get("key_strengths", []),
                    "gaps": data.get("gaps", []),
                    "fit_justification": data.get("fit_justification", "Qualified candidate matching multiple technical axes."),
                    "custom_interview_questions": data.get("custom_interview_questions", [])
                }
            except Exception as e:
                logger.error(f"Euri cognitive scoring failed: {e}. Utilizing deterministic analyzer.")

        # High-Fidelity Rule-Based Cognitive Analyzer fallback
        jd_req_skills = [s.lower() for s in jd.required_skills]
        cand_skills = [s.lower() for s in candidate.skills]
        
        overlap_skills = set(jd_req_skills).intersection(set(cand_skills))
        skill_match_ratio = len(overlap_skills) / len(jd_req_skills) if jd_req_skills else 1.0
        
        tech_score = float(round(50.0 + (skill_match_ratio * 40.0) + min(10.0, candidate.total_years_exp), 1))
        domain_score = 75.0 if "startup" in jd.environmental_context.lower() and candidate.total_years_exp > 3 else 82.0
        soft_score = 80.0
        growth_score = 65.0
        
        if len(candidate.experience) > 1 and any(exp.role_growth for exp in candidate.experience):
            growth_score = 88.0
            soft_score += 5.0
            
        avg_cognitive = (tech_score + soft_score + domain_score + growth_score) / 4.0
        
        strengths = []
        gaps = []
        questions = []
        
        if overlap_skills:
            strengths.append(f"Demonstrated core competency in {', '.join(list(overlap_skills)[:3]).title()}.")
        if candidate.total_years_exp >= jd.min_experience_years:
            strengths.append(f"Meets minimum experience threshold with {candidate.total_years_exp} years of history.")
        if any(e.role_growth for e in candidate.experience):
            strengths.append("Clear trajectory of upward promotion and scope expansion.")
        else:
            strengths.append("Solid background in enterprise software application construction.")

        missing_skills = set(jd_req_skills) - set(cand_skills)
        if missing_skills:
            gaps.append(f"Lacks explicit resume documentation for {', '.join(list(missing_skills)[:3]).title()}.")
        if candidate.total_years_exp < jd.min_experience_years:
            gaps.append(f"Years of experience ({candidate.total_years_exp} yrs) falls short of the target ({jd.min_experience_years} yrs).")
        if len(candidate.experience) >= 3:
            avg_tenure = sum(exp.duration_months for exp in candidate.experience) / len(candidate.experience)
            if avg_tenure < 18:
                gaps.append("Average role durability is under 18 months, showing elevated transition risk.")

        if missing_skills:
            questions.append(f"How have you handled scaling architectures in the past without using {list(missing_skills)[0].title()}?")
        else:
            questions.append("Can you walk us through the system design of your most complex database implementation?")
            
        questions.append("Describe a project where you took over an existing team and had to restructure responsibilities to optimize throughput.")
        questions.append("What strategies do you deploy when troubleshooting critical production bottlenecks under high latencies?")

        justification = (
            f"{candidate.name} is a strong candidate showing substantial alignment. "
            f"They possess a {tech_score:.1f}/100 technical rating based on skill overlaps. "
            f"Their career path shows stability and active engineering contributions, aligning with our technical expectations."
        )

        return {
            "cognitive_score": float(round(avg_cognitive, 1)),
            "key_strengths": strengths,
            "gaps": gaps,
            "fit_justification": justification,
            "custom_interview_questions": questions
        }

    @classmethod
    def rank_candidate(cls, candidate: CandidateProfile, jd: JobDescription, semantic_score: float) -> RankedCandidate:
        """
        Orchestrates full 3-stage ranking math.
        """
        trajectory_score = cls.compute_trajectory_score(candidate, jd)
        cog_result = cls.compute_cognitive_score(candidate, jd)
        
        cognitive_score = cog_result["cognitive_score"]
        
        overall_score = (0.3 * semantic_score) + (0.3 * trajectory_score) + (0.4 * cognitive_score)
        overall_score = float(round(overall_score, 1))
        
        breakdown = ScoreBreakdown(
            semantic_score=semantic_score,
            trajectory_score=trajectory_score,
            cognitive_score=cognitive_score,
            overall_score=overall_score
        )
        
        return RankedCandidate(
            candidate=candidate,
            scores=breakdown,
            rank=99,
            key_strengths=cog_result["key_strengths"],
            gaps=cog_result["gaps"],
            fit_justification=cog_result["fit_justification"],
            custom_interview_questions=cog_result["custom_interview_questions"]
        )

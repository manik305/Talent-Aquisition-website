from pydantic import BaseModel, Field
from typing import List, Optional
import json

def clean_and_parse_json(text: str) -> dict:
    """
    Robustly parses LLM JSON outputs, stripping markdown code blocks and handling unescaped control characters.
    """
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()
    
    # Try parsing with strict=False to gracefully permit unescaped newlines and control characters in strings
    return json.loads(cleaned, strict=False)

class WorkExperience(BaseModel):
    company: str = Field(..., description="Name of the company")
    title: str = Field(..., description="Job title")
    duration_months: int = Field(..., description="Duration of employment in months")
    description: str = Field(..., description="Summary of accomplishments and responsibilities")
    technologies_used: List[str] = Field(default_factory=list, description="Technologies and skills applied in this role")
    role_growth: bool = Field(default=False, description="Did this role represent a promotion or growth in scope?")

class Education(BaseModel):
    institution: str = Field(..., description="Name of the university or school")
    degree: str = Field(..., description="Degree type (e.g. BS, MS, PhD)")
    field_of_study: str = Field(..., description="Major field of study")
    graduation_year: Optional[int] = Field(None, description="Year of graduation")

class CandidateProfile(BaseModel):
    id: str = Field(..., description="Unique ID for the candidate")
    name: str = Field(..., description="Candidate name")
    email: str = Field(..., description="Email address")
    phone: str = Field(default="", description="Phone number")
    location: str = Field(default="", description="Current location")
    skills: List[str] = Field(default_factory=list, description="List of technical and soft skills")
    experience: List[WorkExperience] = Field(default_factory=list, description="List of work experience entries")
    education: List[Education] = Field(default_factory=list, description="List of education records")
    total_years_exp: float = Field(default=0.0, description="Total years of work experience")
    parsed_raw_text: Optional[str] = Field(None, description="Raw unstructured text from CV")

class JobDescription(BaseModel):
    title: str = Field(..., description="Target job title")
    required_skills: List[str] = Field(default_factory=list, description="Core required skills")
    nice_to_have_skills: List[str] = Field(default_factory=list, description="Good-to-have secondary skills")
    min_experience_years: int = Field(default=0, description="Minimum years of experience required")
    environmental_context: str = Field(default="", description="Startup vs Enterprise, Scale of Systems managed, or special context")
    parsed_raw_text: Optional[str] = Field(None, description="Raw unstructured job description text")

class ScoreBreakdown(BaseModel):
    semantic_score: float = Field(..., description="Semantic vector match score (0-100)")
    trajectory_score: float = Field(..., description="Algorithmic career progression score (0-100)")
    cognitive_score: float = Field(..., description="LLM qualitative evaluation score (0-100)")
    overall_score: float = Field(..., description="Final weighted overall score (0-100)")

class RankedCandidate(BaseModel):
    candidate: CandidateProfile
    scores: ScoreBreakdown
    rank: int
    key_strengths: List[str] = Field(default_factory=list, description="Top AI-identified technical and soft strengths")
    gaps: List[str] = Field(default_factory=list, description="Identified developmental gaps or alignment issues")
    fit_justification: str = Field(..., description="Written explanation detailing why the candidate is ranked here")
    custom_interview_questions: List[str] = Field(default_factory=list, description="Tailored interviewer questions based on candidate history")

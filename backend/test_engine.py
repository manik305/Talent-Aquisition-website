import unittest
import numpy as np
from .schemas import CandidateProfile, JobDescription, WorkExperience, Education
from .parser import LLMParser
from .vector_store import VectorStore
from .ranker import HybridRanker

class TestTalentSphereEngine(unittest.TestCase):
    def setUp(self):
        # Sample clean Job Description
        self.jd = JobDescription(
            title="Senior Python Backend Architect",
            required_skills=["Python", "FastAPI", "Pinecone", "AWS"],
            nice_to_have_skills=["Docker", "Redis"],
            min_experience_years=5,
            environmental_context="Enterprise High-Scale Systems",
            parsed_raw_text="Senior Backend Engineer role requiring 5+ years of experience with Python, FastAPI, and Pinecone."
        )

        # Sample Candidate 1: High Alignment, 8 yrs experience, Promotions
        self.candidate_expert = CandidateProfile(
            id="test-cand-expert",
            name="Alex Dev",
            email="alex@expert.io",
            skills=["Python", "FastAPI", "Pinecone", "AWS", "Docker"],
            total_years_exp=8.0,
            experience=[
                WorkExperience(
                    company="Alpha Tech",
                    title="Lead Software Engineer",
                    duration_months=36,
                    description="Lead development of core backend using FastAPI and Pinecone.",
                    technologies_used=["Python", "FastAPI", "Pinecone"],
                    role_growth=True
                ),
                WorkExperience(
                    company="Beta Systems",
                    title="Software Developer",
                    duration_months=60,
                    description="General software building.",
                    technologies_used=["Python", "AWS"],
                    role_growth=False
                )
            ],
            education=[
                Education(institution="State College", degree="BS", field_of_study="Computer Science", graduation_year=2015)
            ]
        )

        # Sample Candidate 2: Low Alignment, 2 yrs experience, No Promotions
        self.candidate_junior = CandidateProfile(
            id="test-cand-junior",
            name="Billy Coder",
            email="billy@junior.io",
            skills=["JavaScript", "HTML", "CSS"],
            total_years_exp=2.0,
            experience=[
                WorkExperience(
                    company="Gamma Corp",
                    title="Junior Developer",
                    duration_months=24,
                    description="Front end styling tasks.",
                    technologies_used=["JavaScript"],
                    role_growth=False
                )
            ],
            education=[
                Education(institution="Bootcamp", degree="Certificate", field_of_study="Web Dev", graduation_year=2023)
            ]
        )

    def test_parser_fallbacks(self):
        """Verifies parsing logic behaves correctly under fallback conditions."""
        from backend import parser
        original_available = parser.euri_available
        parser.euri_available = False
        try:
            parsed_jd = LLMParser.parse_job_description("Senior developer. We need Python, React, and FastAPI.")
            self.assertEqual(parsed_jd.title, "Senior developer. We need Python, React, and FastAPI.")
            self.assertIn("Python", parsed_jd.required_skills)
            self.assertIn("FastAPI", parsed_jd.required_skills)
            self.assertEqual(parsed_jd.min_experience_years, 5)

            parsed_cv = LLMParser.parse_resume("Jane Smith. Python senior engineer with FastAPI and Docker experience.", "jane-1")
            self.assertEqual(parsed_cv.id, "jane-1")
            self.assertEqual(parsed_cv.name, "Jane Smith")
            self.assertIn("Python", parsed_cv.skills)
            self.assertIn("FastAPI", parsed_cv.skills)
            self.assertGreater(parsed_cv.total_years_exp, 0.0)
        finally:
            parser.euri_available = original_available

    def test_vector_store_fallbacks(self):
        """Tests that local vector database correctly stores and performs mathematical search queries."""
        # Clear database and index test candidates
        VectorStore.index_candidate(self.candidate_expert)
        VectorStore.index_candidate(self.candidate_junior)

        # Perform similarity retrieval
        results = VectorStore.search_similar_candidates("Looking for Python FastAPI developer with Pinecone", top_n=2)
        
        self.assertEqual(len(results), 2)
        # The expert should rank higher semantically
        self.assertEqual(results[0]["candidate"].id, "test-cand-expert")
        self.assertGreater(results[0]["semantic_score"], results[1]["semantic_score"])

    def test_trajectory_scoring(self):
        """Validates S_trajectory (tenure, growth, target exp) calculations."""
        # Expert: high tenure (average 48 months), growth promotion (Lead title), exceeds target (8 vs 5 yrs)
        score_expert = HybridRanker.compute_trajectory_score(self.candidate_expert, self.jd)
        self.assertGreaterEqual(score_expert, 85.0)

        # Junior: low tenure (24 months), no promotion, below target (2 vs 5 yrs)
        score_junior = HybridRanker.compute_trajectory_score(self.candidate_junior, self.jd)
        self.assertLess(score_junior, score_expert)
        self.assertLess(score_junior, 70.0)

    def test_hybrid_ranking_flow(self):
        """Validates that final overall score correctly applies the weighted formula."""
        semantic_score = 90.0
        ranked = HybridRanker.rank_candidate(self.candidate_expert, self.jd, semantic_score)
        
        # Check overall score calculation matches 30% Semantic + 30% Trajectory + 40% Cognitive
        weight_sum = (0.3 * semantic_score) + (0.3 * ranked.scores.trajectory_score) + (0.4 * ranked.scores.cognitive_score)
        self.assertAlmostEqual(ranked.scores.overall_score, round(weight_sum, 1))
        
        # Ensure feedback structures are populated
        self.assertTrue(len(ranked.key_strengths) > 0)
        self.assertTrue(len(ranked.fit_justification) > 0)
        self.assertTrue(len(ranked.custom_interview_questions) > 0)

if __name__ == "__main__":
    unittest.main()

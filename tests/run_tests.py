"""
Standalone test runner using standard library unittest.
Allows running the full test suite without requiring third-party test runners.
Usage:
    python3 tests/run_tests.py
"""
import unittest
import sys
import os

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ml.sentiment import analyze_sentiment, get_sentiment_summary
from app.ml.semantic_search import rank_services_by_semantic_relevance, expand_query, tokenize
from app.utils import get_password_hash, verify_password
from app.routes import _detect_image_type, ALLOWED_SORT_FIELDS
from app.config import Settings


class MLTests(unittest.TestCase):
    def test_positive_sentiment(self):
        result = analyze_sentiment("Outstanding poster design! Delivered on time and very creative.", star_rating=5)
        self.assertEqual(result["label"], "positive")
        self.assertGreater(result["compound_score"], 0.3)
        self.assertTrue(result["star_alignment"])

    def test_negative_sentiment(self):
        result = analyze_sentiment("Complete scam, awful quality and terrible communication.", star_rating=1)
        self.assertEqual(result["label"], "negative")
        self.assertLess(result["compound_score"], -0.3)
        self.assertTrue(result["star_alignment"])

    def test_negation_handling(self):
        negated = analyze_sentiment("The work was not good and delayed.")
        self.assertLess(negated["compound_score"], 0.0)

    def test_booster_words(self):
        standard = analyze_sentiment("Good design.")
        boosted = analyze_sentiment("Super extremely good design!")
        self.assertGreater(boosted["compound_score"], standard["compound_score"])

    def test_sentiment_summary_aggregation(self):
        sample_reviews = [
            {"comment": "Amazing experience, very helpful!", "rating": 5},
            {"comment": "Delivered the work.", "rating": 3},
            {"comment": "Terrible work, waste of time.", "rating": 1},
            {"comment": "Horrible communication, incomplete work.", "rating": 1},
        ]
        summary = get_sentiment_summary(sample_reviews)
        self.assertEqual(summary["total_analyzed"], 4)
        self.assertEqual(summary["positive_percent"], 25.0)
        self.assertEqual(summary["negative_percent"], 50.0)
        self.assertEqual(summary["neutral_percent"], 25.0)

    def test_semantic_match_programming_query(self):
        mock_services = [
            {
                "id": 1,
                "title": "Professional Coding Tutor",
                "description": "Python, Java and algorithms tutoring for semester exams and lab tests.",
                "skill": {"name": "Tutoring", "category": {"name": "Academic"}}
            },
            {
                "id": 2,
                "title": "College Fest Poster Design",
                "description": "Custom banners and flyers using Photoshop and Canva for college clubs.",
                "skill": {"name": "Poster Design", "category": {"name": "Design"}}
            }
        ]
        ranked = rank_services_by_semantic_relevance("need programming assignment help", mock_services)
        self.assertGreater(len(ranked), 0)
        top_service, score = ranked[0]
        self.assertEqual(top_service["id"], 1)
        self.assertGreater(score, 0.1)


class SecurityTests(unittest.TestCase):
    def test_password_hashing(self):
        pwd = "CollegeSecure@2026"
        hashed = get_password_hash(pwd)
        self.assertNotEqual(hashed, pwd)
        self.assertTrue(verify_password(pwd, hashed))
        self.assertFalse(verify_password("WrongPassword", hashed))

    def test_magic_byte_validation(self):
        fake_jpeg = b"\xff\xd8\xff\xe0" + b"randompayload"
        self.assertEqual(_detect_image_type(fake_jpeg), "image/jpeg")

        fake_png = b"\x89PNG\r\n\x1a\n" + b"randompayload"
        self.assertEqual(_detect_image_type(fake_png), "image/png")

        malicious_script = b"<?php echo 'malicious'; ?>"
        self.assertIsNone(_detect_image_type(malicious_script))

    def test_sort_fields_whitelist(self):
        self.assertNotIn("hashed_password", ALLOWED_SORT_FIELDS)
        self.assertIn("created_at", ALLOWED_SORT_FIELDS)
        self.assertIn("price", ALLOWED_SORT_FIELDS)

    def test_production_mode_blocks_default_secrets(self):
        s = Settings(
            app_env="production",
            secret_key="change-this-in-production",
            jwt_secret_key="change-this-jwt-secret"
        )
        with self.assertRaises(RuntimeError):
            s.validate_secrets()


if __name__ == "__main__":
    unittest.main(verbosity=2)

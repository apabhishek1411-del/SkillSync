"""
Unit and Integration tests for SkillSphere AI/ML Subsystem.
Tests both NLP Sentiment Analysis and Vector Space Semantic Search.
"""
import pytest
from app.ml.sentiment import analyze_sentiment, get_sentiment_summary
from app.ml.semantic_search import rank_services_by_semantic_relevance, expand_query, tokenize


class TestSentimentAnalysis:
    """Test suite for Review Sentiment Analysis."""

    def test_positive_sentiment(self):
        result = analyze_sentiment("Outstanding poster design! Delivered on time and very creative.", star_rating=5)
        assert result["label"] == "positive"
        assert result["compound_score"] > 0.3
        assert result["confidence"] >= 0.7
        assert result["star_alignment"] is True

    def test_negative_sentiment(self):
        result = analyze_sentiment("Complete scam, awful quality and terrible communication.", star_rating=1)
        assert result["label"] == "negative"
        assert result["compound_score"] < -0.3
        assert result["confidence"] >= 0.7
        assert result["star_alignment"] is True

    def test_negation_handling(self):
        # "not good" should be recognized as negative/neutral, not positive
        negated = analyze_sentiment("The work was not good and delayed.")
        assert negated["compound_score"] < 0.0

    def test_booster_words(self):
        standard = analyze_sentiment("Good design.")
        boosted = analyze_sentiment("Super extremely good design!")
        assert boosted["compound_score"] > standard["compound_score"]

    def test_empty_text_fallback_to_rating(self):
        res_high = analyze_sentiment("", star_rating=5)
        assert res_high["label"] == "positive"
        
        res_low = analyze_sentiment("", star_rating=1)
        assert res_low["label"] == "negative"

    def test_sentiment_summary_aggregation(self):
        sample_reviews = [
            {"comment": "Amazing experience, very helpful!", "rating": 5},
            {"comment": "Delivered the work.", "rating": 3},
            {"comment": "Terrible work, waste of time.", "rating": 1},
            {"comment": "Horrible communication, incomplete work.", "rating": 1},
        ]
        summary = get_sentiment_summary(sample_reviews)
        assert summary["total_analyzed"] == 4
        assert summary["positive_percent"] == 25.0
        assert summary["negative_percent"] == 50.0
        assert summary["neutral_percent"] == 25.0


class TestSemanticSearch:
    """Test suite for Natural Language Semantic Search."""

    @pytest.fixture
    def mock_services(self):
        return [
            {
                "id": 1,
                "title": "Professional Coding Tutor",
                "description": "Python, Java and algorithms tutoring for semester exams and lab tests.",
                "short_description": "Computer science tutoring",
                "skill": {"name": "Tutoring", "category": {"name": "Academic"}}
            },
            {
                "id": 2,
                "title": "College Fest Poster Design",
                "description": "Custom banners and flyers using Photoshop and Canva for college clubs.",
                "short_description": "Graphic design",
                "skill": {"name": "Poster Design", "category": {"name": "Design"}}
            },
            {
                "id": 3,
                "title": "Lab Record Documentation & Technical Writing",
                "description": "Circuit schematic drawing, LaTeX thesis formatting, and lab manuals.",
                "short_description": "Documentation",
                "skill": {"name": "Technical Writing", "category": {"name": "Writing"}}
            }
        ]

    def test_query_expansion(self):
        tokens = tokenize("need coding help")
        expanded = expand_query(tokens)
        assert "coding" in expanded
        # "coding" cluster should introduce programming or python
        assert any(term in expanded for term in ["programming", "code", "python", "software"])

    def test_semantic_match_programming_query(self, mock_services):
        # Searching for "programming assignment" should rank the Coding Tutor #1
        ranked = rank_services_by_semantic_relevance("need programming assignment help", mock_services)
        assert len(ranked) > 0
        top_service, score = ranked[0]
        assert top_service["id"] == 1
        assert score > 0.15

    def test_semantic_match_graphics_query(self, mock_services):
        # Searching for "graphics for event flyer" should rank the Poster Designer #1
        ranked = rank_services_by_semantic_relevance("graphics for event flyer", mock_services)
        assert len(ranked) > 0
        top_service, score = ranked[0]
        assert top_service["id"] == 2
        assert score > 0.15

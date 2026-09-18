"""
NLP Sentiment Analysis Module for SkillSphere Reviews.

Implements rule-based and lexicon-driven Sentiment Intensity Analysis
specifically tuned for student micro-gig reviews, peer feedback, and service ratings.
"""
import re
import math
from typing import Dict, Any, List, Optional

# Lexicon containing sentiment polarity scores (-4.0 to +4.0)
_LEXICON = {
    # Highly Positive (+3.0 to +4.0)
    "excellent": 3.8, "exceptional": 3.9, "superb": 3.7, "outstanding": 3.8,
    "brilliant": 3.6, "masterpiece": 3.9, "flawless": 3.7, "perfect": 3.8,
    "phenomenal": 3.8, "awesome": 3.5, "wonderful": 3.4, "amazing": 3.5,
    "top-notch": 3.6, "breathtaking": 3.5, "incredible": 3.6, "unbelievable": 3.2,
    "genius": 3.5, "life-saver": 3.8, "lifesaver": 3.8, "rockstar": 3.5,

    # Positive (+1.5 to +2.9)
    "good": 2.0, "great": 2.8, "helpful": 2.3, "reliable": 2.5,
    "fast": 2.1, "quick": 2.0, "punctual": 2.2, "polite": 2.1,
    "friendly": 2.2, "responsive": 2.3, "professional": 2.6,
    "quality": 2.4, "clean": 2.0, "neat": 2.0, "recommended": 2.5,
    "recommend": 2.5, "satisfied": 2.2, "happy": 2.4, "smooth": 2.1,
    "creative": 2.4, "skilled": 2.5, "talented": 2.6, "patient": 2.2,
    "efficient": 2.4, "impressed": 2.5, "thorough": 2.2, "clear": 1.9,
    "easy": 1.8, "prompt": 2.1, "accurate": 2.3, "valuable": 2.4,

    # Neutral to Mild Positive (+0.5 to +1.4)
    "decent": 1.2, "okay": 0.8, "fine": 1.0, "acceptable": 1.1,
    "average": 0.5, "passable": 0.7, "fair": 0.9, "reasonable": 1.2,

    # Mild Negative (-0.5 to -1.9)
    "mediocre": -1.2, "slow": -1.5, "delayed": -1.4, "confusing": -1.3,
    "messy": -1.4, "rough": -1.1, "careless": -1.8, "cluttered": -1.3,
    "bland": -1.0, "boring": -1.2, "unresponsive": -1.9, "late": -1.6,

    # Negative (-2.0 to -2.9)
    "bad": -2.4, "poor": -2.3, "disappointed": -2.5, "disappointing": -2.4,
    "unhelpful": -2.2, "unprofessional": -2.6, "sloppy": -2.3, "rude": -2.7,
    "subpar": -2.1, "waste": -2.8, "worthless": -2.8, "annoying": -2.1,
    "frustrating": -2.4, "misleading": -2.5, "incomplete": -2.2,

    # Highly Negative (-3.0 to -4.0)
    "terrible": -3.5, "horrible": -3.6, "awful": -3.5, "disaster": -3.7,
    "scam": -3.8, "fraud": -3.9, "cheater": -3.8, "cheated": -3.7,
    "useless": -3.2, "pathetic": -3.4, "abysmal": -3.6, "appalling": -3.5,
    "unacceptable": -3.2, "disgrace": -3.6,
}

_NEGATIONS = {
    "not", "never", "no", "hardly", "barely", "scarcely", "without",
    "cannot", "can't", "don't", "didn't", "won't", "wasn't", "isn't", "aren't"
}

_BOOSTERS = {
    "very": 0.35, "extremely": 0.5, "really": 0.3, "super": 0.4,
    "totally": 0.3, "absolutely": 0.45, "highly": 0.4, "ultra": 0.4,
    "so": 0.25, "incredibly": 0.45, "insanely": 0.45,
    "somewhat": -0.2, "barely": -0.3, "slightly": -0.2
}


def _tokenize(text: str) -> List[str]:
    """Clean and split text into normalized word tokens."""
    return re.findall(r"\b[\w'-]+\b", text.lower())


def analyze_sentiment(text: Optional[str], star_rating: Optional[int] = None) -> Dict[str, Any]:
    """
    Analyzes sentiment of text review.
    Returns:
        {
            "compound_score": float (-1.0 to 1.0),
            "label": "positive" | "neutral" | "negative",
            "confidence": float (0.0 to 1.0),
            "star_alignment": bool (whether sentiment aligns with 1-5 star rating)
        }
    """
    if not text or not text.strip():
        # Fallback to star rating if no textual review
        if star_rating is not None:
            if star_rating >= 4:
                return {"compound_score": 0.75, "label": "positive", "confidence": 0.8, "star_alignment": True}
            elif star_rating == 3:
                return {"compound_score": 0.0, "label": "neutral", "confidence": 0.7, "star_alignment": True}
            else:
                return {"compound_score": -0.75, "label": "negative", "confidence": 0.8, "star_alignment": True}
        return {"compound_score": 0.0, "label": "neutral", "confidence": 0.5, "star_alignment": True}

    tokens = _tokenize(text)
    if not tokens:
        return {"compound_score": 0.0, "label": "neutral", "confidence": 0.5, "star_alignment": True}

    scores = []
    i = 0
    while i < len(tokens):
        word = tokens[i]
        val = _LEXICON.get(word)

        if val is not None:
            # Check for negation in 3 words preceding
            negated = False
            window_start = max(0, i - 3)
            for prev_word in tokens[window_start:i]:
                if prev_word in _NEGATIONS:
                    negated = True
                    break

            # Check for booster word immediately preceding
            booster = 0.0
            if i > 0 and tokens[i - 1] in _BOOSTERS:
                booster = _BOOSTERS[tokens[i - 1]]

            if val > 0:
                val += booster
            else:
                val -= booster

            if negated:
                val = -val * 0.75

            scores.append(val)
        i += 1

    # If text had no lexicon words, use star rating as auxiliary signal if present
    if not scores:
        if star_rating is not None:
            normalized_star = (star_rating - 3) / 2.0  # 1 -> -1.0, 3 -> 0.0, 5 -> 1.0
            label = "positive" if star_rating >= 4 else ("neutral" if star_rating == 3 else "negative")
            return {
                "compound_score": round(normalized_star, 2),
                "label": label,
                "confidence": 0.65,
                "star_alignment": True
            }
        return {"compound_score": 0.0, "label": "neutral", "confidence": 0.5, "star_alignment": True}

    # Compute compound score using standard VADER normalization formula:
    # x / sqrt(x^2 + alpha), where alpha = 15
    sum_score = sum(scores)
    compound = sum_score / math.sqrt((sum_score * sum_score) + 15.0)

    # Blend 15% with star rating if available to handle sarcasm or ratings discordance
    if star_rating is not None:
        normalized_star = (star_rating - 3) / 2.0
        compound = (compound * 0.85) + (normalized_star * 0.15)

    compound = max(-1.0, min(1.0, round(compound, 3)))

    if compound >= 0.15:
        label = "positive"
    elif compound <= -0.15:
        label = "negative"
    else:
        label = "neutral"

    # Alignment check with star rating
    star_aligned = True
    if star_rating is not None:
        if (label == "positive" and star_rating < 3) or (label == "negative" and star_rating > 3):
            star_aligned = False

    confidence = round(min(0.99, max(0.5, abs(compound) + 0.35)), 2)

    return {
        "compound_score": compound,
        "label": label,
        "confidence": confidence,
        "star_alignment": star_aligned
    }


def get_sentiment_summary(reviews: List[Any]) -> Dict[str, Any]:
    """
    Computes aggregated sentiment stats across a list of Review objects or dicts.
    """
    total = len(reviews)
    if total == 0:
        return {
            "total_analyzed": 0,
            "positive_percent": 0.0,
            "neutral_percent": 0.0,
            "negative_percent": 0.0,
            "average_sentiment": 0.0,
            "summary_tag": "No Reviews"
        }

    pos = 0
    neu = 0
    neg = 0
    total_score = 0.0

    for r in reviews:
        # Support dict or SQLAlchemy model
        comment = getattr(r, "comment", None) if not isinstance(r, dict) else r.get("comment")
        rating = getattr(r, "rating", None) if not isinstance(r, dict) else r.get("rating")
        sentiment = getattr(r, "sentiment", None) if not isinstance(r, dict) else r.get("sentiment")
        score = getattr(r, "sentiment_score", None) if not isinstance(r, dict) else r.get("sentiment_score")

        if sentiment is None or score is None:
            res = analyze_sentiment(comment, rating)
            label = res["label"]
            score = res["compound_score"]
        else:
            label = sentiment

        if label == "positive":
            pos += 1
        elif label == "negative":
            neg += 1
        else:
            neu += 1

        total_score += float(score or 0.0)

    avg_score = round(total_score / total, 2)
    pos_pct = round((pos / total) * 100, 1)
    neu_pct = round((neu / total) * 100, 1)
    neg_pct = round((neg / total) * 100, 1)

    if pos_pct >= 75:
        summary_tag = "Overwhelmingly Positive"
    elif pos_pct >= 55:
        summary_tag = "Mostly Positive"
    elif neg_pct >= 40:
        summary_tag = "Mixed / Needs Review"
    else:
        summary_tag = "Neutral Satisfaction"

    return {
        "total_analyzed": total,
        "positive_percent": pos_pct,
        "neutral_percent": neu_pct,
        "negative_percent": neg_pct,
        "average_sentiment": avg_score,
        "summary_tag": summary_tag
    }

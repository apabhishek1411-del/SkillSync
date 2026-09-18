"""
Semantic Smart Search Engine for SkillSphere.

Combines domain-specific query expansion with a Vector Space Model (TF-IDF + Cosine Similarity)
to enable students to search in natural language (e.g., 'need help with python exam' -> matches 'Programming Tutor').
Works completely offline without external API costs, with automatic fallback for high reliability.
"""
import re
import math
from collections import Counter
from typing import List, Dict, Any, Tuple, Optional

# Campus and micro-gig semantic synonym clusters
SYNONYM_CLUSTERS = {
    "coding": ["programming", "code", "developer", "software", "script", "bug", "python", "java", "c++", "web", "frontend", "backend"],
    "tutor": ["teaching", "tutoring", "teach", "learn", "study", "exam", "assignment", "help", "concept", "guidance", "notes"],
    "design": ["poster", "banner", "flyer", "logo", "graphics", "canva", "photoshop", "illustrator", "ui", "ux", "visual", "art"],
    "writing": ["content", "essay", "report", "journal", "documentation", "record", "resume", "cv", "copywriting", "proofreading"],
    "video": ["editing", "premiere", "aftereffects", "reels", "shorts", "animation", "motion", "youtube", "media", "audio"],
    "hardware": ["electronics", "circuit", "arduino", "iot", "pcb", "sensors", "microcontroller", "embedded"],
    "math": ["calculus", "linear algebra", "statistics", "probability", "discrete", "maths"],
}

STOPWORDS = {
    "a", "about", "an", "and", "are", "as", "at", "be", "by", "can", "do", "for",
    "from", "get", "got", "have", "he", "her", "him", "his", "how", "i", "if", "in",
    "is", "it", "its", "me", "my", "of", "on", "or", "our", "please", "she", "so",
    "some", "someone", "that", "the", "their", "them", "then", "there", "these",
    "they", "this", "to", "us", "want", "was", "we", "were", "what", "when", "where",
    "which", "who", "will", "with", "would", "you", "your"
}


def tokenize(text: str) -> List[str]:
    """Tokenize and remove punctuation and basic stopwords."""
    if not text:
        return []
    words = re.findall(r"\b[a-zA-Z0-9+#.-]+\b", text.lower())
    return [w for w in words if w not in STOPWORDS and len(w) > 1]


def expand_query(query_tokens: List[str]) -> List[str]:
    """Expands query tokens with relevant semantic domain synonyms."""
    expanded = list(query_tokens)
    for token in query_tokens:
        for key, cluster in SYNONYM_CLUSTERS.items():
            if token == key or token in cluster:
                # Add up to 3 most relevant terms from the cluster
                related = [t for t in cluster if t != token][:3]
                expanded.extend(related)
    return expanded


def compute_tf(tokens: List[str]) -> Dict[str, float]:
    """Compute sublinear Term Frequency: 1 + log(tf) if tf > 0."""
    counts = Counter(tokens)
    tf_dict = {}
    for term, count in counts.items():
        tf_dict[term] = 1.0 + math.log(count)
    return tf_dict


def cosine_similarity(v1: Dict[str, float], v2: Dict[str, float]) -> float:
    """Computes cosine similarity between two sparse term weight vectors."""
    common_keys = set(v1.keys()) & set(v2.keys())
    if not common_keys:
        return 0.0

    dot_product = sum(v1[k] * v2[k] for k in common_keys)
    norm1 = math.sqrt(sum(val * val for val in v1.values()))
    norm2 = math.sqrt(sum(val * val for val in v2.values()))

    if norm1 == 0.0 or norm2 == 0.0:
        return 0.0

    return dot_product / (norm1 * norm2)


def rank_services_by_semantic_relevance(
    query_str: str,
    services: List[Any],
    min_score_threshold: float = 0.08
) -> List[Tuple[Any, float]]:
    """
    Ranks a list of ServiceListing objects or dicts by semantic similarity to query_str.
    Returns: List of (service, similarity_score) sorted descending by relevance score.
    """
    if not query_str or not services:
        return [(s, 1.0) for s in services]

    raw_query_tokens = tokenize(query_str)
    if not raw_query_tokens:
        return [(s, 1.0) for s in services]

    expanded_query_tokens = expand_query(raw_query_tokens)
    query_tf = compute_tf(expanded_query_tokens)

    # Pre-process documents and compute document frequencies for IDF
    doc_vectors = []
    doc_count = len(services)
    term_doc_counts: Dict[str, int] = Counter()

    for s in services:
        # Extract fields
        title = getattr(s, "title", "") if not isinstance(s, dict) else s.get("title", "")
        desc = getattr(s, "description", "") if not isinstance(s, dict) else s.get("description", "")
        short_desc = getattr(s, "short_description", "") if not isinstance(s, dict) else s.get("short_description", "")
        
        # Skill/category names if available
        skill_name = ""
        category_name = ""
        skill = getattr(s, "skill", None) if not isinstance(s, dict) else s.get("skill")
        if skill:
            skill_name = getattr(skill, "name", "") if not isinstance(skill, dict) else skill.get("name", "")
            category = getattr(skill, "category", None) if not isinstance(skill, dict) else skill.get("category")
            if category:
                category_name = getattr(category, "name", "") if not isinstance(category, dict) else category.get("name", "")

        # Weight title and skill heavier than description
        weighted_text = f"{title} {title} {title} {skill_name} {skill_name} {category_name} {short_desc} {desc}"
        doc_tokens = tokenize(weighted_text)
        
        tf = compute_tf(doc_tokens)
        doc_vectors.append(tf)

        for term in set(doc_tokens):
            term_doc_counts[term] += 1

    # Compute IDF weights: log(1 + (N / df))
    idf = {}
    for term, df in term_doc_counts.items():
        idf[term] = math.log(1.0 + (doc_count / float(df)))

    # Apply TF-IDF weighting to query vector
    weighted_query = {}
    for term, q_tf in query_tf.items():
        term_idf = idf.get(term, 1.0)
        weighted_query[term] = q_tf * term_idf

    # Score each service
    scored_results = []
    for idx, (service, doc_tf) in enumerate(zip(services, doc_vectors)):
        weighted_doc = {}
        for term, d_tf in doc_tf.items():
            term_idf = idf.get(term, 1.0)
            weighted_doc[term] = d_tf * term_idf

        score = cosine_similarity(weighted_query, weighted_doc)

        # Direct token match bonus
        title_lower = (getattr(service, "title", "") if not isinstance(service, dict) else service.get("title", "")).lower()
        if any(qt in title_lower for qt in raw_query_tokens):
            score += 0.15

        if score >= min_score_threshold:
            scored_results.append((service, round(score, 3)))

    # Sort by relevance descending
    scored_results.sort(key=lambda x: x[1], reverse=True)
    return scored_results

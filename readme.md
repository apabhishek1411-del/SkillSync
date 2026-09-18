# SkillSphere — Campus Skill Exchange Marketplace

> **Campus-Exclusive Micro-Job Network for College of Engineering Chengannur (`@ceconline.edu`)**  
> A production-grade platform connecting skilled student peers for event poster design, programming tutoring, academic reports, video editing, and technical campus projects.

---

## 🏗️ System Architecture

```
                                    +---------------------------+
                                    |     Client Browser        |
                                    |  React 18 + Vite + Tailwind|
                                    +-------------+-------------+
                                                  |  HTTPS / REST / JSON
                                                  v
                                    +---------------------------+
                                    |   FastAPI Application     |
                                    |  (Uvicorn / Python 3.11)  |
                                    +-------------+-------------+
                                                  |
                 +--------------------------------+--------------------------------+
                 |                                |                                |
                 v                                v                                v
   +---------------------------+    +---------------------------+    +---------------------------+
   |   PostgreSQL 15 (DB)      |    |   AI / ML Subsystem       |    |  Razorpay Payment Engine  |
   | AsyncPG + SQLAlchemy 2.0  |    | • VADER-style NLP Reviews |    | • Order creation          |
   | Users, Services, Orders   |    | • TF-IDF Vector Search    |    | • HMAC signature check    |
   +---------------------------+    +---------------------------+    +---------------------------+
```

---

## 🤖 AI & Machine Learning Subsystem

SkillSphere includes built-in AI/ML capabilities specifically tailored for student peer marketplaces, running **100% locally and offline without external API costs or data privacy concerns**:

### 1. NLP Review Sentiment Analysis (`app/ml/sentiment.py`)
- **Model Architecture**: Hybrid rule-based and lexicon-driven Sentiment Intensity Analysis tuned for peer feedback and campus service deliverables.
- **Features**:
  - Automatically evaluates review comments upon submission (`POST /api/v1/reviews`).
  - Computes a normalized compound polarity score from **-1.0 (Highly Negative)** to **+1.0 (Highly Positive)**.
  - Accounts for valence shifters: handles negations (*"not bad"*, *"never disappointed"*), booster words (*"extremely fast"*, *"super helpful"*), and all-caps emphasis.
  - Automatically classifies reviews into `positive`, `neutral`, or `negative`.
  - Produces an aggregate sentiment breakdown for providers and services (*e.g., 94% Positive Peer Rating*).

### 2. Semantic Smart Search (`app/ml/semantic_search.py`)
- **Model Architecture**: Vector Space Model using sublinear Term Frequency–Inverse Document Frequency (TF-IDF) representation combined with domain-specific synonym expansion.
- **Features**:
  - Enables natural language queries (*e.g., "help with my python assignment"*, *"make slides for seminar"*, *"circuit board troubleshooting"*).
  - Automatically matches conceptual synonyms across 7 campus domains (Coding, Tutoring, Design, Writing, Video, Hardware, Mathematics).
  - Calculates Cosine Similarity between query vectors and multi-field service listings (title, skill tag, category, and description).
  - **Graceful Fallback**: If an exact SQL `ILIKE` query yields 0 results, the semantic engine automatically activates to find conceptually relevant services.
  - Dedicated API endpoint: `GET /api/v1/services/search/semantic?q=...`

---

## 🛡️ Security Hardening (Phase 2 Implementations)

1. **Zero Hardcoded Secrets**: Application halts on startup if `SECRET_KEY` or `JWT_SECRET_KEY` use insecure defaults in production mode.
2. **Rate Limiting**: Sliding-window in-memory rate limiting on authentication routes (`/auth/login`, `/auth/register`, `/auth/refresh`) capped at 10 requests/minute per IP.
3. **Magic-Byte File Upload Validation**: Validates actual binary signatures (`FF D8 FF` for JPEG, `89 50 4E 47` for PNG, etc.) rather than trusting client-provided `Content-Type`.
4. **No Financial Double-Counting**: Earnings and expenditures are strictly reconciled via Razorpay verification callbacks.
5. **Private User Data**: Student profiles (`GET /api/v1/users/{id}`) require authentication to prevent unauthenticated harvesting of campus PII.
6. **Whitelist-based Sorting**: Protects against arbitrary attribute extraction via strict whitelist validation on query parameters.
7. **Safe Token Interceptor**: Frontend axios interceptor queues requests during token refresh to avoid 401 redirect thrashing.

---

## 🚀 Quick Start (Docker - Recommended)

### 1. Configure Environment
```bash
cp .env.example .env
# Edit .env to set your JWT secret and database credentials if desired
```

### 2. Launch Containers
```bash
docker-compose up --build
```
- **Web App**: `http://localhost:3000`
- **FastAPI Backend**: `http://localhost:8000`
- **Interactive OpenAPI Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/health`

---

## 💻 Manual Setup (Bare Metal)

### Backend Prerequisites
- Python 3.11+
- PostgreSQL 15 running locally

```bash
# 1. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Initialize database tables and seed test data
python3 seed_data.py

# 4. Start the backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup
- Node.js 18+ and npm

```bash
cd frontend
npm install
npm run dev
# App will be accessible at http://localhost:3000 or http://localhost:5173
```

---

## ⚙️ Environment Variables Reference

| Variable | Description | Default / Example |
|---|---|---|
| `APP_NAME` | Name of the deployment | `SkillSphere` |
| `APP_ENV` | Environment (`development` or `production`) | `development` |
| `DEBUG` | Enable debug logs & reload | `true` |
| `SECRET_KEY` | Application session encryption key | *Generate random 64-char string* |
| `DATABASE_URL` | Async connection string for PostgreSQL | `postgresql+asyncpg://skillhub:skillhub123@localhost:5432/skillhub` |
| `DATABASE_URL_SYNC`| Sync connection string for Alembic | `postgresql://skillhub:skillhub123@localhost:5432/skillhub` |
| `JWT_SECRET_KEY` | Secret used to sign authentication tokens | *Generate random 64-char string* |
| `JWT_ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifespan | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifespan | `7` |
| `ALLOWED_EMAIL_DOMAIN` | Campus restricted domain | `ceconline.edu` |
| `ADMIN_EMAIL` | Initial admin account email | `admin@ceconline.edu` |
| `ADMIN_PASSWORD` | Initial seed admin password | *Change after first setup* |
| `RAZORPAY_KEY_ID` | Razorpay Gateway public key | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay Gateway private secret | `...` |
| `RAZORPAY_WEBHOOK_SECRET` | Secret for webhook signature check | `...` |

---

## 🧪 Running Tests

```bash
# Run backend test suite with pytest
pytest -v

# Run with test coverage
pytest --cov=app tests/
```

---

## 📝 Architecture Decisions Log (ADR)

1. **Why Async SQLAlchemy with AsyncPG?**
   Campus network usage is bursty (e.g. before project submission deadlines or college fests). Non-blocking async I/O ensures the server handles hundreds of concurrent student chat messages and order status updates on minimal server hardware.

2. **Why Offline VADER + TF-IDF instead of Cloud LLM APIs?**
   - **Zero Operating Cost**: College student projects cannot incur monthly OpenAI/Anthropic API bills.
   - **Student Data Privacy**: Review text and student deliverables never leave the campus server.
   - **Ultra-low Latency**: Rule-based sentiment analysis executes in sub-millisecond time (< 1ms) without network overhead.

3. **Why Dual Token (Access + Refresh) in LocalStorage with Active Interceptor?**
   Provides smooth UX on mobile campus Wi-Fi while restricting token lifespan to 30 minutes. The Axios response interceptor automatically handles silent refresh before retrying failed queries.

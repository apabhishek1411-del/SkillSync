"""Build SkillSphere_Project_Overview.pdf (study guide + screenshot appendix)."""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                                PageBreak, Image, KeepTogether, ListFlowable, ListItem)
from PIL import Image as PILImage

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HERE, "screenshots")
OUT = os.path.join(HERE, "SkillSphere_Project_Overview.pdf")

PRIMARY = colors.HexColor("#4f46e5")
SOFT = colors.HexColor("#eef2ff")
ss = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=ss["Heading1"], textColor=PRIMARY, fontSize=19, spaceBefore=6, spaceAfter=8)
H2 = ParagraphStyle("H2", parent=ss["Heading2"], textColor=colors.HexColor("#1e1b4b"), fontSize=13.5, spaceBefore=10, spaceAfter=4)
B = ParagraphStyle("B", parent=ss["BodyText"], fontSize=10.3, leading=15)
SM = ParagraphStyle("SM", parent=B, fontSize=9, leading=12, textColor=colors.HexColor("#475569"))
TITLE = ParagraphStyle("T", parent=ss["Title"], fontSize=32, textColor=PRIMARY, leading=38)
SUB = ParagraphStyle("S", parent=B, fontSize=13, textColor=colors.HexColor("#334155"), alignment=1)
CELL = ParagraphStyle("C", parent=B, fontSize=9.2, leading=12.5)
CELLB = ParagraphStyle("CB", parent=CELL, fontName="Helvetica-Bold")


def P(t, s=B): return Paragraph(t, s)
def bullets(items): return ListFlowable([ListItem(P(i), leftIndent=12) for i in items], bulletType="bullet", leftIndent=14, bulletFontSize=7)


def table(rows, widths, header=True):
    data = [[P(c, CELLB if (header and r == 0) else CELL) for c in row] for r, row in enumerate(rows)]
    t = Table(data, colWidths=widths, repeatRows=1 if header else 0)
    st = [("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cbd5e1")), ("VALIGN", (0, 0), (-1, -1), "TOP"),
          ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]
    if header: st.append(("BACKGROUND", (0, 0), (-1, 0), SOFT))
    t.setStyle(TableStyle(st))
    return t


def callout(text):
    t = Table([[P(text)]], colWidths=[16.8 * cm])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fef9c3")),
                           ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#eab308")),
                           ("LEFTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
    return t


def footer(c, d):
    c.saveState(); c.setFont("Helvetica", 8); c.setFillColor(colors.grey)
    c.drawString(2 * cm, 1.1 * cm, "SkillSphere - Project Overview (Presentation Study Guide)")
    c.drawRightString(A4[0] - 2 * cm, 1.1 * cm, f"Page {d.page}")
    c.restoreState()


S = []
# ---------------- cover ----------------
S += [Spacer(1, 5 * cm), P("SkillSphere", TITLE), Spacer(1, 6),
      P("Campus Skill Exchange Marketplace", SUB), Spacer(1, 4),
      P("College of Engineering Chengannur (@ceconline.edu)", SUB), Spacer(1, 1.2 * cm),
      P("Project Overview &amp; Presentation Study Guide", SUB), Spacer(1, 1.5 * cm),
      callout("<b>How to use this guide:</b> Part 1 explains the project in plain language. Part 2 explains how it is built. "
              "Part 3 covers the AI/ML features. Part 4 is the live demo script. Part 5 lists likely viva questions with answers. "
              "The appendix has the screenshots to paste into your slides."),
      PageBreak()]

# ---------------- 1. what is it ----------------
S += [P("1. What is SkillSphere? (in simple words)", H1),
      P("SkillSphere is a <b>website where college students hire each other</b> for small jobs. Think of it as a mini "
        "<i>Fiverr / Upwork</i> that works <b>only inside our college</b>. A student who is good at poster design, Python, "
        "report writing or video editing can list a <b>service</b> and set a price. Another student who needs that help can "
        "<b>order it, chat, pay safely, receive the work and leave a review</b>."),
      P("<b>The problem it solves</b>", H2),
      bullets(["Students with skills have no organised way to earn money from them on campus.",
               "Students needing quick help (a fest poster, a lab report, DSA tutoring) rely on random WhatsApp messages, with no trust, no proof of quality and no payment safety.",
               "Public freelancing sites are costly, overseas, and not designed for student budgets or campus deadlines."]),
      P("<b>Our solution</b>", H2),
      bullets(["<b>Campus-only:</b> sign-up works only with a college email ending in @ceconline.edu, so everyone is a verified student.",
               "<b>Full job lifecycle in one place:</b> discover, order, chat, deliver, pay, review.",
               "<b>Trust:</b> verified reviews with AI sentiment tags, provider profiles with portfolios, ratings.",
               "<b>Smart search:</b> type what you need in normal English and the system finds relevant services.",
               "<b>Safe payments:</b> Razorpay payment with signature verification and a downloadable receipt."]),
      P("<b>Who uses it? (three roles)</b>", H2),
      table([["Role", "What they do"],
             ["Student as Client (buyer)", "Searches services, places orders, chats, pays, reviews and can edit their review."],
             ["Student as Provider (seller)", "Creates services, accepts and delivers orders, replies to reviews, tracks earnings, shows a portfolio. (Any student can be both.)"],
             ["Admin", "Manages users, verifies services, moderates reviews, sees platform statistics."]],
            [4.6 * cm, 12.2 * cm]),
      PageBreak()]

# ---------------- 2. features ----------------
S += [P("2. Main features (what you will show)", H1),
      table([["Feature", "What it means", "Where in the app"],
             ["Registration &amp; Login", "Only @ceconline.edu emails. Secure login with tokens (JWT). Rate limit stops password guessing.", "/register, /login"],
             ["Service marketplace", "Browse, filter by category, price, rating. Each service has description, price, delivery days, revisions.", "/services"],
             ["AI Smart Search", "Search in natural language, e.g. 'help with my python assignment'.", "/services search bar"],
             ["Orders", "Client places an order with requirements. Status moves: Pending, Accepted, In Progress, Delivered, (Revision), Completed. Cancel or reject possible.", "/orders, /orders/:id"],
             ["Payments &amp; Receipt", "Client pays after delivery via Razorpay. A printable receipt shows order no., transaction ID, method, date, amount.", "Order page: Pay / Receipt"],
             ["Reviews with AI sentiment", "Client rates 1-5 stars and writes a comment. AI tags it Positive / Neutral / Negative. Client can edit; provider can reply.", "Order page, service page"],
             ["Provider reply", "Provider answers a review publicly (and can edit the reply).", "Order page (provider login)"],
             ["Earnings dashboard", "Total earned, pending earnings, jobs done, average job value, monthly bar chart, top services.", "/earnings"],
             ["Portfolio &amp; profiles", "Student shows past projects with images, tags and links, plus ratings and reviews.", "/profile, /users/:id"],
             ["Chat &amp; Notifications", "Direct messages between client and provider; bell icon for alerts.", "/messages"],
             ["Admin dashboard", "User control, service verification, flagged review moderation.", "/admin"]],
            [3.4 * cm, 9.4 * cm, 4 * cm]),
      P("<b>The order journey (story to tell)</b>", H2),
      P("1. Client finds a service &rarr; 2. places an order &rarr; 3. provider <b>accepts</b> &rarr; 4. provider <b>starts work</b> "
        "(client can chat) &rarr; 5. provider <b>marks delivered</b> &rarr; 6. client <b>pays</b> (order becomes <b>Completed</b>, receipt generated, "
        "provider's earnings update) &rarr; 7. client <b>reviews</b> &rarr; 8. AI tags sentiment and ratings update &rarr; 9. provider <b>replies</b>."),
      PageBreak()]

# ---------------- 3. architecture ----------------
S += [P("3. How it is built (architecture, simplified)", H1),
      P("The project follows the common <b>three-tier</b> design: a screen the user sees, a brain that applies the rules, and a database that stores data."),
      table([["Layer", "Technology", "Simple explanation"],
             ["Frontend (what you see)", "React 18, Vite, Tailwind CSS", "React builds the pages as reusable pieces; Vite runs/builds it quickly; Tailwind styles it. Supports dark mode and mobile."],
             ["Backend (the brain)", "FastAPI (Python), Uvicorn", "Receives requests from the website (REST API), checks who you are, applies rules (like 'only client can review'), talks to the database. Auto-generates API docs at /docs."],
             ["Database", "PostgreSQL + SQLAlchemy (async)", "Stores users, services, orders, reviews, payments, chats, portfolios, notifications. 'Async' lets it serve many students at once."],
             ["AI / ML", "Python (offline)", "Sentiment analysis for reviews and TF-IDF semantic search. Runs on our own server, no paid API."],
             ["Payments", "Razorpay", "Creates a payment order; after payment, the server verifies the HMAC signature to prove it is genuine."],
             ["Deployment", "Docker Compose", "Packages frontend, backend and database so it runs anywhere with one command."]],
            [3.6 * cm, 4.2 * cm, 9 * cm]),
      P("<b>Request flow in one line:</b> Browser (React) &rarr; HTTP/JSON &rarr; FastAPI route &rarr; business rules &rarr; PostgreSQL &rarr; response back to the page.", B),
      P("<b>Database tables (main ones)</b>", H2),
      table([["Table", "Stores"],
             ["users", "name, email, department, role (student/admin), rating, earnings"],
             ["categories / skills", "Design, Writing, Academic, Technology, Media, Electronics and their skills"],
             ["service_listings", "the services providers offer: title, price, delivery days, revisions, rating"],
             ["orders", "who ordered what, price, status, payment status, dates"],
             ["payment_transactions", "Razorpay order/payment IDs, amount, method, status (used for receipt)"],
             ["reviews", "rating, comment, AI sentiment label and score, provider reply"],
             ["conversations / messages", "chat between two users"],
             ["portfolio_projects", "a student's showcase projects (image, link, tags)"],
             ["notifications", "alerts shown under the bell icon"]],
            [4.6 * cm, 12.2 * cm]),
      P("<b>Security measures (good to mention)</b>", H2),
      bullets(["Passwords are stored hashed, never in plain text.", "JWT access token (30 min) + refresh token (7 days), automatic silent refresh.",
               "Login/registration limited to 10 requests per minute per IP (rate limiting).",
               "Only @ceconline.edu emails allowed; only the order's client can review; only the reviewer can edit the review; only the reviewee can reply.",
               "Uploaded images are checked by their real file signature (magic bytes), not just the file name.",
               "Payment verified using HMAC-SHA256 signature; student profiles require login."]),
      PageBreak()]

# ---------------- 4. AI ----------------
S += [P("4. The AI / ML features (your highlight)", H1),
      callout("<b>Key selling point:</b> both AI features run <b>fully offline on our own server</b> - zero cost, student data stays private, and responses are instant."),
      P("A. Review Sentiment Analysis", H2),
      P("<b>What it does:</b> when a student writes a review, the system reads the comment and decides whether it is <b>positive, neutral or negative</b>, "
        "with a score from -1 (very negative) to +1 (very positive). The service page shows the tag and an overall summary like '94% positive'."),
      P("<b>How it works (simple):</b> it uses a <b>VADER-style lexicon</b> - a dictionary where each word has an emotion score (e.g. 'excellent' = +, 'terrible' = -). "
        "It adds the scores and then adjusts for tricky language: <b>negation</b> ('not good' flips meaning), <b>boosters</b> ('extremely fast' increases strength) and "
        "<b>CAPITALS</b> for emphasis. The final compound score decides the label. It also considers the star rating."),
      P("<b>Why not ChatGPT/cloud AI?</b> Cost, privacy of student data, speed (&lt;1 ms) and works without internet."),
      P("B. Semantic Smart Search", H2),
      P("<b>What it does:</b> students can search the way they speak. 'Help with my python assignment' still finds 'Python &amp; ML Assignment Help' even when words differ; "
        "'circuit board' can find 'PCB Design'."),
      P("<b>How it works (simple):</b> every service (title + skill + category + description) is turned into a list of numbers using <b>TF-IDF</b> - rare, meaningful words get more weight "
        "than common ones. The query is turned into numbers too, after adding <b>synonyms</b> from 7 campus topics (coding, tutoring, design, writing, video, hardware, maths). "
        "Then <b>cosine similarity</b> measures how close the query is to each service, and the closest results are ranked first."),
      P("<b>Fallback:</b> normal keyword search runs first; if it finds nothing, the semantic engine takes over."),
      table([["Term", "One-line meaning"],
             ["TF-IDF", "A score showing how important a word is in a document compared with all documents."],
             ["Cosine similarity", "A number from 0 to 1 showing how similar two texts are."],
             ["Lexicon", "A dictionary of words with pre-assigned sentiment scores."],
             ["Compound score", "Single final sentiment value from -1 to +1."]],
            [4 * cm, 12.8 * cm]),
      PageBreak()]

# ---------------- 5. demo script ----------------
S += [P("5. Live demo script (about 8 minutes)", H1),
      P("<b>Accounts</b> (password for all students: <b>Test@1234</b>; admin: admin@ceconline.edu / Admin@123)."),
      table([["Step", "What to do", "What to say"],
             ["1", "Open http://localhost:3000 (landing page).", "Introduce the problem and the idea: campus-only skill marketplace."],
             ["2", "Log in as client <b>arun.krishnan@ceconline.edu</b>. Show Dashboard.", "Role-based dashboard, stats, recent orders."],
             ["3", "Go to Services. Type 'help with my python assignment'.", "AI semantic search: understands meaning, not just exact words."],
             ["4", "Open a service detail page, scroll to reviews.", "Reviews with AI sentiment tags and the sentiment summary."],
             ["5", "Open Orders, open a completed order. Show timeline and Receipt.", "Full lifecycle; payment verified; printable receipt."],
             ["6", "On the same order, click Edit review, change text, save.", "Reviews are editable; sentiment and ratings recalculate."],
             ["7", "Log out. Log in as provider <b>arjun.kumar@ceconline.edu</b>. Open same order, click Reply to this review.", "Provider can respond publicly to feedback."],
             ["8", "Open Earnings.", "Total earned, pending, monthly chart, top services."],
             ["9", "Open a profile (portfolio).", "Students showcase projects to build trust."],
             ["10", "Log in as admin and show the admin dashboard.", "Moderation and platform control."],
             ["11", "Optional: open http://localhost:8000/docs", "Auto-generated API documentation (FastAPI/OpenAPI)."]],
            [1.2 * cm, 8.2 * cm, 7.4 * cm]),
      P("Tip: the order used in these screenshots is arun.krishnan (client) &rarr; arjun.kumar (provider). Keep the backend (port 8000) and frontend (port 3000) running.", SM),
      PageBreak()]

# ---------------- 6. viva ----------------
qa = [
    ("Why did you build this?", "Students have skills but no trusted place to offer them on campus. SkillSphere gives a safe, campus-only marketplace for small paid jobs."),
    ("How is it different from Fiverr?", "Campus-only verified students, student-friendly prices, AI search and sentiment built in, and no external fees."),
    ("What technologies did you use and why?", "React + Tailwind for a fast responsive UI, FastAPI for a quick async Python backend with automatic docs, PostgreSQL for reliable relational data, Razorpay for payments, Docker for easy deployment."),
    ("Why FastAPI instead of Django/Flask?", "It is async (handles many users), has built-in validation with Pydantic and auto API docs, and is easy to pair with Python ML code."),
    ("Why PostgreSQL?", "Our data is relational (users, orders, reviews are linked) and needs transactions and integrity, which PostgreSQL handles well."),
    ("How does login work?", "Email and password are checked; the password is stored hashed. The server returns a JWT access token and a refresh token. The frontend sends the token with every request and refreshes it silently."),
    ("How do you ensure only college students join?", "Registration only accepts emails ending in @ceconline.edu."),
    ("Explain the order lifecycle.", "Pending, Accepted, In Progress, Delivered, optional Revision, then Completed after payment. Cancelled/Rejected are the alternate endings. Each change is checked by the server so only the right person can do it."),
    ("How is payment secured?", "The server creates the payment order with Razorpay, the user pays in Razorpay's checkout, and the server verifies the HMAC-SHA256 signature before marking the order paid. In demo mode a mock checkout is used."),
    ("How does sentiment analysis work?", "A lexicon-based VADER-style model scores words, adjusts for negations, boosters and capitals, and produces a compound score from -1 to +1, which maps to positive/neutral/negative."),
    ("How does the smart search work?", "TF-IDF vectors of services and the query (expanded with synonyms) are compared with cosine similarity and ranked. Keyword search is tried first, semantic is the fallback."),
    ("Why not use a big AI model/API?", "Cost, privacy, speed and offline operation. Our needs are small and well served by lightweight models."),
    ("Can a review be edited? Who can reply?", "Yes, only the client who wrote it can edit it, and ratings recalculate. Only the provider who was reviewed can reply, and can edit that reply."),
    ("What security measures are there?", "Hashed passwords, JWT tokens with expiry, rate limiting, role checks on every action, upload validation by file signature, payment signature verification, login-protected profiles."),
    ("How do you handle many users at once?", "Async FastAPI and async database access let one server handle many concurrent requests without blocking."),
    ("What are the limitations and future scope?", "Payments run in test/mock mode; no real wallet payouts; chat is polling-based. Future: real-time chat (WebSockets), mobile app, escrow payouts, recommendations, dispute resolution."),
    ("How did you test it?", "Automated backend tests with pytest (tests folder) plus manual end-to-end testing with seeded demo data."),
    ("How do you run the project?", "Backend: uvicorn app.main:app --port 8000. Frontend: npm run dev inside the frontend folder (port 3000). Or docker-compose up. PostgreSQL must be running."),
]
S += [P("6. Likely questions and easy answers", H1)]
for q, a in qa:
    S.append(KeepTogether([P(f"<b>Q. {q}</b>", B), P(f"A. {a}", B), Spacer(1, 5)]))
S += [PageBreak()]

# ---------------- 7. tech stack cheatsheet ----------------
S += [P("7. One-page cheat sheet", H1),
      table([["Item", "Value"],
             ["Project", "SkillSphere - campus skill exchange marketplace, CEC (@ceconline.edu)"],
             ["Frontend", "React 18, Vite, Tailwind CSS, Axios, React Router, Zustand (auth store), react-hot-toast"],
             ["Backend", "FastAPI, Uvicorn, SQLAlchemy 2 (async), Pydantic v2, JWT"],
             ["Database", "PostgreSQL 15 (asyncpg), Alembic migrations"],
             ["AI/ML", "VADER-style sentiment, TF-IDF + cosine similarity semantic search (offline)"],
             ["Payments", "Razorpay (HMAC verified), receipt generator"],
             ["Ports", "Frontend 3000, Backend 8000, API docs /docs, DB 5432"],
             ["Logins", "Students: <i>firstname.lastname</i>@ceconline.edu / Test@1234; Admin: admin@ceconline.edu / Admin@123"],
             ["Order states", "pending, accepted, in_progress, delivered, revision, completed, cancelled, rejected"],
             ["Review rules", "Client only, completed order only, one per order, editable by client, replied by provider"]],
            [3.6 * cm, 13.2 * cm]),
      PageBreak()]

# ---------------- appendix screenshots ----------------
CAPS = [
    ("01_landing.png", "Landing page - first impression of the platform."),
    ("02_login.png", "Login screen - campus email only."),
    ("03_dashboard_client.png", "Dashboard - overview of orders and activity."),
    ("04_service_catalog.png", "Service catalog with filters."),
    ("05_ai_semantic_search.png", "AI semantic search - natural-language query."),
    ("06_service_detail_reviews.png", "Service detail with reviews and AI sentiment."),
    ("07_orders_list.png", "Orders list with status badges."),
    ("08_order_detail_timeline.png", "Order detail - timeline, payment, review (edit option)."),
    ("09_payment_receipt.png", "Payment receipt (printable / save as PDF)."),
    ("10_order_review_reply_provider.png", "Provider view - reply to client's review."),
    ("11_earnings_dashboard.png", "Earnings dashboard with monthly chart."),
    ("12_portfolio_profile.png", "Provider profile with portfolio and reviews."),
    ("13_messages_chat.png", "Peer chat."),
    ("14_admin_dashboard.png", "Admin dashboard."),
    ("15_api_docs.png", "Auto-generated API documentation (FastAPI /docs)."),
]
S += [P("Appendix - Screenshots for your slides", H1),
      P("The same images (full resolution) are in the <b>presentation/screenshots</b> folder.", SM)]
maxw, maxh = 16.8 * cm, 21 * cm
for fn, cap in CAPS:
    path = os.path.join(SHOTS, fn)
    if not os.path.exists(path):
        continue
    w, h = PILImage.open(path).size
    r = min(maxw / w, maxh / h)
    S.append(KeepTogether([P(f"<b>{fn[:2]}. {cap}</b>", B), Spacer(1, 3),
                           Image(path, width=w * r, height=h * r), Spacer(1, 10)]))

SimpleDocTemplate(OUT, pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm, topMargin=1.8 * cm, bottomMargin=1.8 * cm,
                  title="SkillSphere Project Overview").build(S, onFirstPage=footer, onLaterPages=footer)
print("wrote", OUT)

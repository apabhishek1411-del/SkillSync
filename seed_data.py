"""
Seed script — creates dummy users, services, orders and reviews for testing.
Run from the project root:  python3 seed_data.py
"""
import asyncio
import random
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.config import settings

DATABASE_URL = settings.database_url

engine = create_async_engine(DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

# ── Lazy import of models after engine is ready ──────────────────────────────
from app.models import (
    User, UserRole, UserStatus,
    Category, Skill,
    ServiceListing, ServiceStatus, PricingType,
    Order, OrderStatus, PaymentStatus,
    Review,
)
from app.utils import get_password_hash
from app.ml.sentiment import analyze_sentiment


# ── Student profiles ─────────────────────────────────────────────────────────
STUDENTS = [
    dict(full_name="Arjun Kumar",    email="arjun.kumar@ceconline.edu",   department="CSE",   semester=6, batch="A", year_of_study=2026, student_id="CHN21CS001"),
    dict(full_name="Priya Menon",    email="priya.menon@ceconline.edu",    department="ECE",   semester=4, batch="B", year_of_study=2027, student_id="CHN22EC045"),
    dict(full_name="Rahul Sharma",   email="rahul.sharma@ceconline.edu",   department="MCA",   semester=2, batch="A", year_of_study=2027, student_id="CHN23MC012"),
    dict(full_name="Sneha Pillai",   email="sneha.pillai@ceconline.edu",   department="AI&ML", semester=5, batch="C", year_of_study=2026, student_id="CHN21AI033"),
    dict(full_name="Karthik Nair",   email="karthik.nair@ceconline.edu",   department="EEE",   semester=3, batch="D", year_of_study=2028, student_id="CHN23EE078"),
    dict(full_name="Divya Thomas",   email="divya.thomas@ceconline.edu",   department="CSE",   semester=7, batch="B", year_of_study=2025, student_id="CHN20CS099"),
    dict(full_name="Arun Krishnan",  email="arun.krishnan@ceconline.edu",  department="ECE",   semester=6, batch="A", year_of_study=2026, student_id="CHN21EC022"),
    dict(full_name="Meera Suresh",   email="meera.suresh@ceconline.edu",   department="MCA",   semester=4, batch="C", year_of_study=2026, student_id="CHN22MC017"),
]

# ── Service catalogue ─────────────────────────────────────────────────────────
SERVICES_SPEC = [
    # (title, description, category_slug, skill_slug, price, delivery_days, revisions)
    ("Professional Poster Design",
     "I will design stunning posters, banners and flyers for college events, fests and clubs using Canva & Photoshop. High-res printable files included.",
     "design", "poster-design", 499, 3, 2),

    ("Logo Design for Clubs & Startups",
     "Clean, modern logo designs with 3 concepts and unlimited revisions. Delivered in PNG, SVG and PDF formats.",
     "design", "logo-design", 799, 5, 3),

    ("UI/UX Design for Mobile Apps",
     "Figma-based UI/UX design — wireframes, prototypes and final screens. Student startup friendly pricing.",
     "design", "ui-ux-design", 1499, 7, 2),

    ("Technical Writing & Reports",
     "Professional technical reports, documentation and mini-project reports. IEEE format available.",
     "writing", "technical-writing", 399, 2, 1),

    ("DSA & Algorithm Tutoring",
     "Personalised tutoring for Data Structures & Algorithms — C++, Java or Python. Placement prep & lab exams.",
     "academic", "tutoring", 299, 1, 0),

    ("Full-Stack Web Development",
     "React + Node.js / FastAPI web apps. College project websites, portfolio sites, CRUD apps. Deployed on Vercel.",
     "technology", "web-development", 2499, 14, 2),

    ("Python & ML Assignment Help",
     "Help with Python assignments, Jupyter notebooks, ML models (scikit-learn, TensorFlow). Explanations included.",
     "academic", "assignment-help", 349, 2, 1),

    ("Video Editing (Reels & Shorts)",
     "Cinematic video editing for college events, YouTube, Instagram Reels. Color grading, subtitles & music sync.",
     "media", "video-editing", 599, 4, 2),

    ("PCB Design & Arduino Projects",
     "Schematic capture, PCB layout in KiCad/EasyEDA. Arduino & ESP32 based IoT projects with code.",
     "electronics", "pcb-design", 899, 7, 1),

    ("Excel / Spreadsheet Automation",
     "Automate boring Excel work with VBA macros, pivot tables and dashboards. Data cleaning & analysis included.",
     "technology", "excel-spreadsheets", 449, 3, 2),

    ("Essay & Content Writing",
     "Well-researched, plagiarism-free essays, blog posts and content for any topic. Up to 2000 words.",
     "writing", "essay-writing", 249, 2, 1),

    ("Photography for Events",
     "Campus event photography — fests, seminars, farewell parties. Edited photos delivered within 24 hours.",
     "media", "photography", 999, 1, 0),
]


async def seed():
    async with SessionLocal() as db:
        print("🌱 Starting seed...")

        # ── Fetch categories & skills ────────────────────────────────────────
        cat_result = await db.execute(select(Category))
        cats = {c.slug: c for c in cat_result.scalars().all()}

        skill_result = await db.execute(select(Skill))
        skills = {s.slug: s for s in skill_result.scalars().all()}

        if not cats:
            print("❌ No categories found — make sure the backend has started at least once to seed categories.")
            return

        # ── Create student users ─────────────────────────────────────────────
        hashed_pw = get_password_hash("Test@1234")
        created_users = []

        for s in STUDENTS:
            existing = (await db.execute(select(User).where(User.email == s["email"]))).scalar_one_or_none()
            if existing:
                print(f"  ↩  User exists: {s['email']}")
                created_users.append(existing)
                continue

            user = User(
                email=s["email"],
                hashed_password=hashed_pw,
                full_name=s["full_name"],
                department=s["department"],
                semester=s["semester"],
                batch=s["batch"],
                year_of_study=s["year_of_study"],
                student_id=s["student_id"],
                role=UserRole.STUDENT,
                status=UserStatus.ACTIVE,
                is_verified=True,
                bio=f"{s['full_name']} — {s['department']} student passionate about technology and learning.",
                total_earnings=0.0,
                total_spent=0.0,
                average_rating=0.0,
                total_reviews=0,
            )
            db.add(user)
            created_users.append(user)
            print(f"  ✅ Created user: {s['email']}")

        await db.flush()

        # ── Create services ──────────────────────────────────────────────────
        created_services = []
        for i, (title, desc, cat_slug, skill_slug, price, days, revisions) in enumerate(SERVICES_SPEC):
            # Round-robin provider assignment
            provider = created_users[i % len(created_users)]

            existing = (await db.execute(
                select(ServiceListing).where(ServiceListing.title == title)
            )).scalar_one_or_none()
            if existing:
                print(f"  ↩  Service exists: {title[:40]}")
                created_services.append(existing)
                continue

            cat = cats.get(cat_slug)
            skill = skills.get(skill_slug)

            svc = ServiceListing(
                title=title,
                description=desc,
                short_description=desc[:150],
                price=Decimal(str(price)),
                pricing_type=PricingType.FIXED,
                delivery_time_days=days,
                revision_count=revisions,
                status=ServiceStatus.APPROVED,
                provider_id=provider.id,
                skill_id=skill.id if skill else None,
                order_count=0,
                average_rating=0.0,
                total_reviews=0,
            )
            db.add(svc)
            created_services.append(svc)
            print(f"  ✅ Created service: {title[:45]}")

        await db.flush()

        # ── Create orders ────────────────────────────────────────────────────
        # We'll create orders in various lifecycle states for demo purposes
        ORDER_SCENARIOS = [
            # (service_idx, client_idx, status, payment_status, days_ago)
            (0,  2, OrderStatus.COMPLETED,   PaymentStatus.PAID,    10),
            (1,  3, OrderStatus.COMPLETED,   PaymentStatus.PAID,    15),
            (4,  1, OrderStatus.IN_PROGRESS, PaymentStatus.PENDING,  2),
            (5,  4, OrderStatus.DELIVERED,   PaymentStatus.PENDING,  1),
            (2,  5, OrderStatus.ACCEPTED,    PaymentStatus.PENDING,  3),
            (6,  6, OrderStatus.PENDING,     PaymentStatus.PENDING,  0),
            (7,  7, OrderStatus.COMPLETED,   PaymentStatus.PAID,    20),
            (3,  2, OrderStatus.CANCELLED,   PaymentStatus.PENDING,  5),
            (8,  3, OrderStatus.IN_PROGRESS, PaymentStatus.PENDING,  4),
            (9,  5, OrderStatus.COMPLETED,   PaymentStatus.PAID,     8),
            (10, 6, OrderStatus.PENDING,     PaymentStatus.PENDING,  0),
            (11, 7, OrderStatus.ACCEPTED,    PaymentStatus.PENDING,  1),
        ]

        created_orders = []
        order_counter = 1

        for svc_idx, client_idx, status, pay_status, days_ago in ORDER_SCENARIOS:
            svc = created_services[svc_idx % len(created_services)]
            client = created_users[client_idx % len(created_users)]

            # Skip if provider == client
            if svc.provider_id == client.id:
                client = created_users[(client_idx + 1) % len(created_users)]
            if svc.provider_id == client.id:
                print(f"  ⏭  Skipping — no valid client for service {svc_idx}")
                continue

            created_at = datetime.utcnow() - timedelta(days=days_ago)
            order_num = f"ORD-{created_at.strftime('%Y%m%d%H%M%S')}-{order_counter:04d}"
            order_counter += 1

            order = Order(
                order_number=order_num,
                requirements=f"I need this service done professionally. Please follow best practices and deliver on time. This is for my college project / event.",
                agreed_price=svc.price,
                expected_delivery=created_at + timedelta(days=svc.delivery_time_days),
                max_revisions=svc.revision_count,
                client_id=client.id,
                provider_id=svc.provider_id,
                service_id=svc.id,
                service_title=svc.title,
                status=status,
                payment_status=pay_status,
                created_at=created_at,
                updated_at=created_at,
            )

            if status in (OrderStatus.ACCEPTED, OrderStatus.IN_PROGRESS, OrderStatus.DELIVERED,
                          OrderStatus.COMPLETED, OrderStatus.REVISION):
                order.accepted_at = created_at + timedelta(hours=2)

            if status in (OrderStatus.DELIVERED, OrderStatus.COMPLETED):
                order.actual_delivery = created_at + timedelta(days=svc.delivery_time_days - 1)
                order.payment_method = random.choice(["upi", "card", "netbanking"])

            if status == OrderStatus.COMPLETED:
                order.completed_at = created_at + timedelta(days=svc.delivery_time_days)

            if status == OrderStatus.CANCELLED:
                order.cancellation_reason = "Change in project requirements. No longer needed."

            db.add(order)
            svc.order_count += 1
            created_orders.append(order)
            print(f"  ✅ Order {order_num} | {svc.title[:30]}... | {status.value}")

        await db.flush()

        # ── Update earnings for completed orders ─────────────────────────────
        for order in created_orders:
            if order.status == OrderStatus.COMPLETED and order.payment_status == PaymentStatus.PAID:
                # Update provider earnings
                provider_res = await db.execute(select(User).where(User.id == order.provider_id))
                provider = provider_res.scalar_one()
                provider.total_earnings += float(order.agreed_price)

                client_res = await db.execute(select(User).where(User.id == order.client_id))
                client = client_res.scalar_one()
                client.total_spent += float(order.agreed_price)

        # ── Create reviews for completed orders ──────────────────────────────
        REVIEW_DATA = [
            (5, "Outstanding work!", "Delivered exactly what I needed on time. Will definitely hire again!"),
            (5, "Excellent quality", "Very professional and responsive. The final output exceeded my expectations."),
            (4, "Great service",     "Good work, minor tweaks were needed but overall very satisfied."),
            (5, "Highly recommended","Best on campus for this kind of work. Worth every rupee!"),
            (4, "Solid delivery",    "Completed the task well within the deadline. Clear communication throughout."),
        ]

        review_idx = 0
        for order in created_orders:
            if order.status == OrderStatus.COMPLETED:
                # Check no review exists
                existing_review = (await db.execute(
                    select(Review).where(Review.order_id == order.id)
                )).scalar_one_or_none()
                if existing_review:
                    continue

                rating, title, comment = REVIEW_DATA[review_idx % len(REVIEW_DATA)]
                review_idx += 1

                nlp_res = analyze_sentiment(comment, rating)

                review = Review(
                    rating=rating,
                    title=title,
                    comment=comment,
                    communication_rating=random.randint(4, 5),
                    quality_rating=rating,
                    delivery_rating=random.randint(4, 5),
                    reviewer_id=order.client_id,
                    reviewee_id=order.provider_id,
                    service_id=order.service_id,
                    order_id=order.id,
                    sentiment=nlp_res["label"],
                    sentiment_score=nlp_res["compound_score"],
                    is_visible=True,
                    created_at=order.completed_at or datetime.utcnow(),
                )
                db.add(review)
                print(f"  ⭐ Review ({rating}★ | NLP: {nlp_res['label']}) for order {order.order_number}")

        # ── Update service ratings ────────────────────────────────────────────
        await db.flush()
        for svc in created_services:
            reviews_res = await db.execute(
                select(Review).where(Review.service_id == svc.id, Review.is_visible == True)
            )
            reviews = reviews_res.scalars().all()
            if reviews:
                avg = sum(r.rating for r in reviews) / len(reviews)
                svc.average_rating = avg
                svc.total_reviews = len(reviews)

                provider_res = await db.execute(select(User).where(User.id == svc.provider_id))
                provider = provider_res.scalar_one()
                all_reviews_res = await db.execute(
                    select(Review).where(Review.reviewee_id == svc.provider_id, Review.is_visible == True)
                )
                all_reviews = all_reviews_res.scalars().all()
                if all_reviews:
                    provider.average_rating = sum(r.rating for r in all_reviews) / len(all_reviews)
                    provider.total_reviews = len(all_reviews)

        await db.commit()
        print("\n✅ Seed complete!")
        print(f"   Users created:    {len(STUDENTS)}")
        print(f"   Services created: {len(SERVICES_SPEC)}")
        print(f"   Orders created:   {len(created_orders)}")
        print(f"   Password for all: Test@1234")
        print("\n📧 Test accounts:")
        for s in STUDENTS:
            print(f"   {s['email']}")


if __name__ == "__main__":
    asyncio.run(seed())

"""
Extended Seed Script — populates Portfolio Projects, additional Orders,
Reviews with NLP Sentiment & Provider Replies, Conversations with Messages,
and In-App Notifications.

Run via docker exec:
    docker exec skillsphere_app python seed_extended.py
"""
import asyncio
import random
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.config import settings
from app.models import (
    User, UserRole, UserStatus,
    Category, Skill,
    ServiceListing, ServiceStatus, PricingType,
    Order, OrderStatus, PaymentStatus,
    Review, Conversation, Message, PortfolioProject, Notification
)
from app.ml.sentiment import analyze_sentiment

engine = create_async_engine(settings.database_url, echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

PORTFOLIO_DATA = {
    "arjun.kumar@ceconline.edu": [
        {
            "title": "College Fest 'Aagneya' Official Portal",
            "description": "Full-stack event portal featuring registration, schedule tracking, and live results for 3,000+ attendees.",
            "project_url": "https://github.com/ceconline/aagneya-web",
            "image_url": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
            "tags": "react, fastapi, tailwind, postgresql"
        },
        {
            "title": "CEC Tech Summit Branding & Posters",
            "description": "Complete visual identity package including 12 event posters, stage banners, and digital badge designs.",
            "project_url": "https://behance.net/gallery/cec-summit",
            "image_url": "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800",
            "tags": "photoshop, illustrator, graphic-design, branding"
        },
        {
            "title": "Smart Campus Energy Monitor (IoT)",
            "description": "Custom PCB design with ESP32 microcontrollers monitoring real-time power consumption of college labs.",
            "project_url": "https://github.com/ceconline/campus-iot-meter",
            "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
            "tags": "iot, esp32, pcb-design, kicad, c++"
        }
    ],
    "priya.menon@ceconline.edu": [
        {
            "title": "Autonomous Maze Solving Robot",
            "description": "PID controlled micromouse robot with custom sensor array and motor driver circuitry.",
            "project_url": "https://github.com/priyamenon/micromouse-robot",
            "image_url": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800",
            "tags": "robotics, embedded-c, sensors, arduino"
        },
        {
            "title": "16-Bit RISC Processor in Verilog",
            "description": "Pipelined 16-bit RISC processor synthesized and verified with ModelSim and Quartus Prime.",
            "project_url": "https://github.com/priyamenon/risc-core-verilog",
            "image_url": "https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800",
            "tags": "verilog, fpga, digital-design, vlsi"
        }
    ],
    "rahul.sharma@ceconline.edu": [
        {
            "title": "Placement Automation & Resume Matcher",
            "description": "Automated system extracting skills from student resumes and matching them with campus recruitment criteria.",
            "project_url": "https://github.com/rahulsharma/placement-matcher",
            "image_url": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
            "tags": "python, nlp, django, scikit-learn"
        },
        {
            "title": "Hostel Mess Management & Billing App",
            "description": "Mobile-first PWA for monthly meal attendance tracking, rebate requests, and automated bill generation.",
            "project_url": "https://github.com/rahulsharma/hostel-mess-app",
            "image_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
            "tags": "fullstack, react, nodejs, postgresql"
        }
    ],
    "sneha.pillai@ceconline.edu": [
        {
            "title": "Crop Disease Detection using Deep CNNs",
            "description": "98.4% accuracy classification on 38 plant disease classes with lightweight MobileNet model for edge devices.",
            "project_url": "https://github.com/snehapillai/crop-disease-ai",
            "image_url": "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=800",
            "tags": "pytorch, deep-learning, computer-vision, mobilenet"
        },
        {
            "title": "Campus Academic FAQ Assistant (RAG)",
            "description": "Retrieval-Augmented Generation chatbot trained on college syllabus and examination regulations.",
            "project_url": "https://github.com/snehapillai/cec-academic-rag",
            "image_url": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800",
            "tags": "nlp, langchain, rag, faiss, vector-search"
        }
    ],
    "karthik.nair@ceconline.edu": [
        {
            "title": "Solar Photovoltaic Maximum Power Point Tracker",
            "description": "Hardware prototype implementing Perturb and Observe MPPT algorithm with 94% conversion efficiency.",
            "project_url": "https://github.com/karthiknair/mppt-controller",
            "image_url": "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800",
            "tags": "solar, power-electronics, matlab, simulink"
        },
        {
            "title": "Interactive DSA Problem Visualizer",
            "description": "Interactive web canvas visualizing graph algorithms (Dijkstra, BFS, DFS) and tree traversals step-by-step.",
            "project_url": "https://karthiknair.dev/dsa-visualizer",
            "image_url": "https://images.unsplash.com/photo-1516116211227-bbc03a207bf3?w=800",
            "tags": "algorithms, data-structures, javascript, canvas"
        }
    ],
    "divya.thomas@ceconline.edu": [
        {
            "title": "Peer-to-Peer Encrypted File Transfer Tool",
            "description": "Decentralized file sharing CLI and GUI using WebRTC and AES-256 for local campus networks without internet.",
            "project_url": "https://github.com/divyathomas/campus-drop",
            "image_url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800",
            "tags": "webrtc, security, cryptography, react"
        },
        {
            "title": "Technical Paper on Edge AI Inference",
            "description": "Published paper in IEEE Student Branch conference on optimizing INT8 quantization on microcontrollers.",
            "project_url": "https://ieeexplore.ieee.org/document/example",
            "image_url": "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800",
            "tags": "ieee, research, technical-writing, edge-ai"
        }
    ],
    "arun.krishnan@ceconline.edu": [
        {
            "title": "Real-Time Audio Spectrum Analyzer",
            "description": "Hardware visualizer with 32-band FFT on ARM Cortex-M4 driving an RGB LED matrix display.",
            "project_url": "https://github.com/arunkrishnan/audio-fft-matrix",
            "image_url": "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800",
            "tags": "stm32, dsp, audio, hardware, c"
        }
    ],
    "meera.suresh@ceconline.edu": [
        {
            "title": "College Library Smart Book Recommendation Engine",
            "description": "Collaborative filtering system analyzing book issue history to recommend textbooks for upcoming semesters.",
            "project_url": "https://github.com/meerasuresh/lib-recommend",
            "image_url": "https://images.unsplash.com/photo-1507842229456-a365f57a3e74?w=800",
            "tags": "recommendation-system, scikit-learn, python"
        }
    ]
}

CHAT_CONVERSATIONS = [
    {
        "user1": "priya.menon@ceconline.edu",
        "user2": "arjun.kumar@ceconline.edu",
        "service_title": "Professional Poster Design",
        "messages": [
            ("priya.menon@ceconline.edu", "Hi Arjun! We need a banner and 3 posters for the ECE Robotics workshop next Friday. Can you help?"),
            ("arjun.kumar@ceconline.edu", "Hey Priya! Absolutely. What are the theme colors and dimensions you're thinking of?"),
            ("priya.menon@ceconline.edu", "Dark tech aesthetic with neon cyan and orange accents. A3 size for print, plus 1080x1080 for Instagram."),
            ("arjun.kumar@ceconline.edu", "Sounds great! Send over the speaker details and logos. I can deliver the first draft by Wednesday."),
            ("priya.menon@ceconline.edu", "Perfect! I just placed the order on SkillSphere. Thanks a lot!"),
            ("arjun.kumar@ceconline.edu", "Received! Starting on the concepts right away 👍")
        ]
    },
    {
        "user1": "rahul.sharma@ceconline.edu",
        "user2": "sneha.pillai@ceconline.edu",
        "service_title": "Python & ML Assignment Help",
        "messages": [
            ("rahul.sharma@ceconline.edu", "Hi Sneha! I'm stuck on hyperparameter tuning for our scikit-learn lab assignment. Do you have time for a session?"),
            ("sneha.pillai@ceconline.edu", "Hi Rahul! Sure thing. Are you using GridSearchCV or RandomizedSearchCV?"),
            ("rahul.sharma@ceconline.edu", "GridSearchCV, but it's taking forever to finish and throwing memory errors with 10 folds."),
            ("sneha.pillai@ceconline.edu", "Got it. We can switch to RandomizedSearchCV with fewer iterations and n_jobs=-1. Let's do a 45-min review."),
            ("rahul.sharma@ceconline.edu", "That would be a lifesaver! Ordering your tutoring session now.")
        ]
    },
    {
        "user1": "karthik.nair@ceconline.edu",
        "user2": "divya.thomas@ceconline.edu",
        "service_title": "Technical Writing & Reports",
        "messages": [
            ("karthik.nair@ceconline.edu", "Hello Divya, can you review our mini-project report for IEEE formatting compliance?"),
            ("divya.thomas@ceconline.edu", "Hi Karthik! Yes, I specialize in IEEE conference templates and LaTeX. How many pages is your draft?"),
            ("karthik.nair@ceconline.edu", "It's about 8 pages with 4 circuit diagrams and a results table."),
            ("divya.thomas@ceconline.edu", "Great, I'll proofread grammar, citations (BibTeX format), and ensure figure labels match IEEE guidelines."),
            ("karthik.nair@ceconline.edu", "Awesome, thank you!")
        ]
    },
    {
        "user1": "arun.krishnan@ceconline.edu",
        "user2": "meera.suresh@ceconline.edu",
        "service_title": "Video Editing (Reels & Shorts)",
        "messages": [
            ("arun.krishnan@ceconline.edu", "Hi Meera! We shot footage from the sports meet relay race. Could you edit a 45-second energetic reel?"),
            ("meera.suresh@ceconline.edu", "Hi Arun! Yes! Do you have specific background audio or should I pick trending royalty-free tracks?"),
            ("arun.krishnan@ceconline.edu", "Pick any fast-paced electronic track that fits the pacing. 1080x1920 vertical format."),
            ("meera.suresh@ceconline.edu", "On it! Will add speed ramps and smooth beat transitions."),
            ("arun.krishnan@ceconline.edu", "Sounds fantastic, thank you!")
        ]
    }
]

ADDITIONAL_REVIEWS_POOL = [
    {
        "rating": 5,
        "title": "Top-tier quality and lightning fast!",
        "comment": "Delivered the complete project well before the deadline. Super clean code and very easy to work with.",
        "reply": "Thank you! Really enjoyed collaborating with you on this project."
    },
    {
        "rating": 5,
        "title": "Exceptional work, exceeded expectations",
        "comment": "The design was fresh, modern, and perfectly suited for our college fest audience. Everyone loved the posters!",
        "reply": "Glad everyone loved the posters! Best wishes for the fest!"
    },
    {
        "rating": 4,
        "title": "Very helpful tutoring session",
        "comment": "Explained complex graph traversal concepts simply with real diagrams. Helped me ace my lab exam.",
        "reply": "Proud of your progress! Keep practicing those graph problems."
    },
    {
        "rating": 5,
        "title": "Accurate and well documented",
        "comment": "The report was formatted strictly in IEEE style with proper citations. Saved me hours of tedious work.",
        "reply": "Anytime! Happy to help with academic writing."
    },
    {
        "rating": 4,
        "title": "High quality video edit",
        "comment": "Great pacing and sound effects. Fast turnaround time. Minor revision was handled immediately.",
        "reply": "Thanks for the feedback! Happy to adjust to your preferences."
    },
    {
        "rating": 5,
        "title": "Working prototype on the first try",
        "comment": "The PCB layout was clean with zero DRC errors. Schematics were well annotated.",
        "reply": "Thanks! Make sure to verify solder bridge connections during assembly."
    }
]

async def seed_extended():
    async with SessionLocal() as db:
        print("🚀 Starting Extended Dummy Data Seeding...")

        # Load users
        user_res = await db.execute(select(User))
        users_by_email = {u.email: u for u in user_res.scalars().all()}
        all_students = [u for u in users_by_email.values() if u.role == UserRole.STUDENT]

        # 1. ── Seed Portfolio Projects ───────────────────────────────────────
        print("\n🎨 Seeding Portfolio Projects...")
        for email, projects in PORTFOLIO_DATA.items():
            user = users_by_email.get(email)
            if not user:
                continue

            for p in projects:
                existing = (await db.execute(
                    select(PortfolioProject).where(
                        PortfolioProject.user_id == user.id,
                        PortfolioProject.title == p["title"]
                    )
                )).scalar_one_or_none()

                if existing:
                    continue

                portfolio = PortfolioProject(
                    title=p["title"],
                    description=p["description"],
                    project_url=p["project_url"],
                    image_url=p["image_url"],
                    tags=p["tags"],
                    user_id=user.id,
                    created_at=datetime.utcnow() - timedelta(days=random.randint(5, 60))
                )
                db.add(portfolio)
                print(f"  ✅ Portfolio: [{user.full_name}] {p['title'][:40]}")

        await db.flush()

        # 2. ── Seed Additional Orders & Reviews across all services ─────────
        print("\n⭐ Seeding Additional Orders, Reviews & Provider Responses...")
        svc_res = await db.execute(select(ServiceListing))
        all_services = svc_res.scalars().all()

        order_count_res = await db.execute(select(func.count(Order.id)))
        order_seq = (order_count_res.scalar() or 0) + 1

        for svc in all_services:
            # Check existing completed orders for this service
            existing_completed = (await db.execute(
                select(Order).where(Order.service_id == svc.id, Order.status == OrderStatus.COMPLETED)
            )).scalars().all()

            # Ensure every service has at least 1-2 completed orders with reviews
            needed_orders = max(0, 2 - len(existing_completed))
            for i in range(needed_orders):
                # Pick a client who is not the provider
                eligible_clients = [u for u in all_students if u.id != svc.provider_id]
                if not eligible_clients:
                    continue
                client = random.choice(eligible_clients)

                created_date = datetime.utcnow() - timedelta(days=random.randint(6, 30))
                order_num = f"ORD-{created_date.strftime('%Y%m%d%H%M%S')}-{order_seq:04d}"
                order_seq += 1

                new_order = Order(
                    order_number=order_num,
                    requirements=f"Need assistance with '{svc.title}'. Please ensure high quality according to specifications.",
                    agreed_price=svc.price,
                    expected_delivery=created_date + timedelta(days=svc.delivery_time_days),
                    actual_delivery=created_date + timedelta(days=svc.delivery_time_days - 1),
                    max_revisions=svc.revision_count,
                    client_id=client.id,
                    provider_id=svc.provider_id,
                    service_id=svc.id,
                    service_title=svc.title,
                    status=OrderStatus.COMPLETED,
                    payment_status=PaymentStatus.PAID,
                    payment_method=random.choice(["upi", "card", "netbanking"]),
                    created_at=created_date,
                    accepted_at=created_date + timedelta(hours=3),
                    completed_at=created_date + timedelta(days=svc.delivery_time_days),
                    updated_at=created_date + timedelta(days=svc.delivery_time_days)
                )
                db.add(new_order)
                await db.flush()
                svc.order_count += 1

                # Add Review
                review_item = random.choice(ADDITIONAL_REVIEWS_POOL)
                nlp = analyze_sentiment(review_item["comment"], review_item["rating"])

                review = Review(
                    rating=review_item["rating"],
                    title=review_item["title"],
                    comment=review_item["comment"],
                    communication_rating=random.randint(4, 5),
                    quality_rating=review_item["rating"],
                    delivery_rating=random.randint(4, 5),
                    provider_response=review_item["reply"],
                    response_at=new_order.completed_at + timedelta(hours=6),
                    reviewer_id=client.id,
                    reviewee_id=svc.provider_id,
                    service_id=svc.id,
                    order_id=new_order.id,
                    sentiment=nlp["label"],
                    sentiment_score=nlp["compound_score"],
                    is_visible=True,
                    created_at=new_order.completed_at
                )
                db.add(review)

                # Update finances
                provider_user = (await db.execute(select(User).where(User.id == svc.provider_id))).scalar_one()
                provider_user.total_earnings += float(svc.price)
                client.total_spent += float(svc.price)

                print(f"  ⭐ Added Review ({review.rating}★ | NLP: {review.sentiment}) for '{svc.title[:35]}'")

        await db.flush()

        # Update aggregated ratings for all services and providers
        for svc in all_services:
            reviews_res = await db.execute(
                select(Review).where(Review.service_id == svc.id, Review.is_visible == True)
            )
            revs = reviews_res.scalars().all()
            if revs:
                svc.average_rating = round(sum(r.rating for r in revs) / len(revs), 1)
                svc.total_reviews = len(revs)

        for u in all_students:
            user_revs_res = await db.execute(
                select(Review).where(Review.reviewee_id == u.id, Review.is_visible == True)
            )
            u_revs = user_revs_res.scalars().all()
            if u_revs:
                u.average_rating = round(sum(r.rating for r in u_revs) / len(u_revs), 1)
                u.total_reviews = len(u_revs)

        await db.flush()

        # 3. ── Seed Conversations and Messages ──────────────────────────────
        print("\n💬 Seeding Chat Conversations and Messages...")
        for conv_data in CHAT_CONVERSATIONS:
            u1 = users_by_email.get(conv_data["user1"])
            u2 = users_by_email.get(conv_data["user2"])
            if not u1 or not u2:
                continue

            svc = (await db.execute(
                select(ServiceListing).where(ServiceListing.title == conv_data["service_title"])
            )).scalar_one_or_none()

            # Check if conversation already exists
            existing_conv = (await db.execute(
                select(Conversation).where(
                    ((Conversation.user1_id == u1.id) & (Conversation.user2_id == u2.id)) |
                    ((Conversation.user1_id == u2.id) & (Conversation.user2_id == u1.id))
                )
            )).scalar_one_or_none()

            if not existing_conv:
                conv = Conversation(
                    user1_id=u1.id,
                    user2_id=u2.id,
                    service_id=svc.id if svc else None,
                    created_at=datetime.utcnow() - timedelta(days=2),
                    updated_at=datetime.utcnow()
                )
                db.add(conv)
                await db.flush()
            else:
                conv = existing_conv

            # Add messages
            base_time = datetime.utcnow() - timedelta(hours=24)
            for i, (sender_email, text_body) in enumerate(conv_data["messages"]):
                sender = users_by_email.get(sender_email)
                if not sender:
                    continue

                msg_exists = (await db.execute(
                    select(Message).where(
                        Message.conversation_id == conv.id,
                        Message.content == text_body
                    )
                )).scalar_one_or_none()

                if not msg_exists:
                    msg = Message(
                        conversation_id=conv.id,
                        sender_id=sender.id,
                        content=text_body,
                        is_read=True if i < len(conv_data["messages"]) - 1 else False,
                        created_at=base_time + timedelta(minutes=i * 15)
                    )
                    db.add(msg)

            print(f"  💬 Chat between {u1.full_name} & {u2.full_name} ({len(conv_data['messages'])} messages)")

        await db.flush()

        # 4. ── Seed Notifications ───────────────────────────────────────────
        print("\n🔔 Seeding In-App Notifications...")
        SAMPLE_NOTIFICATIONS = [
            ("order_placed", "New Order Received", "You have received a new order for your service.", "/orders"),
            ("order_accepted", "Order In Progress", "Your service provider has accepted and started work.", "/orders"),
            ("payment_received", "Payment Credited", "Payment of ₹499 has been credited to your campus wallet.", "/dashboard"),
            ("review_received", "New 5★ Rating!", "A client left a positive 5-star review on your service.", "/reviews"),
            ("new_message", "New Direct Message", "You have an unread message regarding project requirements.", "/messages")
        ]

        for u in all_students:
            for notif_type, title, msg, link in random.sample(SAMPLE_NOTIFICATIONS, 3):
                existing_notif = (await db.execute(
                    select(Notification).where(
                        Notification.user_id == u.id,
                        Notification.title == title
                    )
                )).scalar_one_or_none()

                if not existing_notif:
                    notif = Notification(
                        user_id=u.id,
                        type=notif_type,
                        title=title,
                        message=msg,
                        link=link,
                        is_read=random.choice([True, False]),
                        created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 48))
                    )
                    db.add(notif)

        await db.commit()
        print("\n✨ Extended Dummy Data successfully seeded!")


if __name__ == "__main__":
    asyncio.run(seed_extended())

"""Generate clean B&W LaTeX/TikZ-style diagrams matching the reference CEC PPT format:
1. System Architecture (3-Tier block diagram) - Slide 6 style
2. Use Case Diagram - Slide 7 style
3. Data Flow Diagram - Level 0 - Slide 8 style
4. Data Flow Diagram - Level 1 - Slide 9 style
"""
import os
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "architecture_slides")
os.makedirs(OUT_DIR, exist_ok=True)

HTML = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { margin: 0; }
  body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    font-family: "Times New Roman", "Liberation Serif", Georgia, serif;
    color: #000000;
    -webkit-font-smoothing: antialiased;
  }
  .page {
    width: 1400px;
    height: 860px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    box-sizing: border-box;
    padding: 30px;
  }
  svg {
    display: block;
    overflow: visible;
  }
  .tier-title {
    font-family: "Times New Roman", Georgia, serif;
    font-size: 15px;
    font-weight: bold;
    fill: #000;
  }
  .box-text {
    font-family: "Times New Roman", Georgia, serif;
    font-size: 16.5px;
    fill: #000;
    text-anchor: middle;
  }
  .arrow-label {
    font-family: "Times New Roman", Georgia, serif;
    font-size: 14.5px;
    fill: #000;
  }
  .uc-title {
    font-family: "Times New Roman", Georgia, serif;
    font-size: 24px;
    font-weight: bold;
    fill: #000;
    text-anchor: middle;
  }
  .uc-text {
    font-family: "Times New Roman", Georgia, serif;
    font-size: 20px;
    fill: #000;
    text-anchor: middle;
  }
  .dfd-text {
    font-family: "Times New Roman", Georgia, serif;
    font-size: 19px;
    fill: #000;
    text-anchor: middle;
  }
  .dfd1-text {
    font-family: "Times New Roman", Georgia, serif;
    font-size: 16px;
    fill: #000;
    text-anchor: middle;
  }
  .store-text {
    font-family: "Times New Roman", Georgia, serif;
    font-size: 21px;
    fill: #000;
    text-anchor: middle;
  }
</style>
</head>
<body>

<!-- ==================== 1. SYSTEM ARCHITECTURE ==================== -->
<div class="page" id="arch">
  <svg width="1020" height="760" viewBox="0 0 1020 760">
    <defs>
      <marker id="arrow-up" markerWidth="10" markerHeight="10" refX="5" refY="1" orient="0">
        <path d="M1,7 L5,1 L9,7" fill="none" stroke="#000" stroke-width="1.4"/>
      </marker>
      <marker id="arrow-down" markerWidth="10" markerHeight="10" refX="5" refY="9" orient="0">
        <path d="M1,3 L5,9 L9,3" fill="none" stroke="#000" stroke-width="1.4"/>
      </marker>
      <marker id="arrow-end" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
        <path d="M1,1 L7,4.5 L1,8" fill="none" stroke="#000" stroke-width="1.5"/>
      </marker>
    </defs>

    <!-- TIER 1 -->
    <rect x="40" y="15" width="940" height="175" fill="#fff" stroke="#000" stroke-width="1.5"/>
    <text x="58" y="42" class="tier-title">TIER 1: CLIENT (presentation layer: web browser, React 18 / Vite / Tailwind CSS)</text>

    <!-- Tier 1 Boxes -->
    <rect x="60" y="65" width="280" height="105" fill="#fff" stroke="#000" stroke-width="1"/>
    <text x="200" y="100" class="box-text">Service Marketplace &amp;</text>
    <text x="200" y="124" class="box-text">Smart Search Interface</text>
    <text x="200" y="148" class="box-text">(catalog, filters, portfolios)</text>

    <rect x="370" y="65" width="280" height="105" fill="#fff" stroke="#000" stroke-width="1"/>
    <text x="510" y="100" class="box-text">Order Tracker &amp; Checkout</text>
    <text x="510" y="124" class="box-text">(status timeline, Razorpay,</text>
    <text x="510" y="148" class="box-text">printable receipt)</text>

    <rect x="680" y="65" width="280" height="105" fill="#fff" stroke="#000" stroke-width="1"/>
    <text x="820" y="100" class="box-text">Peer Chat, Reviews &amp;</text>
    <text x="820" y="124" class="box-text">Role Dashboards</text>
    <text x="820" y="148" class="box-text">(earnings chart, admin panel)</text>

    <!-- Arrow Tier 1 <-> Tier 2 -->
    <line x1="510" y1="192" x2="510" y2="278" stroke="#000" stroke-width="1.4" marker-start="url(#arrow-up)" marker-end="url(#arrow-down)"/>
    <text x="520" y="240" class="arrow-label">HTTP REST API / JSON (JWT Auth)</text>

    <!-- TIER 2 -->
    <rect x="40" y="280" width="940" height="260" fill="#fff" stroke="#000" stroke-width="1.5"/>
    <text x="58" y="307" class="tier-title">TIER 2: SERVER (application layer: FastAPI backend, Python 3.11 / Uvicorn)</text>

    <!-- Tier 2 Row 1 -->
    <rect x="60" y="325" width="280" height="92" fill="#fff" stroke="#000" stroke-width="1"/>
    <text x="200" y="362" class="box-text">Auth &amp; Security Guard</text>
    <text x="200" y="388" class="box-text">(JWT tokens, @ceconline.edu,</text>
    <text x="200" y="408" class="box-text" font-size="15">rate limiter)</text>

    <rect x="370" y="325" width="280" height="92" fill="#fff" stroke="#000" stroke-width="1"/>
    <text x="510" y="362" class="box-text">Order &amp; Marketplace Router</text>
    <text x="510" y="388" class="box-text">(FastAPI routes, lifecycle,</text>
    <text x="510" y="408" class="box-text" font-size="15">magic-byte file check)</text>

    <rect x="680" y="325" width="280" height="92" fill="#fff" stroke="#000" stroke-width="1"/>
    <text x="820" y="362" class="box-text">Payment Gateway Handler</text>
    <text x="820" y="388" class="box-text">(Razorpay order creation,</text>
    <text x="820" y="408" class="box-text" font-size="15">HMAC-SHA256 verification)</text>

    <!-- Tier 2 Row 2 -->
    <rect x="60" y="432" width="280" height="92" fill="#fff" stroke="#000" stroke-width="1"/>
    <text x="200" y="468" class="box-text">Semantic Search Engine</text>
    <text x="200" y="494" class="box-text">(TF-IDF vectorization, synonym</text>
    <text x="200" y="514" class="box-text" font-size="15">expansion, cosine similarity)</text>

    <rect x="370" y="432" width="280" height="92" fill="#fff" stroke="#000" stroke-width="1"/>
    <text x="510" y="468" class="box-text">NLP Sentiment Module</text>
    <text x="510" y="494" class="box-text">(VADER lexicon scoring,</text>
    <text x="510" y="514" class="box-text" font-size="15">review polarity &amp; replies)</text>

    <rect x="680" y="432" width="280" height="92" fill="#fff" stroke="#000" stroke-width="1"/>
    <text x="820" y="468" class="box-text">Chat &amp; Notification Service</text>
    <text x="820" y="494" class="box-text">(peer messaging, in-app</text>
    <text x="820" y="514" class="box-text" font-size="15">alerts, response builder)</text>

    <!-- Arrows Tier 2 <-> Tier 3 -->
    <line x1="220" y1="542" x2="220" y2="613" stroke="#000" stroke-width="1.4" marker-start="url(#arrow-up)" marker-end="url(#arrow-down)"/>
    <text x="230" y="583" class="arrow-label">async SQL queries (AsyncPG)</text>

    <line x1="535" y1="542" x2="535" y2="613" stroke="#000" stroke-width="1.4" marker-start="url(#arrow-up)" marker-end="url(#arrow-down)"/>
    <text x="545" y="583" class="arrow-label">vector &amp; sentiment lookup</text>

    <!-- TIER 3 -->
    <rect x="40" y="615" width="940" height="130" fill="#fff" stroke="#000" stroke-width="1.5"/>
    <text x="58" y="642" class="tier-title">TIER 3: MODEL AND STORAGE (data layer)</text>

    <rect x="60" y="655" width="280" height="76" fill="#fff" stroke="#000" stroke-width="1"/>
    <text x="200" y="685" class="box-text">PostgreSQL 15 Database</text>
    <text x="200" y="712" class="box-text">(users, services, orders, reviews)</text>

    <rect x="370" y="655" width="280" height="76" fill="#fff" stroke="#000" stroke-width="1"/>
    <text x="510" y="685" class="box-text">Offline AI / ML Assets</text>
    <text x="510" y="712" class="box-text">(TF-IDF corpus, VADER lexicon)</text>

    <rect x="680" y="655" width="280" height="76" fill="#fff" stroke="#000" stroke-width="1"/>
    <text x="820" y="685" class="box-text">Static Media Storage</text>
    <text x="820" y="712" class="box-text">(avatars, thumbnails, portfolios)</text>
  </svg>
</div>

<!-- ==================== 2. USE CASE DIAGRAM ==================== -->
<div class="page" id="usecase">
  <svg width="980" height="720" viewBox="0 0 980 720">
    <!-- System Boundary Box -->
    <rect x="350" y="30" width="560" height="660" fill="#fff" stroke="#000" stroke-width="1.5"/>
    <text x="630" y="74" class="uc-title">SkillSphere System</text>

    <!-- Stick Figure Actor: Student (Client / Provider) -->
    <circle cx="155" cy="285" r="24" fill="#fff" stroke="#000" stroke-width="1.5"/>
    <line x1="155" y1="309" x2="155" y2="410" stroke="#000" stroke-width="1.5"/>
    <line x1="105" y1="342" x2="205" y2="342" stroke="#000" stroke-width="1.5"/>
    <line x1="155" y1="410" x2="115" y2="480" stroke="#000" stroke-width="1.5"/>
    <line x1="155" y1="410" x2="195" y2="480" stroke="#000" stroke-width="1.5"/>

    <text x="155" y="518" class="uc-title" font-weight="normal">Student</text>
    <text x="155" y="552" class="uc-title" font-weight="normal">(Client / Provider)</text>

    <!-- Use Case Ellipses -->
    <ellipse cx="630" cy="145" rx="235" ry="42" fill="#fff" stroke="#000" stroke-width="1.3"/>
    <text x="630" y="152" class="uc-text">Search &amp; List Campus Services</text>

    <ellipse cx="630" cy="260" rx="235" ry="42" fill="#fff" stroke="#000" stroke-width="1.3"/>
    <text x="630" y="267" class="uc-text">Place, Manage &amp; Deliver Orders</text>

    <ellipse cx="630" cy="375" rx="235" ry="42" fill="#fff" stroke="#000" stroke-width="1.3"/>
    <text x="630" y="382" class="uc-text">Pay via Razorpay &amp; View Receipt</text>

    <ellipse cx="630" cy="490" rx="235" ry="42" fill="#fff" stroke="#000" stroke-width="1.3"/>
    <text x="630" y="497" class="uc-text">Submit Reviews &amp; Provider Replies</text>

    <ellipse cx="630" cy="605" rx="235" ry="42" fill="#fff" stroke="#000" stroke-width="1.3"/>
    <text x="630" y="612" class="uc-text">Chat, Showcase Portfolio &amp; Track Earnings</text>

    <!-- Association Lines -->
    <line x1="175" y1="342" x2="395" y2="145" stroke="#000" stroke-width="1.3"/>
    <line x1="175" y1="342" x2="395" y2="260" stroke="#000" stroke-width="1.3"/>
    <line x1="175" y1="342" x2="395" y2="375" stroke="#000" stroke-width="1.3"/>
    <line x1="175" y1="342" x2="395" y2="490" stroke="#000" stroke-width="1.3"/>
    <line x1="175" y1="342" x2="395" y2="605" stroke="#000" stroke-width="1.3"/>
  </svg>
</div>

<!-- ==================== 3. DFD LEVEL 0 ==================== -->
<div class="page" id="dfd0">
  <svg width="1020" height="500" viewBox="0 0 1020 500">
    <defs>
      <marker id="arr0" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
        <path d="M1,1.5 L8,5 L1,8.5 Z" fill="#000"/>
      </marker>
    </defs>

    <!-- External Entity -->
    <rect x="60" y="185" width="235" height="125" fill="#fff" stroke="#000" stroke-width="1.4"/>
    <text x="177" y="232" class="uc-title" font-weight="normal">Student</text>
    <text x="177" y="275" class="uc-title" font-weight="normal">(Client / Provider)</text>

    <!-- Top Arrow: Entity -> System -->
    <line x1="295" y1="218" x2="652" y2="218" stroke="#000" stroke-width="1.8" marker-end="url(#arr0)"/>
    <text x="475" y="204" class="dfd-text">service query, order &amp; payment</text>

    <!-- Bottom Arrow: System -> Entity -->
    <line x1="652" y1="278" x2="295" y2="278" stroke="#000" stroke-width="1.8" marker-end="url(#arr0)"/>
    <text x="475" y="306" class="dfd-text">matches, order status, receipt,</text>
    <text x="475" y="336" class="dfd-text">review sentiment &amp; earnings</text>

    <!-- Process 0 Circle -->
    <circle cx="795" cy="248" r="140" fill="#f7f7fd" stroke="#000" stroke-width="1.4"/>
    <text x="795" y="168" class="uc-title" font-weight="normal">0</text>
    <text x="795" y="220" class="uc-title" font-weight="normal">SkillSphere</text>
    <text x="795" y="264" class="uc-title" font-weight="normal">Marketplace</text>
    <text x="795" y="308" class="uc-title" font-weight="normal">System</text>
  </svg>
</div>

<!-- ==================== 4. DFD LEVEL 1 ==================== -->
<div class="page" id="dfd1">
  <svg width="1140" height="680" viewBox="0 0 1140 680">
    <defs>
      <marker id="arr1" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
        <path d="M1,1.5 L8,5 L1,8.5 Z" fill="#000"/>
      </marker>
    </defs>

    <!-- Data Store D1 -->
    <line x1="250" y1="45" x2="620" y2="45" stroke="#000" stroke-width="1.4"/>
    <line x1="250" y1="100" x2="620" y2="100" stroke="#000" stroke-width="1.4"/>
    <text x="435" y="80" class="store-text">D1 PostgreSQL Database</text>

    <!-- Data Store D2 -->
    <line x1="740" y1="45" x2="1080" y2="45" stroke="#000" stroke-width="1.4"/>
    <line x1="740" y1="100" x2="1080" y2="100" stroke="#000" stroke-width="1.4"/>
    <text x="910" y="80" class="store-text">D2 TF-IDF &amp; VADER Lexicon</text>

    <!-- Top Row Circles: 0.1, 0.2, 0.3 -->
    <!-- 0.1 -->
    <circle cx="320" cy="255" r="82" fill="#fff" stroke="#000" stroke-width="1.3"/>
    <text x="320" y="225" class="dfd1-text">Authenticate</text>
    <text x="320" y="253" class="dfd1-text">Student</text>
    <text x="320" y="285" class="dfd1-text">0.1</text>

    <!-- 0.2 -->
    <circle cx="615" cy="255" r="82" fill="#fff" stroke="#000" stroke-width="1.3"/>
    <text x="615" y="225" class="dfd1-text">Semantic</text>
    <text x="615" y="253" class="dfd1-text">Search (TF-IDF)</text>
    <text x="615" y="285" class="dfd1-text">0.2</text>

    <!-- 0.3 -->
    <circle cx="910" cy="255" r="88" fill="#fff" stroke="#000" stroke-width="1.3"/>
    <text x="910" y="213" class="dfd1-text">Create &amp; Track</text>
    <text x="910" y="241" class="dfd1-text">Order</text>
    <text x="910" y="269" class="dfd1-text">(Lifecycle)</text>
    <text x="910" y="301" class="dfd1-text">0.3</text>

    <!-- Bottom Row Circles: 0.6, 0.5, 0.4 -->
    <!-- 0.6 -->
    <circle cx="320" cy="525" r="82" fill="#fff" stroke="#000" stroke-width="1.3"/>
    <text x="320" y="495" class="dfd1-text">Update</text>
    <text x="320" y="523" class="dfd1-text">Dashboards</text>
    <text x="320" y="555" class="dfd1-text">0.6</text>

    <!-- 0.5 -->
    <circle cx="615" cy="525" r="82" fill="#fff" stroke="#000" stroke-width="1.3"/>
    <text x="615" y="495" class="dfd1-text">Analyze</text>
    <text x="615" y="523" class="dfd1-text">Review (VADER)</text>
    <text x="615" y="555" class="dfd1-text">0.5</text>

    <!-- 0.4 -->
    <circle cx="910" cy="525" r="82" fill="#fff" stroke="#000" stroke-width="1.3"/>
    <text x="910" y="495" class="dfd1-text">Verify Payment</text>
    <text x="910" y="523" class="dfd1-text">(Razorpay)</text>
    <text x="910" y="555" class="dfd1-text">0.4</text>

    <!-- Arrows -->
    <!-- Input -> 0.1 -->
    <line x1="125" y1="255" x2="236" y2="255" stroke="#000" stroke-width="1.7" marker-end="url(#arr1)"/>
    <text x="180" y="244" class="dfd1-text">credentials</text>

    <!-- 0.1 -> D1 -->
    <line x1="320" y1="173" x2="260" y2="103" stroke="#000" stroke-width="1.7" marker-end="url(#arr1)"/>

    <!-- D1 -> 0.2 -->
    <line x1="590" y1="100" x2="545" y2="175" stroke="#000" stroke-width="1.7" marker-end="url(#arr1)"/>

    <!-- D2 -> 0.3 / 0.2 -->
    <line x1="910" y1="100" x2="910" y2="165" stroke="#000" stroke-width="1.7" marker-end="url(#arr1)"/>

    <!-- 0.1 -> 0.2 -->
    <line x1="402" y1="255" x2="531" y2="255" stroke="#000" stroke-width="1.7" marker-end="url(#arr1)"/>
    <text x="466" y="244" class="dfd1-text">verified user</text>

    <!-- 0.2 -> 0.3 -->
    <line x1="697" y1="255" x2="820" y2="255" stroke="#000" stroke-width="1.7" marker-end="url(#arr1)"/>
    <text x="758" y="244" class="dfd1-text">selected service</text>

    <!-- 0.3 -> 0.4 -->
    <line x1="910" y1="343" x2="910" y2="441" stroke="#000" stroke-width="1.7" marker-end="url(#arr1)"/>
    <text x="965" y="395" class="dfd1-text">delivered order</text>

    <!-- 0.4 -> 0.5 -->
    <line x1="828" y1="525" x2="699" y2="525" stroke="#000" stroke-width="1.7" marker-end="url(#arr1)"/>
    <text x="764" y="514" class="dfd1-text">paid order</text>

    <!-- 0.5 -> 0.6 -->
    <line x1="533" y1="525" x2="404" y2="525" stroke="#000" stroke-width="1.7" marker-end="url(#arr1)"/>
    <text x="468" y="514" class="dfd1-text">sentiment &amp; rating</text>

    <!-- 0.6 -> Output -->
    <line x1="238" y1="525" x2="40" y2="525" stroke="#000" stroke-width="1.7" marker-end="url(#arr1)"/>
    <text x="138" y="512" class="dfd1-text">receipt, review, earnings</text>
  </svg>
</div>

</body>
</html>
"""

html_path = os.path.join(OUT_DIR, "diagrams_ppt_style.html")
with open(html_path, "w") as f:
    f.write(HTML)

MAPPING = [
    ("#arch", "01_System_Architecture.png"),
    ("#usecase", "02_Use_Case_Diagram.png"),
    ("#dfd0", "03_DFD_Level_0.png"),
    ("#dfd1", "04_DFD_Level_1.png"),
]

with sync_playwright() as p:
    browser = p.chromium.launch(channel="chrome", headless=True)
    page = browser.new_page(viewport={"width": 1450, "height": 920}, device_scale_factor=2)
    page.goto(f"file://{html_path}")
    for selector, filename in MAPPING:
        out_file = os.path.join(OUT_DIR, filename)
        page.locator(selector).screenshot(path=out_file)
        print("Saved:", out_file)
    browser.close()

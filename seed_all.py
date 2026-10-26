"""One command to (re)load all demo data. Start the backend once first so tables/categories exist.

    python seed_all.py
"""
import subprocess
import sys

STEPS = ["reset_demo_data.py", "seed_data.py", "seed_extended.py", "seed_payments.py", "spread_earnings.py"]

for step in STEPS:
    print(f"\n=== {step} ===")
    if subprocess.call([sys.executable, step]) != 0:
        sys.exit(f"Failed at {step}")
print("\nDemo data ready. Student logins: <name>@ceconline.edu / Test@1234  (e.g. arjun.kumar@ceconline.edu)")

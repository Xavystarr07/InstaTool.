README.md
InstaTool 🚀

A modern, web-based automation dashboard to find and unfollow accounts that don't follow you back on Instagram. This tool uses human-simulated behavior to minimize detection.

✨ Features

Centralized Dashboard: Manage collection and unfollowing from a sleek, glassmorphism UI.

Human-Style Capture: Scans followers and following lists by simulating real scrolling behavior.

Modern Detection: Compatible with 2026 "Friends" and "Following" label updates.

Error Protection: Gracefully handles manual browser closures and connection drops.

Safe Execution: Built-in random delays (5-10s) to mimic real user interactions.

🛠️ Setup

Clone the repository:

Bash
git clone https://github.com/YOUR_USERNAME/InstaTool.git
cd InstaTool
Install dependencies:

Bash
npm install
npx playwright install chromium
🚀 Usage

Launch the Dashboard:

Bash
node app.js
Find Non-Followers: Click "1. Find Non-Followers". Log in manually and navigate to your profile. The script will automatically scrape your lists and save a JSON report to your Downloads folder.

Unfollow: Click "2. Start Unfollowing". The script will load your latest report and begin the automated unfollow process with safety delays.

⚠️ Disclaimer

Automating social media platforms can result in account flags or temporary blocks.

Use sparingly (recommended limit: 50 unfollows per hour).

This tool is for educational purposes only.

Built for the 2026 Instagram UI.

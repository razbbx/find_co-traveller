# 🚗 CarpoolSync

A modern, mobile-first carpool coordination dashboard designed for travelers to find and consolidate groups effortlessly.

## ✨ Key Features

- **Interactive Timeline**: Visual 24-hour track to drop leaving markers and see other riders.
- **Smart Consolidation**: Automatically groups travelers based on matching criteria (Same Day + Same Drop Location + Proximity within ±1 hour).
- **Mobile-First Design**: Fully responsive 3-pane layout for desktop that collapses into an intuitive tabbed navigation for mobile users.
- **Privacy Centric**: Redacted names in public activity logs and "click-to-reveal" phone numbers to prevent scraping.
- **Activity Log**: Real-time chronological view of recently added markers.
- **Admin Panel**: Protected dashboard to monitor statistics and manage entries (accessible via `/#admin`).

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3 (Glassmorphism), and Modern Javascript.
- **Backend**: [Cloudflare Pages Functions](https://pages.cloudflare.com/) (Serverless).
- **Storage**: [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) Object Storage for global persistence.

## 🤝 How it Works

1. **Pick a Date**: Use the calendar or "Peak Traffic" chips to select your travel day.
2. **Drop your Marker**: Click the timeline at your expected leaving time or use the "Intuitive Time Entry" box on mobile.
3. **Check Groups**: Look at the **Traveler Groups** column. If someone else is leaving for the same location (Airport, Central, etc.) within 1 hour of you, you'll be automatically grouped.
4. **Connect**: Click a group or a rider card to reveal contact info and coordinate!

## 🚀 Deployment

This project is optimized for deployment on **Cloudflare Pages**. 

For full setup instructions (R2 bucket binding, environment variables), please refer to the [Deployment Guide](./deployment_guide.md).

---
*Created for secure and efficient travel coordination.*

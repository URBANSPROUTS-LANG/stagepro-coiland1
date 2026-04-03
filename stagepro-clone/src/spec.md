# StagePro

## Current State
New project. No existing source code in workspace.

## Requested Changes (Diff)

### Add
- Full StagePro app rebuilt from GitHub source at https://github.com/Virtualstagercoiland/stagepro
- Pre-login marketing landing page with hero, about, transformation showcase, reviews, CTA
- Post-login landing page with features, before/after mockup, success stories, footer
- Design Tool page: 20 AI tools across 4 groups (Interior Design, Seasonal & Lighting, Outdoor Features, Video Generation), multi-image upload (up to 4), before/after slider, generation history panel, custom themes, room type selector, design style selector, video settings
- Pricing page: 5 Razorpay plans (Starter ₹999, Basic ₹1999, Growth ₹3999, Pro ₹6999, Max ₹9999) with photo/video limits
- Backend: user profiles, subscription plans, usage tracking, Razorpay payment claiming, design history, custom themes per user, Puter API token management, Internet Identity auth
- BeforeAfterSlider component
- AI generation via Puter.js (window.puter) for both image (flux.1-kontext-pro) and video (sora-2)

### Modify
- N/A

### Remove
- N/A

## Implementation Plan
1. Select authorization, http-outcalls, stripe components
2. Generate Motoko backend with subscriptions, usage tracking, custom themes, puter token, design history
3. Build all frontend pages and components matching the original source exactly
4. Copy generated images and assets

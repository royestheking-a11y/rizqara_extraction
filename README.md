# Rizqara Extraction

> **Professional Lead Intelligence Tool for Google Maps**  
> Chrome Extension + Node.js Backend

White & Deep Maroon premium design • Lead Scoring • Email Finder • Social Media Detector • AI Insights • Excel Export

---

## 🗂 Project Structure

```
rizqara extraction/
├── extension/          ← Chrome Extension (MV3)
│   ├── manifest.json
│   ├── popup.html / popup.css / popup.js
│   ├── content.js / content.css
│   ├── background.js
│   ├── lib/xlsx.min.js
│   └── icons/
└── backend/            ← Node.js Enrichment API
    ├── server.js
    ├── services/
    │   ├── enricher.js
    │   └── ai.js
    └── .env.example
```

---

## 🚀 Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
# API runs on http://localhost:3000
```

### 2. Chrome Extension

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer Mode** (top right)
3. Click **Load unpacked**
4. Select the `extension/` folder

---

## 🔄 How It Works

1. Go to **Google Maps** → search e.g. `"Restaurants in Dhaka"`
2. Click the Rizqara icon in your Chrome toolbar
3. Set filters, lead scoring, extraction limit
4. Click **Start Extraction**
5. Extension scrolls & extracts listings automatically
6. Backend enriches each website (email, socials, tech stack)
7. Export to **Excel** or **CSV**

---

## 🔥 Features

| Feature | Status |
|---|---|
| Auto/Manual/Hybrid extraction modes | ✅ |
| Lead scoring (Hot 🔥 / Warm ⚡ / Cold ❄) | ✅ |
| Smart filters (website, phone, email, social) | ✅ |
| Email finder from website | ✅ |
| Social media detector | ✅ |
| Tech stack detection | ✅ |
| Mini CRM (tag leads, add notes) | ✅ |
| Export Excel (.xlsx) | ✅ |
| Export CSV | ✅ |
| AI Insights (OpenAI) | ✅ |
| Anti-block mode | ✅ |
| Background extraction | ✅ |
| Progress bar + live stats | ✅ |

---

## ⚙️ Settings

Configure via the extension's **Settings** tab:
- **API Server URL** — point to your backend
- **Speed** — Safe / Normal / Fast
- **Toggle** email finder, social detector, intelligence scanner
- **AI Key** — optional OpenAI key for pitch suggestions

---

## 📊 Excel Output Columns

`Business Name` · `Category` · `Rating` · `Reviews` · `Address` · `Phone` · `Website` · `Email` · `Facebook` · `Instagram` · `LinkedIn` · `Lead Score` · `Lead Tier` · `Tech Stack` · `AI Insight`

---

## ⚠️ Legal Note

Use responsibly. Respect Google Maps Terms of Service. Add delays between requests. Do not spam extracted contacts.

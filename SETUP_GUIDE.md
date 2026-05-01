# Rizqara Extraction — Setup & Usage Guide

## STEP 1 — Install Chrome Extension

1. Open Chrome → type in address bar: **`chrome://extensions/`**
2. Toggle **Developer Mode** ON (top-right corner)
3. Click **"Load unpacked"**
4. Browse to: `/Users/mdsunny/Downloads/rizqara extraction/extension/`
5. Click **Select** → Extension appears in toolbar ✅

> Pin it: Click the puzzle icon 🧩 in Chrome toolbar → pin Rizqara

---

## STEP 2 — Setup Backend (One-Time)

```bash
cd "/Users/mdsunny/Downloads/rizqara extraction/backend"
cp .env.example .env
```

---

## STEP 3 — How to Use It

1. Open **Google Chrome**
2. Go to **[google.com/maps](https://maps.google.com)**
3. Search: e.g. `"Restaurants in Dhaka"` or `"Salons in Dubai"`
4. Click the **Rizqara icon** in your toolbar
5. Choose mode: **Auto / Manual / Hybrid**
6. Set filters (Website, Phone, Email, etc.)
7. Set limit (10–500 leads)
8. Click **▶ Start Extraction**
9. Watch leads come in live with Hot/Warm/Cold scoring
10. Click **Export Excel** or **CSV** when done

---

## STEP 4 — Run Backend Automatically (Never Run Manually Again)

### Option A: PM2 (Recommended — runs forever in background)

```bash
# Install PM2 globally (one-time)
npm install -g pm2

# Start the backend
cd "/Users/mdsunny/Downloads/rizqara extraction/backend"
pm2 start server.js --name "rizqara-api"

# Save so it restarts on system reboot
pm2 save
pm2 startup
# ↑ Run the command it outputs (it looks like: sudo env PATH=... pm2 startup...)
```

**After this — the backend starts automatically every time you turn on your Mac. You never touch it again.**

Check status anytime:
```bash
pm2 status          # see if running
pm2 logs rizqara-api  # see logs
pm2 stop rizqara-api  # stop it
pm2 restart rizqara-api  # restart
```

---

### Option B: Mac LaunchAgent (No extra tools needed)

```bash
# Create the auto-start file
cat > ~/Library/LaunchAgents/com.rizqara.api.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.rizqara.api</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/Users/mdsunny/Downloads/rizqara extraction/backend/server.js</string>
  </array>
  <key>WorkingDirectory</key>
  <string>/Users/mdsunny/Downloads/rizqara extraction/backend</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/rizqara-api.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/rizqara-api-error.log</string>
</dict>
</plist>
EOF

# Load it now
launchctl load ~/Library/LaunchAgents/com.rizqara.api.plist
```

---

## Without Backend (Offline Mode)

The extension works **without the backend** — you still get:
- ✅ Business name, rating, reviews, address, phone
- ✅ Website URL
- ✅ Lead scoring (Hot/Warm/Cold)
- ✅ Excel & CSV export
- ✅ Mini CRM

You only MISS: email finder, social media links, tech stack (these need backend)

---

## Extension Settings

Click **Settings tab** in the popup:
- **API Server URL** → `http://localhost:3000` (default, keep this)
- **Speed** → Safe (3-5s), Normal (1-3s), Fast (0.5-1s)
- **Email Finder** → ON to find emails from websites
- **Social Detector** → ON to find Facebook/Instagram/LinkedIn
- **Anti-Block** → Keep ON always

---

## Tips for Best Results

| Tip | Why |
|-----|-----|
| Use **Normal** speed | Avoids Google detecting bot behavior |
| Extract max **100-200** at a time | More reliable than 500 at once |
| Use **Hybrid mode** | Best accuracy + speed balance |
| Search with specific city names | Better data quality |
| Enable **Email Finder** with backend running | Gets you direct contacts |

---

## Verify Backend Is Running

Open browser → go to: **http://localhost:3000**

You should see:
```json
{"status":"ok","name":"Rizqara Extraction API","version":"1.0.0"}
```

If you see this → backend is live ✅

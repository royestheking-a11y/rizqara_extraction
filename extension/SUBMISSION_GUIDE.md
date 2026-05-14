# Chrome Web Store Submission Guide (v1.0.2)

Use the following information when filling out the submission form for Rizqara Extraction.

---

### 1. Single Purpose (Crucial)
> "A specialized research tool for Google Maps that helps users collect and organize public business information—such as names, phone numbers, and websites—into structured CSV or Excel spreadsheets for business analysis."

---

### 2. Permission Justification

| Permission | Justification |
| :--- | :--- |
| `activeTab` | Required to detect when the user is on Google Maps and to inject the extraction interface upon user request. |
| `storage` | Used to save extracted leads locally so users don't lose their work if they close the browser or popup. |
| `https://www.google.com/maps/*` | Necessary to read public business metadata from the Google Maps interface to generate the export report. |
| `https://rizqara-extraction-backend.onrender.com/*` | Required to communicate with our secure enrichment API for email finding and subscription management. |

---

### 3. User Data Disclosure (Privacy Section)
When asked what data you collect, check these boxes:
- [x] **Personal Communications** (if you find emails) - *Justification: "Only extracts public business emails displayed on websites for research."*
- [x] **Location** (if applicable) - *Justification: "Detects the business location from Google Maps to include in the user's export."*
- [x] **Authentication Information** - *Justification: "Login email and password to manage user accounts and API limits."*

---

### 4. Step-by-Step for You:
1.  **Zip the `extension/` folder** (make sure it has the new `manifest.json` I updated).
2.  **Upload to Developer Dashboard**.
3.  **Copy the justifications** above into the forms.
4.  **Wait for review** (The "Delay" message is normal, don't worry about it).

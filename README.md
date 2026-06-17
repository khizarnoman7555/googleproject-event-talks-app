# BigQuery Release Notes Hub ⚡

A premium, interactive dashboard to aggregate, search, filter, and share Google BigQuery release notes. 

## Features

- **Granular Updates parsing**: Breaks down composite daily RSS/Atom entries into distinct, cataloged update cards.
- **Intelligent Filtering & Tagging**: Filter updates instantly by type (`Feature`, `Announcement`, `Change`, `Issue`, `Breaking`) or perform free-text keyword search across content, dates, and headers.
- **KPI Metrics Dashboard**: Live counters displaying metrics (total releases, features, announcements, breaking changes).
- **Custom Twitter/X Sharing Integration**: Built-in composer modal that programmatically checks character count limits, truncates long updates safely under 280 characters (accommodating link redirection and hashtags), and generates a share intent link.
- **Modern Responsive Design System**: Dark/light themed glassmorphic UI with loading skeletons, toast notifications, error panels, and mobile-friendly layouts.

---

## Architecture Overview

```
                        ┌─────────────────────────────────┐
                        │   BigQuery Atom Feed (XML)      │
                        └────────────────┬────────────────┘
                                         │
                                   (Fetch & Parse)
                                         ▼
                        ┌─────────────────────────────────┐
                        │       Flask API (app.py)        │
                        └────────────────┬────────────────┘
                                         │
                              (GET /api/releases [JSON])
                                         ▼
                        ┌─────────────────────────────────┐
                        │   Client Web App (app.js)       │
                        └────────────────┬────────────────┘
                                         │
                               (Filter, Search & Render)
                                         ▼
                        ┌─────────────────────────────────┐
                        │   Interactive Twitter Sharing   │
                        └─────────────────────────────────┘
```

---

## File Structure

```
.
├── app.py                  # Flask Web Server & Atom Parser
├── requirements.txt        # Backend dependencies
├── templates/
│   └── index.html          # Single page template structure
└── static/
    ├── css/
    │   └── style.css       # Core styling & modern visual theme
    └── js/
        └── app.js          # Client-side reactivity, search & stats
```

---

## Getting Started

### Prerequisites
- Python 3.8+
- pip

### 1. Installation
Clone or navigate to the project directory and create a virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Running the Server
Start the development server:

```bash
python app.py
```

The application will be served locally at:
👉 **[http://127.0.0.1:5001](http://127.0.0.1:5001)**

---

## Technologies Used

- **Backend**: Python, Flask, `BeautifulSoup4` (HTML parsing), `feedparser` (XML parsing)
- **Frontend**: Vanilla HTML5, Vanilla JavaScript (ES6+), Vanilla CSS variables (for premium dark/light layout)
- **APIs**: Google Cloud Feed API, Twitter Intent Endpoint

# BaitBlock Extension - Complete Technical Documentation

## Overview
BaitBlock is a browser extension that detects phishing attempts in real-time by analyzing text content using ML models and pattern matching. It consists of a browser extension (frontend) and a FastAPI backend server.

## Architecture

### Core Components
1. **Browser Extension** (Chromium-based browsers)
   - Manifest V3 extension
   - Content scripts for webpage interaction
   - Background service worker for API communication
   - Popup interface for manual text scanning

2. **Backend Server** (Python FastAPI)
   - ML-based text classification using Hugging Face transformers
   - Regex pattern matching for phishing indicators
   - URL reputation analysis
   - REST API endpoint for analysis requests

## File Structure & Technical Details

### Extension Files

#### `manifest.json`
```json
{
  "manifest_version": 3,
  "name": "BaitBlock",
  "version": "1.0.0",
  "permissions": ["contextMenus", "storage", "activeTab", "scripting", "tabs"],
  "host_permissions": ["http://localhost:5000/*", "https://mail.google.com/*", ...],
  "background": { "service_worker": "background.js" },
  "content_scripts": [{ "matches": ["<all_urls>"], "js": ["content.js"], "css": ["content.css"] }]
}
```

#### `background.js` - Service Worker
**Key Functions:**
- `callLocalAPI(text)` - Makes POST requests to localhost:5000/predict
- Context menu creation for "Check for phishing" and "Scan this email"
- Message handling between popup and content scripts
- API endpoint: `http://localhost:5000/predict`

**Message Types:**
- `ANALYZE_TEXT` - Direct API call from content script
- `POPUP_SCAN` - Scan request from popup
- `SHOW_LOADING` - Display loading state
- `SHOW_RESULT` - Display analysis results
- `SCAN_EMAIL` - Email-specific scanning

#### `content.js` - Content Script Injection
**Core Features:**
- Email content extraction (Gmail/Outlook)
- URL extraction and analysis
- Result panel creation and management
- Auto-scanning for high-risk emails
- Caching system for scanned content

**Email Extraction:**
- Gmail: `[data-message-id] .ii.gt`, `.ii.gt`
- Outlook: `[role="main"] .rps_1f31`, `[data-testid="message-body"]`

**URL Analysis:**
- Regex pattern: `/https?:\/\/[^\s<>"]+/gi`
- Suspicious TLD detection: `.tk`, `.ml`, `.ga`, `.cf`, `.xyz`
- Typosquatting detection against trusted domains
- Brand impersonation checks

#### `content.css` - UI Styling
**Panel Design:**
- Fixed position sidebar (380px width)
- Dark theme (#1a1a1a background)
- Animated slide-in effect
- Score visualization with progress bars
- Responsive scrolling for findings list

#### `popup.html` & `popup.js` - Extension Popup
- Simple textarea input for manual text scanning
- Direct integration with background script
- Minimal UI (350px width)

### Backend Server

#### `server.py` - FastAPI Application
**Dependencies:**
```python
fastapi, uvicorn, transformers, torch, pydantic
```

**ML Model:**
- Model: `valhalla/distilbart-mnli-12-1` (zero-shot classification)
- Labels: `["urgent", "fear", "authority", "financial scam", "safe"]`
- Downloads ~890MB on first run

**Analysis Pipeline:**
1. **Regex Analysis** (`regex_analysis()`)
2. **ML Analysis** (`hf_analysis()`)
3. **URL Analysis** (`url_analysis()`)
4. **Final Scoring** (`analyze_text()`)

#### Core Analysis Functions

**`regex_analysis(text)`**
- Detects phishing cues by category:
  - Urgency: `\burgent\b`, `\bimmediately\b`, `\bact now\b`
  - Fear: `\bsuspended\b`, `\block(ed)?\b`, `\bcompromis(e|ed)\b`
  - Authority: `\bCEO\b`, `\bIT support\b`, `\bmicrosoft\b`
  - Financial: `\bprize\b`, `\bmoney\b`, `\b\$[0-9,]+\b`
- Spelling error detection
- Generic greeting detection
- Brand impersonation without legitimate domains

**`hf_analysis(text)`**
- Uses Hugging Face transformer model
- Confidence thresholds: >0.8 (high), >0.6 (medium), >0.3 (low)
- Returns human-readable descriptions

**`url_analysis(text)`**
- URL extraction with cleaning
- Domain reputation scoring
- IP address detection
- Suspicious TLD flagging
- Typosquatting detection
- Brand impersonation checks

**`url_reputation_score(domain)`**
- Domain length analysis (>30 chars = suspicious)
- Subdomain counting (>3 = suspicious)
- Suspicious keyword detection
- Entropy analysis for random-looking domains

#### Scoring Algorithm
```python
if url_score >= 70:  # High URL threat
    total_score = min(100, url_score + (regex_score * 0.3) + (hf_score * 0.2))
elif urls == []:  # Text-only analysis
    total_score = min(100, int(regex_score * 0.7 + hf_score * 0.5))
else:  # Balanced scoring
    total_score = min(100, int(regex_score * 0.5 + hf_score * 0.4 + url_score * 0.6))
```

**Risk Classification:**
- Score ≥60: High confidence phishing
- Score ≥35: Medium confidence phishing  
- Score <35: Low risk/safe

#### API Endpoint
**POST `/predict`**
```json
Request: { "data": ["text to analyze"] }
Response: {
  "data": ["phishing|safe", confidence_float],
  "details": {
    "score": int,
    "risk_level": "High|Medium|Low",
    "reasons": ["finding1", "finding2", ...],
    "extracted_urls": ["url1", "url2", ...] | "None detected",
    "short_text": boolean
  }
}
```

## Data Structures & Constants

### Trusted Domains
```python
TRUSTED_DOMAINS = ["google.com", "paypal.com", "microsoft.com", "amazon.com"]
BRAND_DOMAINS = {
    "microsoft": ["microsoft.com", "outlook.com", "office.com"],
    "google": ["google.com", "gmail.com"],
    "paypal": ["paypal.com"],
    "amazon": ["amazon.com"]
}
```

### Suspicious Patterns
```python
SUSPICIOUS_TLDS = ["xyz", "top", "tk", "gq", "cf", "ml"]
SPELLING_ERRORS = {
    "permanetly": "permanently",
    "recieve": "receive",
    "secuirty": "security"
}
```

## Installation & Setup

### Extension Installation
1. Download ZIP from releases
2. Extract to folder
3. Open `chrome://extensions`
4. Enable Developer Mode
5. Click "Load unpacked"
6. Select extracted folder

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python server.py
```
- Server runs on `localhost:5000`
- First run downloads 890MB ML model
- Requires stable internet connection

## Communication Flow

1. **User Action** → Context menu click or popup scan
2. **Background Script** → Receives message, calls API
3. **Backend Analysis** → Processes text through ML + regex
4. **Response** → JSON with score and findings
5. **Content Script** → Creates/updates result panel
6. **UI Display** → Shows risk level and detailed findings

## Key Features

### Auto-Scanning
- Monitors Gmail/Outlook for new emails
- Automatically scans high-risk content (confidence >0.7)
- Uses MutationObserver for DOM changes

### Caching System
- Map-based caching with 50-item limit
- Cache key: messageId or text substring
- Prevents duplicate API calls

### Context Menus
- "Check for phishing" - Selected text analysis
- "Scan this email" - Full email analysis
- Domain-specific (Gmail/Outlook only)

### Error Handling
- Offline server detection
- Network error recovery
- Invalid URL format handling
- Model loading error management

## Security Considerations

### Extension Permissions
- `activeTab` - Current tab access only
- `contextMenus` - Right-click menu creation
- `scripting` - Content script injection
- Host permissions limited to localhost + email providers

### Data Privacy
- No data stored permanently
- Local processing only
- No external API calls except localhost
- Cache cleared on extension restart

## Performance Optimizations

### Frontend
- Lazy loading of result panels
- Efficient DOM querying with specific selectors
- Debounced auto-scanning (2-second delay)
- CSS animations with hardware acceleration

### Backend
- Model loaded once at startup
- Regex compilation for pattern matching
- Consolidated findings to reduce response size
- Short text confidence reduction

## Extension Points for Rebuilding

### Modular Components
1. **Analysis Engine** - Easily replaceable ML models
2. **UI Framework** - Styled components system
3. **Communication Layer** - Message passing architecture
4. **Content Extraction** - Platform-specific parsers
5. **Scoring System** - Configurable weight algorithms

### Customization Options
- Different ML models (sentiment, classification, etc.)
- Custom regex patterns and scoring weights
- Alternative UI themes and layouts
- Additional platform support (Slack, Teams, etc.)
- Different backend frameworks (Flask, Django, etc.)

### Scalability Considerations
- Replace localhost with cloud API
- Add user authentication and rate limiting
- Implement result persistence and analytics
- Multi-language support for international use
- Enterprise deployment with custom domains

## Development Notes

### Testing Approach
- Manual testing with known phishing samples
- Email provider compatibility testing
- Performance testing with large text inputs
- Cross-browser compatibility verification

### Known Limitations
- Requires local server running
- Limited to Chromium browsers
- English-language focused analysis
- No real-time threat intelligence updates

### Future Enhancement Areas
- Real-time threat feed integration
- Advanced NLP models (BERT, GPT variants)
- Image-based phishing detection
- Social engineering pattern recognition
- Integration with security platforms (SIEM, etc.)

This documentation provides a complete technical reference for understanding, maintaining, and rebuilding the BaitBlock extension for different purposes.
# Blinky - AI Safety Companion for Kids Online
## Complete Technical Documentation

## Overview
Blinky is a browser extension designed as a digital "safety buddy" for children, providing real-time protection against cyberbullying, online grooming, inappropriate content, and scams. The system uses AI-powered text analysis combined with rule-based detection to identify threats and provide child-friendly guidance.

## Architecture

### Core Components
1. **Browser Extension** (Chromium Manifest V3)
   - Content script for real-time monitoring
   - Background service worker for API communication
   - Popup interface for manual scanning
   - Child-friendly UI with Blinky mascot

2. **Backend Server** (Python FastAPI)
   - AI toxicity detection using Hugging Face transformers
   - Rule-based pattern matching for child-specific threats
   - Child safety scoring algorithm
   - RESTful API for analysis requests

## File Structure & Technical Implementation

### Extension Files

#### `manifest.json`
```json
{
  "manifest_version": 3,
  "name": "Blinky - AI Safety Companion",
  "permissions": ["contextMenus", "storage", "activeTab", "scripting", "tabs"],
  "host_permissions": ["http://localhost:5000/*", "https://*/*"],
  "content_scripts": [{"matches": ["<all_urls>"], "js": ["content.js"], "css": ["content.css"]}],
  "web_accessible_resources": [{"resources": ["images/*.png"], "matches": ["<all_urls>"]}]
}
```

**Key Features:**
- Manifest V3 compliance for modern browsers
- Web accessible resources for Blinky mascot images
- Broad host permissions for social media monitoring
- Context menu integration for manual scanning

#### `background.js` - Service Worker
**Core Functions:**
- `analyzeText(text, context, tabId)` - Main analysis function
- Context menu creation: "Ask Blinky to check this text"
- Message routing between components
- Platform detection for supported sites

**Supported Platforms:**
- Discord, Instagram, Facebook/Messenger
- WhatsApp Web, YouTube, TikTok
- Roblox, Minecraft, Snapchat, Twitch

**API Communication:**
- Endpoint: `http://localhost:5000/analyze`
- Request format: `{text: string, context: string}`
- Handles offline scenarios gracefully

#### `content.js` - BlinkyMonitor Class
**Real-time Monitoring:**
- `MutationObserver` for new content detection
- Platform-specific message selectors
- Intelligent caching system (100 item limit)
- 2-second scan delay to prevent spam

**Message Detection Selectors:**
```javascript
const messageSelectors = [
  '[class*="messageContent"]',    // Discord
  '[class*="comment"]',           // Instagram/Facebook
  '[data-testid="message_body"]', // Messenger
  '[class*="message-in"]',        // WhatsApp
  '#content-text',                // YouTube
  '[data-e2e="comment-text"]',    // TikTok
  '[class*="chat-message"]'       // Roblox
];
```

**Safety Panel Creation:**
- Dynamic HTML generation with Blinky mascot
- Threat-level appropriate messaging
- Interactive suggestion buttons
- Auto-hide for low-risk threats (10 seconds)

#### `content.css` - Child-Friendly Styling
**Design Principles:**
- Bright, welcoming colors (yellow/gold gradient)
- Comic Sans MS font for child appeal
- Large, accessible buttons and text
- Smooth animations and transitions
- Mobile responsive design

**Key UI Elements:**
- Safety panel: 350px width, fixed position
- Blinky avatar: 40px circular with border
- Threat level badges: Color-coded (red/orange/yellow)
- Action buttons: Large, rounded, high contrast

#### `popup.html` & `popup.js` - Extension Interface
**Features:**
- Manual text scanning interface
- Real-time server status checking
- Child-friendly instructions and tips
- Loading states with spinner animation
- Error handling with helpful messages

### Backend Server

#### `server.py` - FastAPI Application
**Dependencies:**
```python
fastapi, uvicorn, transformers, torch, pydantic
```

**AI Models:**
- Primary: `unitary/toxic-bert` (toxicity detection)
- Fallback: `cardiffnlp/twitter-roberta-base-sentiment-latest`
- Zero-shot classification for threat categorization

#### Core Detection Functions

**`detect_bullying(text)`**
- Pattern matching for common bullying language
- Detects: insults, threats, exclusionary language
- Scoring: 30 points per match, 15 for aggressive tone
- Examples: "stupid", "kill yourself", "nobody likes you"

**`detect_grooming(text)`**
- High-severity patterns for predatory behavior
- Detects: secrecy requests, meeting attempts, manipulation
- Scoring: 50 points per match (highest severity)
- Examples: "our secret", "don't tell", "meet me"

**`detect_inappropriate_content(text)`**
- Sexual or mature content detection
- Age-inappropriate relationship discussions
- Scoring: 40 points per match
- Context-aware for child safety

**`detect_scams(text)`**
- Phishing and fraud attempt detection
- Free offers, personal information requests
- Scoring: 35 points per match
- Child-focused scam patterns

**`ai_toxicity_analysis(text)`**
- Hugging Face transformer analysis
- Confidence-based scoring
- Fallback to sentiment analysis if needed
- Error handling for model failures

#### Threat Assessment Algorithm

**Scoring System:**
```python
total_score = max(
    bullying_score,
    grooming_score * 1.5,      # Highest priority
    inappropriate_score * 1.2,  # High priority
    scam_score,
    ai_score
)
```

**Risk Classification:**
- **HIGH** (≥70): Immediate concern, persistent warning
- **MEDIUM** (≥40): Concerning content, guidance needed
- **LOW** (≥20): Minor issues, educational opportunity
- **SAFE** (<20): No action needed

**Blinky Emotion Mapping:**
- HIGH → `blinky_sobbing.png`
- MEDIUM → `blinky_single_cry.png`
- LOW → `blinky_neutral.png`
- SAFE → `blinky_happy.png`

#### API Endpoints

**POST `/analyze`**
```json
Request: {
  "text": "message to analyze",
  "context": "discord|instagram|general"
}

Response: {
  "success": true,
  "data": {
    "is_safe": false,
    "threat_level": "MEDIUM",
    "score": 65,
    "blinky_emotion": "single_cry",
    "findings": ["Bullying language detected: stupid"],
    "suggestions": ["Don't respond to mean messages", "Tell a teacher or parent"],
    "context": "discord"
  }
}
```

**GET `/health`**
- Server status endpoint
- Returns service availability
- Used by extension for connectivity checks

## Child Safety Features

### Real-time Protection
- Continuous monitoring of supported platforms
- Immediate threat detection and response
- Non-intrusive warning system
- Child-appropriate language and imagery

### Educational Approach
- Explains why content might be unsafe
- Provides actionable safety suggestions
- Encourages communication with trusted adults
- Builds digital literacy skills

### Threat-Specific Responses

**Bullying Detection:**
- Suggestions: "Don't respond", "Tell an adult", "Block user"
- Focus on emotional support and reporting
- Emphasizes that mean comments aren't their fault

**Grooming Detection:**
- High-priority alerts with persistent warnings
- Strong emphasis on telling trusted adults
- Clear guidance about not sharing personal info
- Immediate blocking recommendations

**Inappropriate Content:**
- Age-appropriate explanations
- Guidance to exit conversations
- Emphasis on adult supervision
- Clear boundaries about appropriate topics

**Scam Detection:**
- Education about online tricks
- Warning against clicking links
- Emphasis on asking adults before responding
- Password and personal info protection

## Technical Specifications

### Performance Optimizations
- Intelligent caching prevents duplicate analysis
- Debounced scanning (2-second delays)
- Lightweight pattern matching before AI analysis
- Efficient DOM querying with specific selectors

### Privacy & Security
- Local processing only (no external APIs)
- No permanent data storage
- Cache cleared on extension restart
- Minimal permissions required

### Accessibility Features
- High contrast mode support
- Large, readable fonts (Comic Sans MS)
- Color-coded threat levels
- Screen reader compatible structure
- Mobile responsive design

### Browser Compatibility
- Chromium-based browsers (Chrome, Edge, Brave)
- Manifest V3 compliance
- Modern JavaScript features
- CSS Grid and Flexbox layouts

## Installation & Setup

### Extension Installation
1. Download extension files
2. Open `chrome://extensions`
3. Enable Developer Mode
4. Click "Load unpacked"
5. Select extension folder

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python server.py
```
- Server runs on `localhost:5000`
- First run downloads AI models (~500MB)
- Requires Python 3.8+ and stable internet

## Development Guidelines

### Code Structure
- Modular class-based architecture
- Event-driven communication
- Separation of concerns (UI/Logic/API)
- Error handling at all levels

### Child-Centric Design
- Simple, friendly language
- Visual feedback with mascot emotions
- Non-threatening warning system
- Empowering rather than restrictive

### Extensibility Points
- Easy addition of new platforms
- Configurable threat patterns
- Customizable UI themes
- Pluggable AI models

## Testing Strategy

### Functional Testing
- Platform-specific message detection
- Threat classification accuracy
- UI responsiveness and accessibility
- Error handling and recovery

### Safety Testing
- False positive/negative analysis
- Age-appropriate response validation
- Stress testing with high message volumes
- Cross-platform compatibility verification

## Future Enhancements

### Planned Features
- Parent dashboard for incident review
- Customizable sensitivity settings
- Multi-language support
- Advanced AI model integration

### Scalability Considerations
- Cloud-based API deployment
- User authentication system
- Analytics and reporting
- Enterprise deployment options

## Mascot Integration

### Blinky Character Design
- Yellow ghost with blue cape
- Emotional expressions for different scenarios
- Child-friendly and approachable design
- Consistent branding across all interfaces

### Available Emotions
- `blinky_happy.png` - Safe content, positive feedback
- `blinky_neutral.png` - Low risk, general monitoring
- `blinky_single_cry.png` - Medium risk, concern
- `blinky_sobbing.png` - High risk, immediate attention
- `blinky_excited.png` - Success states, achievements
- `blinky_wink.png` - Friendly tips and encouragement
- `blinky_angry.png` - Serious warnings (reserved use)

This documentation provides a complete technical reference for understanding, maintaining, and extending the Blinky child safety extension.
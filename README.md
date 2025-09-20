# 👻 Blinky - AI Safety Companion for Kids Online

Blinky is a browser extension designed as a digital "safety buddy" for children, providing real-time protection against cyberbullying, online grooming, inappropriate content, and scams using AI-powered text analysis.

## 🚀 Quick Installation Guide

### Prerequisites
- Python 3.8+ installed
- Chrome browser
- Internet connection

### Step 1: Download & Setup Backend
```bash
# Clone or download the project
cd Blinky/backend

# Install Python dependencies
pip install -r requirements.txt

# Start the AI analysis server
python server.py
```
**✅ Server should start on `localhost:5000`**

### Step 2: Install Browser Extension
1. Open Chrome and go to `chrome://extensions`
2. Enable **"Developer mode"** (toggle in top right)
3. Click **"Load unpacked"**
4. Select the `Blinky/extension` folder
5. ✅ Blinky icon should appear in your extensions bar!

### Step 3: Parent/Guardian Setup
- Extension will automatically open setup page on first install
- Enter parent contact information for emergency alerts
- Complete the child safety configuration

### Step 4: Test Installation
1. Visit any social media site (Instagram, Discord, etc.)
2. Type a test message like "you're stupid" 
3. ✅ Blinky should highlight it and show warnings!

**🎉 Installation Complete! Blinky is now protecting your child online.**

---

## 🎯 Problem Statement

Children today are highly active online, from social media and gaming chats to school platforms. While these environments can be positive, they also expose kids to:
- **Cyberbullying**: Harassment, insults, exclusion, peer pressure
- **Online Grooming**: Predators attempting to manipulate or exploit children
- **Harmful Content**: Inappropriate messages, scams, or phishing attempts

Current parental control apps mainly focus on content blocking or usage timers, but don't empower children in real-time situations, often leaving them helpless when confronted with harmful messages.

## 💡 Solution

Blinky is a proactive, child-centered safety tool that:
1. **Detects risks in real time** using AI and pattern matching
2. **Highlights unsafe content** like Grammarly highlights grammar errors
3. **Provides child-friendly guidance** through a persistent sidebar
4. **Empowers children** with knowledge and safe response options

---

## ✨ Key Features

### 🔍 **Real-time Content Analysis**
- Automatically scans text content as you browse
- Uses AI toxicity detection models + rule-based patterns
- Detects bullying, grooming, inappropriate content, and scams

### 🎨 **Grammarly-Style Highlighting**
- Highlights unsafe text with color-coded severity
- **Red**: High risk (grooming, serious threats)
- **Orange**: Medium risk (bullying, inappropriate content)
- **Yellow**: Low risk (mild concerns)

### 📱 **Persistent Safety Sidebar**
- Shows notifications with Blinky mascot emotions
- Batches multiple threats to prevent spam
- Click highlights for detailed explanations
- Child-friendly language and suggestions

### 🛡️ **Child-Focused Protection**
- Detects age-inappropriate content patterns
- Provides actionable safety suggestions
- Encourages communication with trusted adults
- Non-intrusive, educational approach

---

## 🚀 Installation & Setup

### **Extension Installation**
1. Download the extension files
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer Mode** (toggle in top right)
4. Click **"Load unpacked"** and select the `extension` folder
5. ✅ Blinky is now installed and ready!

### **Backend Setup**
```bash
cd backend
pip install -r requirements.txt
python server.py
```
- Server runs on `localhost:5000`
- First run downloads AI models (~500MB)
- Requires stable internet connection

---

## 🎮 How It Works

1. **Browse Normally**: Blinky monitors content in the background
2. **Automatic Detection**: AI analyzes text for safety concerns
3. **Visual Highlighting**: Unsafe content gets highlighted with colors
4. **Sidebar Notifications**: Blinky shows friendly alerts and guidance
5. **Click for Details**: Click highlights to see explanations and suggestions

### **Supported Platforms**
- Social Media: Instagram, Facebook, TikTok, Snapchat
- Gaming: Discord, Roblox, Minecraft forums
- Video: YouTube comments, Twitch chat
- Messaging: WhatsApp Web, Telegram Web
- General: Any website with text content

---

## 🧠 Technology Stack

### **Frontend (Extension)**
- **JavaScript**: Chrome Extension APIs, Manifest V3
- **CSS**: Child-friendly UI with Comic Sans and bright colors
- **HTML**: Popup interface and content injection
- **Chat Interface**: Real-time AI chatbot integration

### **Backend (AI Analysis)**
- **Python**: FastAPI web server
- **AI Models**: 
  - Hugging Face transformers (toxic-bert) for threat detection
  - Mistral AI for intelligent chatbot responses
- **Pattern Matching**: Regex-based threat detection
- **API**: RESTful endpoints for analysis and chat

### **Detection Methods**
- **Bullying**: Insults, aggressive language, exclusion, severe threats (kys)
- **Grooming**: Secrecy requests, manipulation tactics
- **Inappropriate**: Sexual content, age-inappropriate topics
- **Scams**: Phishing attempts, personal info requests

### **Safety Features**
- **Real-time Monitoring**: Scans new content as it appears
- **Smart Highlighting**: Grammarly-style visual warnings
- **Collapsible Notifications**: Organized threat alerts in sidebar
- **Emergency Contacts**: Parent/guardian contact integration
- **AI Chat Companion**: 24/7 safety guidance and support
- **Hover Tooltips**: Detailed threat explanations on hover

---

## 🎥 Demo Instructions

### **For Hackathon Presentation:**

1. **Setup**: Start backend server, load extension
2. **Safe Content**: Show normal browsing with no alerts
3. **Unsafe Content**: Search for inappropriate terms, show highlighting
4. **Sidebar Demo**: Click highlights, show Blinky notifications
5. **Manual Check**: Right-click → "Ask Blinky to check this text"

### **Test Phrases** (for demo only):
- Bullying: "you're so stupid", "nobody likes you"
- Inappropriate: "send me pics", "don't tell anyone"
- Scams: "click this link for free money"

---

## 🔒 Privacy & Security

- **Local Processing**: All analysis happens locally or on your server
- **No Data Storage**: No permanent storage of analyzed content
- **Minimal Permissions**: Only accesses text content for analysis
- **Child Privacy**: No tracking or data collection
- **Secure API**: Environment variables protect sensitive keys
- **Parent Control**: Emergency contacts stored locally only

## 📚 Technical Documentation

### **API Endpoints**

#### `POST /analyze`
```json
{
  "text": "message content",
  "context": "discord|instagram|general"
}
```

#### `POST /chat`
```json
{
  "message": "Someone is being mean to me online"
}
```

### **Threat Detection Algorithm**
1. **Pattern Matching**: Regex patterns for known threats
2. **AI Analysis**: Toxic-BERT model scoring (0-100)
3. **Weighted Scoring**: Grooming ×1.5, Severe threats +80
4. **Risk Classification**: HIGH ≥70, MEDIUM ≥40, LOW ≥20

### **Extension Components**
- **Content Script**: DOM monitoring and threat highlighting
- **Background Script**: Installation flow and context menus
- **Chat System**: AI companion with Mistral integration
- **Onboarding**: Parent setup and emergency contacts

---

## 🌟 Impact

### **For Children**
- Builds digital literacy and safety awareness
- Provides real-time guidance without panic
- Empowers them to make safe choices online
- Feels like having a friendly safety buddy

### **For Parents**
- Peace of mind while reducing surveillance
- Educational tool that teaches rather than restricts
- Transparent about what content is flagged
- Encourages parent-child communication about online safety

### **For Society**
- Contributes to safer digital environments
- Reduces online harm to vulnerable users
- Promotes proactive rather than reactive safety
- Scalable solution for widespread deployment

---

## 🛠️ Development

### **Project Structure**
```
Blinky/
├── extension/          # Browser extension files
│   ├── manifest.json   # Extension configuration
│   ├── content.js      # Main monitoring script
│   ├── background.js   # Service worker
│   ├── popup.html/js   # Extension popup
│   ├── content.css     # Styling
│   └── images/         # Blinky mascot emotions
├── backend/            # AI analysis server
│   ├── server.py       # FastAPI application
│   └── requirements.txt # Python dependencies
└── docs/               # Documentation
```

### **Key Components**
- **BlinkyMonitor**: Main content script class
- **Text Analysis**: AI + regex pattern matching
- **Highlighting System**: Grammarly-style visual feedback
- **Sidebar Notifications**: Persistent safety alerts
- **Threat Batching**: Prevents notification spam

---

## 🤝 Contributing

This project was built for educational and safety purposes. Contributions welcome for:
- Additional language support
- New platform integrations
- Improved AI models
- Enhanced UI/UX
- Performance optimizations

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- **Hugging Face**: For providing open-source AI models
- **Child Safety Organizations**: For research and guidance
- **Open Source Community**: For tools and libraries used

---

**Built with ❤️ for keeping kids safe online**

*Blinky - Your friendly digital safety companion* 👻💙
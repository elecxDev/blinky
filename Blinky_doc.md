Blinky
AI Safety Companion for Kids Online
Problem Statement
Children today are highly active online, from social media and gaming chats to school platforms. While these environments can be positive, they also expose kids to:
•	Cyberbullying: Harassment, insults, exclusion, peer pressure.
•	Online Grooming: Predators attempting to manipulate or exploit children.
•	Harmful Content: Inappropriate messages, scams, or phishing attempts.
Current parental control apps mainly focus on content blocking, usage timers, or parental spying. These do not empower the child in real-time situations, often leaving them helpless when confronted with harmful messages.
There is a need for a proactive, child-centered safety tool that:
1.	Detects risks in real time.
2.	Suggests safe ways to respond.
3.	Notifies parents only in urgent cases.
Proposed Solution
Blinky is a browser extension with a companion app designed as a digital “safety buddy” for children. It continuously scans online text (chat windows, comments, DMs) for harmful patterns using lightweight NLP models and rule-based detection.
When suspicious content is detected, Blinky:
1.	Warns the child privately via a small, friendly toast notification.
2.	Suggests safe response actions (e.g., “I don’t want to talk about this”, “Please stop”).
3.	Provides an SOS button for the child to quickly block, exit, or alert a parent.
4.	Escalates to the parent dashboard if the threat is severe (e.g., grooming or sexual content).
This approach makes Blinky non-intrusive, empowering, and protective at the same time.
Key Features
•	Automatic Harmful Text Detection
o	Real-time scanning for bullying, grooming, harassment, scams.
o	Uses open-source datasets + HuggingFace toxicity models for accuracy.
•	SOS Quick-Action Toasts
o	Friendly popup notifications appear only when a threat is detected.
o	Options include: Block User, Send Safe Reply, Alert Parent (SOS).
•	PhishGuard Mode
o	Built-in detection for phishing links, scams, and fake websites.
o	Kids can also highlight suspicious text to “scan” it manually.
•	Parent Dashboard
o	Parents get alerts only in high-risk cases (reducing false positives).
o	Dashboard logs flagged incidents for review.
•	Hackathon-Friendly Demo Flow
o	Simulated unsafe chat message → Extension detects → Blinky shows toast → Child chooses safe action / SOS alert → Parent notified.
Technology Stack
•	Extension/Frontend: JavaScript (Chrome Extension APIs, Manifest v3).
•	Backend (optional): Node.js + Express OR Supabase for logs/alerts.
•	AI/NLP:
o	HuggingFace toxicity detection models (or lightweight sentiment analysis).
o	Regex/rule-based fallback for bullying keywords.
•	Notifications: Browser Push APIs; WhatsApp/Telegram SOS via Twilio.
•	Dashboard (if time permits): React / Angular simple UI for parent view.
External Sources
•	Datasets:
o	Jigsaw Toxic Comment Dataset (Kaggle).
o	Online grooming detection lexicons (open source).
•	Models/APIs:
o	HuggingFace toxicity/sentiment models.
o	Twilio / WhatsApp API for SOS alerts.
Impact
•	For Children: Builds confidence, feels like a “buddy,” helps them escape dangerous situations without panic.
•	For Parents: Provides peace of mind while reducing constant surveillance.
•	For Society: Contributes to safer digital ecosystems for vulnerable users.
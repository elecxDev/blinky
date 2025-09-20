import re
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline
import uvicorn

app = FastAPI(title="Blinky Child Safety API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"]
)

# Load toxicity detection model
try:
    toxicity_classifier = pipeline("text-classification", model="unitary/toxic-bert")
except:
    # Fallback to a lighter model if toxic-bert fails
    toxicity_classifier = pipeline("sentiment-analysis", model="cardiffnlp/twitter-roberta-base-sentiment-latest")

# Child safety detection patterns
BULLYING_PATTERNS = [
    r'\b(stupid|dumb|idiot|loser|freak|weirdo|ugly|fat|gay)\b',
    r'\b(kill yourself|kys|die|hate you|nobody likes you)\b',
    r'\b(shut up|go away|leave me alone|you suck)\b',
    r'\b(crybaby|baby|pathetic|worthless|useless)\b'
]

GROOMING_PATTERNS = [
    r'\b(secret|don\'t tell|between us|our little secret)\b',
    r'\b(meet me|come over|where do you live|send me)\b',
    r'\b(special friend|mature for your age|trust me)\b',
    r'\b(delete this|clear history|private message)\b',
    r'\b(photo|picture|pic|video|cam|webcam)\b.*\b(send|show|share)\b'
]

INAPPROPRIATE_PATTERNS = [
    r'\b(sex|sexual|naked|nude|body|private parts)\b',
    r'\b(touch|kiss|hug|cuddle)\b.*\b(want|like|love)\b',
    r'\b(boyfriend|girlfriend|relationship|dating)\b'
]

SCAM_PATTERNS = [
    r'\b(free|win|prize|money|gift|reward)\b',
    r'\b(click|link|website|download|install)\b',
    r'\b(password|login|account|personal info)\b'
]

class SafetyRequest(BaseModel):
    text: str
    context: str = "general"  # chat, comment, dm, etc.

def detect_bullying(text):
    score = 0
    findings = []
    text_lower = text.lower()
    
    for pattern in BULLYING_PATTERNS:
        matches = re.findall(pattern, text_lower)
        if matches:
            findings.append(f"Bullying language detected: {matches[0]}")
            score += 30
    
    # All caps (shouting)
    if re.search(r'\b[A-Z]{4,}\b', text):
        findings.append("Aggressive tone detected")
        score += 15
    
    # Excessive punctuation
    if text.count('!') > 2 or text.count('?') > 2:
        findings.append("Aggressive punctuation")
        score += 10
    
    return min(100, score), findings

def detect_grooming(text):
    score = 0
    findings = []
    text_lower = text.lower()
    
    for pattern in GROOMING_PATTERNS:
        matches = re.findall(pattern, text_lower)
        if matches:
            findings.append(f"Grooming indicator: {matches[0]}")
            score += 50  # High severity
    
    # Age-related questions
    if re.search(r'\b(how old|age|grade|school)\b', text_lower):
        findings.append("Personal information request")
        score += 25
    
    return min(100, score), findings

def detect_inappropriate_content(text):
    score = 0
    findings = []
    text_lower = text.lower()
    
    for pattern in INAPPROPRIATE_PATTERNS:
        matches = re.findall(pattern, text_lower)
        if matches:
            findings.append(f"Inappropriate content: {matches[0]}")
            score += 40
    
    return min(100, score), findings

def detect_scams(text):
    score = 0
    findings = []
    text_lower = text.lower()
    
    for pattern in SCAM_PATTERNS:
        matches = re.findall(pattern, text_lower)
        if matches:
            findings.append(f"Potential scam: {matches[0]}")
            score += 35
    
    return min(100, score), findings

def ai_toxicity_analysis(text):
    try:
        result = toxicity_classifier(text)
        
        # Handle different model outputs
        if isinstance(result, list) and len(result) > 0:
            if 'label' in result[0]:
                label = result[0]['label']
                score = result[0]['score']
                
                # For toxic-bert
                if 'TOXIC' in label.upper():
                    return int(score * 100), [f"AI detected toxic content ({int(score*100)}% confidence)"]
                # For sentiment models
                elif 'NEGATIVE' in label.upper() and score > 0.8:
                    return int(score * 60), [f"AI detected negative sentiment ({int(score*100)}% confidence)"]
        
        return 0, []
    except Exception as e:
        return 0, [f"AI analysis error: {str(e)}"]

def analyze_safety(text, context="general"):
    # Run all detection methods
    bullying_score, bullying_findings = detect_bullying(text)
    grooming_score, grooming_findings = detect_grooming(text)
    inappropriate_score, inappropriate_findings = detect_inappropriate_content(text)
    scam_score, scam_findings = detect_scams(text)
    ai_score, ai_findings = ai_toxicity_analysis(text)
    
    # Calculate weighted total score
    total_score = max(
        bullying_score,
        grooming_score * 1.5,  # Grooming is most serious
        inappropriate_score * 1.2,
        scam_score,
        ai_score
    )
    
    all_findings = bullying_findings + grooming_findings + inappropriate_findings + scam_findings + ai_findings
    
    # Determine threat level and appropriate Blinky emotion
    if total_score >= 70:
        threat_level = "HIGH"
        blinky_emotion = "sobbing"
        action_needed = True
    elif total_score >= 40:
        threat_level = "MEDIUM"
        blinky_emotion = "single_cry"
        action_needed = True
    elif total_score >= 20:
        threat_level = "LOW"
        blinky_emotion = "neutral"
        action_needed = True  # Changed to True for LOW risk
    else:
        threat_level = "SAFE"
        blinky_emotion = "happy"
        action_needed = False
    
    # Generate child-friendly suggestions
    suggestions = []
    if grooming_score > 30:
        suggestions.extend([
            "Tell a trusted adult about this message",
            "Don't share personal information",
            "Block this person"
        ])
    elif bullying_score > 30:
        suggestions.extend([
            "Don't respond to mean messages",
            "Tell a teacher or parent",
            "Block this person"
        ])
    elif inappropriate_score > 30:
        suggestions.extend([
            "This message isn't appropriate",
            "Tell a trusted adult",
            "Don't continue this conversation"
        ])
    elif scam_score > 30:
        suggestions.extend([
            "Don't click any links",
            "Don't share passwords or personal info",
            "Ask an adult before responding"
        ])
    
    return {
        "is_safe": not action_needed,
        "threat_level": threat_level,
        "score": int(total_score),
        "blinky_emotion": blinky_emotion,
        "findings": all_findings[:5],  # Limit findings
        "suggestions": suggestions[:3],  # Top 3 suggestions
        "context": context
    }

@app.post("/analyze")
async def analyze_text(request: SafetyRequest):
    try:
        print(f"📝 Analyzing text: '{request.text[:50]}...' (context: {request.context})")
        result = analyze_safety(request.text, request.context)
        print(f"🎯 Analysis result: {result['threat_level']} risk (score: {result['score']})")
        print(f"👻 Blinky emotion: {result['blinky_emotion']}")
        if result['findings']:
            print(f"🔍 Findings: {result['findings']}")
        return {"success": True, "data": result}
    except Exception as e:
        print(f"❌ Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Blinky Child Safety API"}

if __name__ == "__main__":
    print("🟡 Blinky Child Safety Server starting...")
    print("👻 Your digital safety buddy is ready!")
    uvicorn.run(app, host="localhost", port=5000)
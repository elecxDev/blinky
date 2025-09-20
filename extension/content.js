// Blinky Content Script - Child Safety Monitor

class BlinkyMonitor {
  constructor() {
    this.isMonitoring = false;
    this.scanCache = new Map();
    this.blinkyPanel = null;
    this.lastScanTime = 0;
    this.scanDelay = 5000; // 5 second delay between scans
    this.pendingThreats = [];
    this.batchTimeout = null;
    
    this.init();
  }

  init() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('📨 Content script received message:', request.type);
      
      switch (request.type) {
        case 'START_MONITORING':
          this.startMonitoring();
          break;
        case 'ANALYZE_SELECTED_TEXT':
          console.log('🔍 Analyzing selected text:', request.text);
          this.analyzeTextDirect(request.text, request.context);
          sendResponse({success: true});
          break;
        case 'SHOW_BLINKY_WARNING':
          console.log('⚠️ Showing Blinky warning for:', request.data);
          this.showBlinkyWarning(request.data, request.originalText);
          sendResponse({success: true});
          break;
        case 'SHOW_OFFLINE_MESSAGE':
          this.showOfflineMessage();
          break;
      }
    });

    // Start monitoring immediately for chat platforms
    this.startMonitoring();
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('👻 Blinky is now watching for your safety!');

    // Monitor for new messages/content
    this.observeNewContent();
    
    // Scan existing content
    this.scanExistingContent();
    
    // Show Blinky is active
    this.showBlinkyActive();
  }

  observeNewContent() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Check added nodes
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.scanNewElement(node);
          } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
            console.log('📝 New text node:', node.textContent.trim());
            this.checkTextContent(node.textContent.trim());
          }
        });
        
        // Check modified text content
        if (mutation.type === 'characterData' && mutation.target.textContent?.trim()) {
          console.log('📝 Modified text:', mutation.target.textContent.trim());
          this.checkTextContent(mutation.target.textContent.trim());
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
  
  checkTextContent(text, element = null) {
    const now = Date.now();
    if (now - this.lastScanTime < this.scanDelay) return;
    
    if (text.length > 5 && text.length < 1000 && !this.isUIElement(text)) {
      console.log('🔍 Checking new text content:', text);
      this.analyzeTextDirect(text, this.detectContext(), element);
      this.lastScanTime = now;
    }
  }

  scanNewElement(element) {
    // Check the element itself first
    const elementText = element.textContent?.trim();
    if (elementText && elementText.length > 5 && !this.isUIElement(elementText)) {
      console.log('💬 Direct element text:', elementText.substring(0, 50));
      this.checkTextContent(elementText);
    }
    
    // Scan all text-containing children aggressively
    const textElements = element.querySelectorAll ? element.querySelectorAll('*') : [];
    textElements.forEach(el => {
      const text = el.textContent?.trim();
      if (text && text.length > 5 && text.length < 1000 && !this.isUIElement(text)) {
        // Only analyze leaf elements (no text-containing children)
        const hasTextChildren = Array.from(el.children).some(child => 
          child.textContent?.trim().length > 0
        );
        
        if (!hasTextChildren) {
          console.log('💬 Found text element:', text.substring(0, 50));
          this.checkTextContent(text);
        }
      }
    });
  }

  scanExistingContent() {
    console.log('🔍 Scanning ALL existing content on page...');
    
    // Scan ALL text elements on page, not just messaging platforms
    const allTextElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, li');
    
    let scannedCount = 0;
    allTextElements.forEach(element => {
      const text = element.textContent?.trim();
      if (text && text.length > 5 && text.length < 1000 && !this.isUIElement(text)) {
        // Only scan leaf elements to avoid duplicates
        const hasTextChildren = Array.from(element.children).some(child => 
          child.textContent?.trim().length > 0
        );
        
        if (!hasTextChildren) {
          console.log(`📝 Initial scan: "${text.substring(0, 50)}..."`);
          this.checkTextContent(text);
          scannedCount++;
        }
      }
    });
    
    console.log(`🔍 Scanned ${scannedCount} text elements`);
  }

  analyzeMessage(messageElement) {
    if (!messageElement || !messageElement.textContent) return;

    const text = messageElement.textContent.trim();
    
    // Skip UI elements, icons, and non-message content
    if (this.isUIElement(text)) return;
    if (text.length < 5 || text.length > 1000) return;

    // Check cache to avoid re-scanning
    const textHash = this.hashText(text);
    if (this.scanCache.has(textHash)) return;

    this.scanCache.set(textHash, true);
    console.log('🔍 Blinky analyzing:', text.substring(0, 50) + '...');

    // Limit cache size
    if (this.scanCache.size > 100) {
      const firstKey = this.scanCache.keys().next().value;
      this.scanCache.delete(firstKey);
    }

    // Analyze directly instead of sending to background
    this.analyzeTextDirect(text, this.detectContext());
  }
  
  isUIElement(text) {
    const uiPatterns = [
      /^ic-/,  // Icon classes
      /emoji/i,
      /refreshed/i,
      /chevron/i,
      /menu/i,
      /^Send$/,
      /^OK, got it$/,
      /microphone/i,
      /voice message/i,
      /whatsapp needs/i,
      /stickers/i,
      /gifs/i,
      /^\s*$/, // Empty or whitespace
      /^[\w-]+$/, // Single words that look like CSS classes
      /default-contact/i
    ];
    
    return uiPatterns.some(pattern => pattern.test(text));
  }

  detectContext() {
    const url = window.location.hostname;
    if (url.includes('discord')) return 'discord';
    if (url.includes('instagram')) return 'instagram';
    if (url.includes('facebook') || url.includes('messenger')) return 'facebook';
    if (url.includes('whatsapp')) return 'whatsapp';
    if (url.includes('youtube')) return 'youtube';
    if (url.includes('tiktok')) return 'tiktok';
    if (url.includes('roblox')) return 'roblox';
    return 'general';
  }

  showBlinkyWarning(data, originalText) {
    console.log('👻 Showing Blinky warning:', data);
    
    // Don't show if panel already exists
    if (this.blinkyPanel) {
      console.log('🚫 Panel already showing, skipping');
      return;
    }

    // Create Blinky warning panel
    this.blinkyPanel = this.createBlinkyPanel(data, originalText);
    document.body.appendChild(this.blinkyPanel);
    
    console.log('✅ Blinky panel added to DOM');

    // Auto-hide after 15 seconds unless it's high threat
    if (data.threat_level !== 'HIGH') {
      setTimeout(() => {
        this.removeBlinkyPanel();
      }, 15000);
    }
  }

  createBlinkyPanel(data, originalText) {
    const panel = document.createElement('div');
    panel.id = 'blinky-safety-panel';
    panel.innerHTML = `
      <div class="blinky-header">
        <img src="${chrome.runtime.getURL(`images/blinky_${data.blinky_emotion}.png`)}" 
             alt="Blinky" class="blinky-avatar">
        <div class="blinky-title">
          <h3>Blinky Safety Alert</h3>
          <span class="threat-level ${data.threat_level.toLowerCase()}">${data.threat_level} RISK</span>
        </div>
        <button class="blinky-close" onclick="this.closest('#blinky-safety-panel').remove()">×</button>
      </div>
      
      <div class="blinky-content">
        <div class="warning-message">
          ${this.getThreatMessage(data.threat_level)}
        </div>
        
        ${data.findings.length > 0 ? `
          <div class="findings">
            <strong>What I noticed:</strong>
            <ul>
              ${data.findings.map(finding => `<li>${finding}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${data.suggestions.length > 0 ? `
          <div class="suggestions">
            <strong>What you can do:</strong>
            <div class="suggestion-buttons">
              ${data.suggestions.map((suggestion, index) => 
                `<button class="suggestion-btn" onclick="blinkyMonitor.handleSuggestion('${suggestion}', ${index})">${suggestion}</button>`
              ).join('')}
            </div>
          </div>
        ` : ''}
        
        <div class="blinky-actions">
          <button class="action-btn safe" onclick="blinkyMonitor.markAsSafe()">I'm Safe</button>
          <button class="action-btn help" onclick="blinkyMonitor.getHelp()">Get Help</button>
        </div>
      </div>
    `;

    return panel;
  }

  getThreatMessage(threatLevel) {
    switch (threatLevel) {
      case 'HIGH':
        return "🚨 I'm worried about this message. It might not be safe. Please talk to a trusted adult right away.";
      case 'MEDIUM':
        return "⚠️ This message seems concerning. Be careful and consider talking to someone you trust.";
      case 'LOW':
        return "💛 I noticed something that might not be very nice. You don't have to respond to mean messages.";
      default:
        return "👻 I'm here to keep you safe online!";
    }
  }

  handleSuggestion(suggestion, index) {
    console.log(`Blinky suggestion selected: ${suggestion}`);
    // Could implement actual actions here (block user, report, etc.)
    this.showFeedback(`Good choice! ${suggestion}`);
  }

  markAsSafe() {
    this.showFeedback("Great! I'm glad you're safe. I'll keep watching out for you! 👻💙");
    this.removeBlinkyPanel();
  }

  getHelp() {
    this.showFeedback("Remember: Talk to a parent, teacher, or trusted adult. You can also call a helpline if you need immediate help.");
  }

  showFeedback(message) {
    const feedback = document.createElement('div');
    feedback.className = 'blinky-feedback';
    feedback.innerHTML = `
      <img src="${chrome.runtime.getURL('images/blinky_happy.png')}" alt="Blinky">
      <span>${message}</span>
    `;
    document.body.appendChild(feedback);

    setTimeout(() => {
      feedback.remove();
    }, 4000);
  }

  showOfflineMessage() {
    const offline = document.createElement('div');
    offline.className = 'blinky-offline';
    offline.innerHTML = `
      <img src="${chrome.runtime.getURL('images/blinky_neutral.png')}" alt="Blinky">
      <span>Blinky is taking a nap. Make sure the Blinky server is running!</span>
    `;
    document.body.appendChild(offline);

    setTimeout(() => {
      offline.remove();
    }, 3000);
  }

  removeBlinkyPanel() {
    if (this.blinkyPanel) {
      this.blinkyPanel.remove();
      this.blinkyPanel = null;
    }
  }
  
  highlightUnsafeText(element, data) {
    const text = element.textContent;
    if (!text) return;
    
    // Create highlight wrapper
    const highlight = document.createElement('span');
    highlight.className = `blinky-highlight ${data.threat_level.toLowerCase()}`;
    highlight.style.cssText = `
      background: ${data.threat_level === 'HIGH' ? '#ff4444' : data.threat_level === 'MEDIUM' ? '#ff8800' : '#ffaa00'};
      color: white;
      padding: 2px 4px;
      border-radius: 3px;
      cursor: pointer;
      position: relative;
    `;
    highlight.textContent = text;
    highlight.title = `Blinky detected: ${data.findings.join(', ')}`;
    
    // Add click handler to show details
    highlight.addEventListener('click', () => {
      this.showSidebarNotification(data, text);
    });
    
    // Replace original element
    element.parentNode.replaceChild(highlight, element);
    
    // Auto-show in sidebar
    this.showSidebarNotification(data, text);
  }
  
  showSidebarNotification(data, text) {
    // Create or update sidebar
    let sidebar = document.getElementById('blinky-sidebar');
    if (!sidebar) {
      sidebar = this.createSidebar();
      document.body.appendChild(sidebar);
    }
    
    // Add notification to sidebar
    const notification = document.createElement('div');
    notification.className = `blinky-notification ${data.threat_level.toLowerCase()}`;
    notification.innerHTML = `
      <div class="notification-header">
        <img src="${chrome.runtime.getURL(`images/blinky_${data.blinky_emotion}.png`)}" class="mini-blinky">
        <span class="threat-badge">${data.threat_level}</span>
        <button class="close-notification" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="notification-content">
        <div class="detected-text">"${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"</div>
        <div class="findings">${data.findings.slice(0, 2).join(', ')}</div>
        ${data.suggestions.length > 0 ? `<div class="suggestion">${data.suggestions[0]}</div>` : ''}
      </div>
    `;
    
    const notificationsList = sidebar.querySelector('.notifications-list');
    notificationsList.insertBefore(notification, notificationsList.firstChild);
    
    // Limit to 5 notifications
    const notifications = notificationsList.children;
    if (notifications.length > 5) {
      notifications[notifications.length - 1].remove();
    }
  }
  
  createSidebar() {
    const sidebar = document.createElement('div');
    sidebar.id = 'blinky-sidebar';
    sidebar.innerHTML = `
      <div class="sidebar-header">
        <img src="${chrome.runtime.getURL('images/blinky_neutral.png')}" class="sidebar-blinky">
        <h3>Blinky Safety</h3>
        <button class="toggle-sidebar" onclick="document.getElementById('blinky-sidebar').classList.toggle('collapsed')">−</button>
      </div>
      <div class="notifications-list"></div>
      <div class="sidebar-footer">
        <small>Click highlighted text for details</small>
      </div>
    `;
    return sidebar;
  }

  async analyzeTextDirect(text, context = 'manual', element = null) {
    try {
      console.log('📞 Making direct API call for:', text.substring(0, 50));
      
      const response = await fetch('http://localhost:5000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          context: context
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('📊 Direct analysis result:', result);
      
      if (result.success && result.data.score >= 20) {
        console.log('⚠️ Adding threat to batch, score:', result.data.score);
        this.addThreatToBatch(result.data, text, element);
      } else {
        console.log('✅ Content is safe, score:', result.data.score);
        this.showSafeMessage(context);
      }
      
    } catch (error) {
      console.error('❌ Direct analysis error:', error);
      this.showOfflineMessage();
    }
  }

  showSafeMessage() {
    // Only show safe message for manual scans, not auto-detection
    if (arguments[0] === 'manual') {
      const safe = document.createElement('div');
      safe.className = 'blinky-feedback';
      safe.innerHTML = `
        <img src="${chrome.runtime.getURL('images/blinky_happy.png')}" alt="Blinky">
        <span>Blinky says this looks safe! 😊</span>
      `;
      document.body.appendChild(safe);

      setTimeout(() => {
        safe.remove();
      }, 3000);
    }
  }
  
  addThreatToBatch(data, text, element = null) {
    this.pendingThreats.push({ data, text, element });
    
    // Highlight immediately if element provided
    if (element && element.parentNode) {
      this.highlightUnsafeText(element, data);
    }
    
    // Clear existing timeout
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    // Set new timeout to show batched threats
    this.batchTimeout = setTimeout(() => {
      this.showBatchedThreats();
    }, 1000); // Reduced to 1 second
  }
  
  showBatchedThreats() {
    if (this.pendingThreats.length === 0) return;
    
    console.log(`📊 Processing ${this.pendingThreats.length} batched threats`);
    
    // Show each threat as sidebar notification
    this.pendingThreats.forEach(threat => {
      this.showSidebarNotification(threat.data, threat.text);
    });
    
    // Clear pending threats
    this.pendingThreats = [];
    this.batchTimeout = null;
  }

  showBlinkyActive() {
    const active = document.createElement('div');
    active.className = 'blinky-feedback';
    active.innerHTML = `
      <img src="${chrome.runtime.getURL('images/blinky_wink.png')}" alt="Blinky">
      <span>Blinky is watching to keep you safe! 👻</span>
    `;
    document.body.appendChild(active);

    setTimeout(() => {
      active.remove();
    }, 3000);
  }

  hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }
}

// Initialize Blinky Monitor
const blinkyMonitor = new BlinkyMonitor();

// Make it globally accessible for button clicks
window.blinkyMonitor = blinkyMonitor;

// Test function to show Blinky warning (for debugging)
window.testBlinky = function() {
  const testData = {
    is_safe: false,
    threat_level: 'MEDIUM',
    score: 65,
    blinky_emotion: 'single_cry',
    findings: ['Test finding: This is a test message'],
    suggestions: ['This is a test', 'Tell an adult'],
    context: 'test'
  };
  blinkyMonitor.showBlinkyWarning(testData, 'Test message');
};

console.log('👻 Blinky Monitor initialized! Type testBlinky() in console to test.');
// Blinky Content Script - Child Safety Monitor

class BlinkyMonitor {
  constructor() {
    this.isMonitoring = false;
    this.scanCache = new Map();
    this.blinkyPanel = null;
    this.lastScanTime = 0;
    this.scanDelay = 0; // No delay - scan everything immediately
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

    // Monitor for new messages/content only
    this.observeNewContent();
    
    // Show Blinky is active
    this.showBlinkyActive();
  }

  observeNewContent() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Skip mutations in Blinky elements
        if (this.isBlinkyElement(mutation.target)) return;
        
        // Check added nodes
        mutation.addedNodes.forEach((node) => {
          if (this.isBlinkyElement(node)) return;
          
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.scanNewElement(node);
          } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
            console.log('📝 New text node:', node.textContent.trim());
            this.checkTextContent(node.textContent.trim());
          }
        });
        
        // Check modified text content
        if (mutation.type === 'characterData' && 
            mutation.target.textContent?.trim() &&
            !this.isBlinkyElement(mutation.target)) {
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
    // Skip very short text or UI elements
    if (text.length < 3 || text.length > 500 || this.isUIElement(text)) return;
    
    console.log('🔍 Checking text content:', text);
    this.analyzeTextDirect(text, this.detectContext(), element);
  }

  scanNewElement(element) {
    // Skip Blinky's own elements
    if (this.isBlinkyElement(element)) return;
    
    // Look for actual message content by checking for specific patterns
    const messageSelectors = [
      '[data-testid*="message"]',
      '.message-content',
      '.message-text',
      '[role="gridcell"] span',
      'div[dir="auto"]',
      'p',
      'span'
    ];
    
    // Check if this element or its children contain message content
    let foundMessage = false;
    
    for (const selector of messageSelectors) {
      const messageElements = element.querySelectorAll ? element.querySelectorAll(selector) : [];
      messageElements.forEach(msgEl => {
        if (this.isBlinkyElement(msgEl)) return;
        
        const text = msgEl.textContent?.trim();
        if (text && text.length > 3 && text.length < 500 && !this.isUIElement(text)) {
          console.log('💬 Found message content:', text.substring(0, 50));
          this.checkTextContent(text, msgEl);
          foundMessage = true;
        }
      });
    }
    
    // Fallback: check direct text content if no message found
    if (!foundMessage) {
      const elementText = element.textContent?.trim();
      if (elementText && elementText.length > 3 && elementText.length < 500 && 
          !this.isUIElement(elementText)) {
        console.log('💬 Direct message text:', elementText.substring(0, 50));
        this.checkTextContent(elementText, element);
      }
    }
  }

  scanExistingContent() {
    console.log('🔍 Scanning ALL existing content on page...');
    
    // Scan ALL text elements on page
    const allTextElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, li');
    
    let scannedCount = 0;
    allTextElements.forEach(element => {
      if (this.isBlinkyElement(element)) return;
      
      const text = element.textContent?.trim();
      if (text && text.length > 5 && text.length < 1000 && !this.isUIElement(text)) {
        // Only scan leaf elements to avoid duplicates
        const hasTextChildren = Array.from(element.children).some(child => 
          child.textContent?.trim().length > 0
        );
        
        if (!hasTextChildren) {
          console.log(`📝 Initial scan: "${text.substring(0, 50)}..."`);
          this.checkTextContent(text, element);
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

    console.log('🔍 Blinky analyzing:', text.substring(0, 50) + '...');

    // Analyze directly instead of sending to background
    this.analyzeTextDirect(text, this.detectContext());
  }
  
  isBlinkyElement(element) {
    if (!element) return false;
    
    // Check if element or any parent is a Blinky element
    let current = element;
    while (current && current !== document.body) {
      const className = current.className ? String(current.className) : '';
      if (current.id === 'blinky-sidebar' || 
          current.id === 'blinky-safety-panel' ||
          className.includes('blinky-') ||
          className.includes('blinky')) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
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
      /default-contact/i,
      // UI interaction text
      /react to message/i,
      /reply to message/i,
      /see more options/i,
      /you sent/i,
      /^Enter$/,
      /^Clip$/,
      /^Today at/i,
      /^Yesterday at/i,
      /^\d{1,2}:\d{2}(AM|PM)$/i,
      /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i,
      /^\d{1,2}\/\d{1,2}\/\d{4}/,
      // Blinky-specific text
      /blinky/i,
      /safety/i,
      /threat/i,
      /detected/i,
      /findings/i,
      /suggestion/i
    ];
    
    return uiPatterns.some(pattern => pattern.test(text));
  }

  looksLikeMessage(text) {
    // Skip obvious UI elements
    if (this.isUIElement(text)) return false;
    
    // Skip timestamps and metadata
    if (/^\d{1,2}:\d{2}/.test(text)) return false;
    if (/^(Today|Yesterday|\w+ \d+)/.test(text)) return false;
    
    // Skip single words that are likely UI
    if (text.split(' ').length === 1 && text.length < 10) return false;
    
    // Must contain actual words (not just symbols/numbers)
    if (!/[a-zA-Z]{2,}/.test(text)) return false;
    
    return true;
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
    if (!element || !element.parentNode) return;
    
    const text = element.textContent;
    if (!text) return;
    
    console.log('🎨 Highlighting unsafe text:', text.substring(0, 30));
    
    // Create highlight wrapper
    const highlight = document.createElement('span');
    highlight.className = `blinky-highlight ${data.threat_level.toLowerCase()}`;
    highlight.style.cssText = `
      background: ${data.threat_level === 'HIGH' ? '#ff4444 !important' : data.threat_level === 'MEDIUM' ? '#ff8800 !important' : '#ffaa00 !important'};
      color: white !important;
      padding: 2px 4px !important;
      border-radius: 3px !important;
      cursor: pointer !important;
      position: relative !important;
      display: inline !important;
      font-weight: bold !important;
    `;
    highlight.textContent = text;
    
    // Add hover tooltip
    highlight.addEventListener('mouseenter', (e) => {
      this.showTooltip(e.target, data);
    });
    
    highlight.addEventListener('mouseleave', () => {
      this.hideTooltip();
    });
    
    try {
      element.parentNode.replaceChild(highlight, element);
      console.log('✅ Text highlighted successfully');
    } catch (error) {
      console.error('❌ Highlighting failed:', error);
    }
  }
  
  showTooltip(element, data) {
    // Remove existing tooltip
    this.hideTooltip();
    
    const tooltip = document.createElement('div');
    tooltip.id = 'blinky-tooltip';
    tooltip.innerHTML = `
      <div class="tooltip-header">
        <img src="${chrome.runtime.getURL(`images/blinky_${data.blinky_emotion}.png`)}" class="tooltip-blinky">
        <span class="tooltip-level">${data.threat_level} RISK</span>
      </div>
      <div class="tooltip-content">
        <div class="tooltip-findings">
          <strong>Why it's concerning:</strong>
          <ul>
            ${data.findings.map(finding => `<li>${finding}</li>`).join('')}
          </ul>
        </div>
        ${data.suggestions.length > 0 ? `
          <div class="tooltip-suggestions">
            <strong>How to respond:</strong>
            <ul>
              ${data.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
    
    document.body.appendChild(tooltip);
    
    // Position tooltip near the highlighted element
    const rect = element.getBoundingClientRect();
    const tooltipHeight = 200; // Approximate tooltip height
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    tooltip.style.position = 'fixed';
    tooltip.style.left = rect.left + 'px';
    tooltip.style.zIndex = '999999';
    
    // Show above if not enough space below
    if (spaceBelow < tooltipHeight && spaceAbove > tooltipHeight) {
      tooltip.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
      tooltip.classList.add('tooltip-above');
    } else {
      tooltip.style.top = (rect.bottom + 10) + 'px';
    }
  }
  
  hideTooltip() {
    const tooltip = document.getElementById('blinky-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  }
  
  showSidebarNotification(data, text) {
    // Create or update sidebar
    let sidebar = document.getElementById('blinky-sidebar');
    if (!sidebar) {
      sidebar = this.createSidebar();
      document.body.appendChild(sidebar);
    }
    
    // Add notification to sidebar
    const notificationId = 'notif-' + Date.now();
    const notification = document.createElement('div');
    notification.className = `blinky-notification ${data.threat_level.toLowerCase()}`;
    notification.id = notificationId;
    notification.innerHTML = `
      <div class="notification-header">
        <img src="${chrome.runtime.getURL(`images/blinky_${data.blinky_emotion}.png`)}" class="mini-blinky">
        <span class="threat-badge">${data.threat_level}</span>
        <div class="detected-text">"${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"</div>
        <span class="expand-arrow">▶</span>
        <button class="close-notification" onclick="event.stopPropagation(); this.closest('.blinky-notification').remove()">×</button>
      </div>
      <div class="notification-content" style="display: none;">
        <div class="findings">
          <strong>Why concerning:</strong>
          <ul>
            ${data.findings.map(finding => `<li>${finding}</li>`).join('')}
          </ul>
        </div>
        ${data.suggestions.length > 0 ? `
          <div class="suggestions">
            <strong>How to respond:</strong>
            <ul>
              ${data.suggestions.map(suggestion => {
                if (suggestion.includes('You can say:')) {
                  const response = suggestion.replace('You can say: ', '').replace(/["']/g, '');
                  return `<li>${suggestion} <button class="copy-btn" onclick="blinkyMonitor.copyResponse('${response}')">📋 Copy</button></li>`;
                }
                return `<li>${suggestion}</li>`;
              }).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
    
    // Add click handler to header
    const header = notification.querySelector('.notification-header');
    header.addEventListener('click', () => this.toggleNotification(notificationId));
    
    const notificationsList = sidebar.querySelector('.notifications-list');
    notificationsList.insertBefore(notification, notificationsList.firstChild);
    
    // Limit to 5 notifications
    const notifications = notificationsList.children;
    if (notifications.length > 5) {
      notifications[notifications.length - 1].remove();
    }
    
    // Start cleanup monitoring
    this.startCleanupMonitoring();
  }
  
  toggleNotification(notificationId) {
    const notification = document.getElementById(notificationId);
    if (!notification) return;
    
    const content = notification.querySelector('.notification-content');
    const arrow = notification.querySelector('.expand-arrow');
    
    if (content.style.display === 'none') {
      content.style.display = 'block';
      arrow.textContent = '▼';
    } else {
      content.style.display = 'none';
      arrow.textContent = '▶';
    }
  }
  
  startCleanupMonitoring() {
    if (this.cleanupInterval) return;
    
    this.cleanupInterval = setInterval(() => {
      this.cleanupOffscreenHighlights();
    }, 2000);
  }
  
  cleanupOffscreenHighlights() {
    const highlights = document.querySelectorAll('.blinky-highlight');
    highlights.forEach(highlight => {
      if (!document.body.contains(highlight) || !this.isElementVisible(highlight)) {
        highlight.remove();
      }
    });
  }
  
  isElementVisible(element) {
    return element.offsetParent !== null && element.offsetWidth > 0 && element.offsetHeight > 0;
  }
  
  openChat() {
    window.open(chrome.runtime.getURL('chat.html'), '_blank');
  }
  
  createFloatingChatWidget() {
    const widget = document.createElement('div');
    widget.id = 'blinky-chat-widget';
    widget.innerHTML = `
      <div class="chat-widget-header" onclick="blinkyMonitor.toggleChatWidget()">
        <img src="${chrome.runtime.getURL('images/blinky_wink.png')}" class="widget-blinky">
        <span>Chat with Blinky</span>
        <span class="widget-arrow">▲</span>
      </div>
      <div class="chat-widget-content" style="display: none;">
        <div class="widget-messages" id="widgetMessages"></div>
        <div class="widget-input">
          <input type="text" id="widgetInput" placeholder="Ask Blinky..." maxlength="200">
          <button onclick="blinkyMonitor.sendWidgetMessage()">💬</button>
        </div>
      </div>
    `;
    document.body.appendChild(widget);
    return widget;
  }
  
  toggleChatWidget() {
    const content = document.querySelector('.chat-widget-content');
    const arrow = document.querySelector('.widget-arrow');
    
    if (content.style.display === 'none') {
      content.style.display = 'block';
      arrow.textContent = '▼';
    } else {
      content.style.display = 'none';
      arrow.textContent = '▲';
    }
  }
  
  async sendWidgetMessage() {
    const input = document.getElementById('widgetInput');
    const message = input.value.trim();
    if (!message) return;
    
    input.value = '';
    this.addWidgetMessage(message, 'user');
    
    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      
      const data = await response.json();
      if (data.success) {
        this.addWidgetMessage(data.response, 'blinky');
      } else {
        this.addWidgetMessage("I'm having trouble thinking! Try the full chat page. 👻", 'blinky');
      }
    } catch (error) {
      this.addWidgetMessage("Can't connect! Make sure Blinky server is running. 😅", 'blinky');
    }
  }
  
  addWidgetMessage(content, sender) {
    const messages = document.getElementById('widgetMessages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `widget-message ${sender}`;
    msgDiv.textContent = content;
    messages.appendChild(msgDiv);
    messages.scrollTop = messages.scrollHeight;
  }
  
  copyResponse(text) {
    navigator.clipboard.writeText(text).then(() => {
      this.showFeedback(`Response copied: "${text}" 📋`);
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showFeedback(`Response copied: "${text}" 📋`);
    });
  }
  
  createSidebar() {
    const sidebar = document.createElement('div');
    sidebar.id = 'blinky-sidebar';
    sidebar.innerHTML = `
      <div class="sidebar-header">
        <img src="${chrome.runtime.getURL('images/blinky_neutral.png')}" class="sidebar-blinky">
        <h3>Blinky Safety</h3>
        <button class="position-toggle" id="position-toggle-btn" title="Switch sides">⇄</button>
        <button class="toggle-sidebar" id="blinky-close-btn">×</button>
      </div>
      <div class="notifications-list"></div>
      <div class="sidebar-footer">
        <div class="emergency-contact" id="emergency-info" style="display: none;">
          <div class="emergency-header">
            <strong>🆘 Need Help?</strong>
          </div>
          <div class="contact-info">
            <div>Contact your parent/guardian:</div>
            <div id="parent-contact"></div>
          </div>
        </div>
        <button class="chat-btn" onclick="blinkyMonitor.openChat()">
          👻 Chat with Blinky
        </button>
        <small>Click highlighted text for details</small>
      </div>
    `;
    
    // Load and display emergency contact info
    this.loadEmergencyContacts();
    
    // Add event listeners after creating the sidebar
    setTimeout(() => {
      const closeBtn = document.getElementById('blinky-close-btn');
      const positionBtn = document.getElementById('position-toggle-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.toggleSidebar());
      }
      if (positionBtn) {
        positionBtn.addEventListener('click', () => this.toggleSidebarPosition());
      }
    }, 100);
    
    return sidebar;
  }
  
  loadEmergencyContacts() {
    chrome.storage.local.get(['parentName', 'parentPhone', 'setupComplete'], (result) => {
      if (result.setupComplete && result.parentName && result.parentPhone) {
        const emergencyInfo = document.getElementById('emergency-info');
        const parentContact = document.getElementById('parent-contact');
        
        if (emergencyInfo && parentContact) {
          parentContact.innerHTML = `
            <div style="font-size: 11px; margin: 4px 0;">
              <strong>${result.parentName}</strong><br>
              📞 ${result.parentPhone}
            </div>
          `;
          emergencyInfo.style.display = 'block';
        }
      }
    });
  }
  
  createDock() {
    const dock = document.createElement('div');
    dock.id = 'blinky-dock';
    
    // Check if sidebar was on right side
    const sidebar = document.getElementById('blinky-sidebar');
    if (sidebar && sidebar.classList.contains('right-side')) {
      dock.classList.add('right-side');
    }
    
    dock.innerHTML = `
      <img src="${chrome.runtime.getURL('images/blinky_wink.png')}" alt="Blinky">
      <div class="dock-text">BLINKY</div>
    `;
    dock.onclick = () => this.toggleSidebar();
    return dock;
  }
  
  toggleSidebar() {
    const sidebar = document.getElementById('blinky-sidebar');
    let dock = document.getElementById('blinky-dock');
    
    if (sidebar) {
      if (sidebar.classList.contains('collapsed')) {
        // Show sidebar, hide dock
        sidebar.classList.remove('collapsed');
        if (dock) dock.remove();
      } else {
        // Hide sidebar, show dock
        sidebar.classList.add('collapsed');
        if (!dock) {
          dock = this.createDock();
          document.body.appendChild(dock);
        }
      }
    }
  }
  
  toggleSidebarPosition() {
    const sidebar = document.getElementById('blinky-sidebar');
    if (sidebar) {
      if (sidebar.classList.contains('left-side')) {
        sidebar.classList.remove('left-side');
        sidebar.classList.add('right-side');
      } else {
        sidebar.classList.remove('right-side');
        sidebar.classList.add('left-side');
      }
    }
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
    
    console.log('🚨 Adding threat to batch:', { text: text.substring(0, 30), hasElement: !!element });
    
    // Highlight immediately if element provided
    if (element && element.parentNode) {
      console.log('🎨 Attempting to highlight element');
      this.highlightUnsafeText(element, data);
    } else {
      console.log('⚠️ No element to highlight, adding to sidebar only');
    }
    
    // Always show in sidebar
    this.showSidebarNotification(data, text);
    
    // Clear pending threats immediately since we processed this one
    this.pendingThreats = [];
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }
  
  showBatchedThreats() {
    if (this.pendingThreats.length === 0) return;
    
    console.log(`📊 Processing ${this.pendingThreats.length} batched threats`);
    
    // Show each threat as sidebar notification (without highlighting again)
    this.pendingThreats.forEach(threat => {
      if (!threat.element) {
        // Only show sidebar notification if no element to highlight
        this.showSidebarNotification(threat.data, threat.text);
      }
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

// Test functions for debugging
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

window.testHighlight = function() {
  // Find first text element and highlight it
  const textElements = document.querySelectorAll('p, span, div, h1, h2, h3');
  for (let element of textElements) {
    if (element.textContent?.trim().length > 10 && !blinkyMonitor.isBlinkyElement(element)) {
      const testData = {
        threat_level: 'HIGH',
        findings: ['Test threat detected'],
        suggestions: ['This is a test']
      };
      blinkyMonitor.highlightUnsafeText(element, testData);
      break;
    }
  }
};

console.log('👻 Blinky Monitor initialized!');
console.log('Test commands: testBlinky() or testHighlight()');
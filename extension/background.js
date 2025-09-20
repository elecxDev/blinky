// Blinky Background Service Worker - Child Safety Companion

const API_URL = 'http://localhost:5000/analyze';

// Create context menu for manual scanning
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "blinky-scan-text",
    title: "Ask Blinky to check this text",
    contexts: ["selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "blinky-scan-text" && info.selectionText) {
    // Send directly to content script to handle the API call
    chrome.tabs.sendMessage(tab.id, {
      type: 'ANALYZE_SELECTED_TEXT',
      text: info.selectionText,
      context: 'manual'
    });
  }
});

// Main text analysis function
async function analyzeText(text, context = "auto", tabId = null) {
  try {
    const response = await fetch(API_URL, {
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
    console.log('📊 Analysis result:', result);
    
    if (result.success) {
      console.log(`🔍 Safety check: ${result.data.is_safe ? 'SAFE' : 'UNSAFE'} (${result.data.threat_level}, score: ${result.data.score})`);
      
      // Show warning for any detected risk (LOW, MEDIUM, HIGH)
      if (result.data.score >= 20 && tabId) {
        console.log('📨 Sending warning to content script for score:', result.data.score);
        chrome.tabs.sendMessage(tabId, {
          type: 'SHOW_BLINKY_WARNING',
          data: result.data,
          originalText: text
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('❌ Error sending message:', chrome.runtime.lastError);
          } else {
            console.log('✅ Message sent successfully');
          }
        });
      } else {
        console.log('✅ Content is safe or score too low:', result.data.score);
      }
    }

    return result;
  } catch (error) {
    console.error('Blinky analysis error:', error);
    
    // Show offline message
    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        type: 'SHOW_OFFLINE_MESSAGE'
      });
    }
    
    return { success: false, error: error.message };
  }
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'ANALYZE_TEXT':
      analyzeText(request.text, request.context, sender.tab?.id)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open for async response

    case 'POPUP_SCAN':
      analyzeText(request.text, "popup")
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'GET_BLINKY_STATUS':
      // Check if Blinky server is running
      fetch('http://localhost:5000/health')
        .then(response => response.json())
        .then(data => sendResponse({ online: true, status: data }))
        .catch(() => sendResponse({ online: false }));
      return true;
  }
});

// Auto-scan new content on supported platforms
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if it's a social media or chat platform
    const supportedSites = [
      'discord.com',
      'instagram.com',
      'facebook.com',
      'messenger.com',
      'whatsapp.com',
      'telegram.org',
      'snapchat.com',
      'tiktok.com',
      'youtube.com',
      'twitch.tv',
      'roblox.com',
      'minecraft.net'
    ];

    const isSupportedSite = supportedSites.some(site => tab.url.includes(site));
    
    if (isSupportedSite) {
      // Inject content script and start monitoring
      chrome.tabs.sendMessage(tabId, {
        type: 'START_MONITORING',
        site: tab.url
      });
    }
  }
});
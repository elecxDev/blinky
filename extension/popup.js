// Blinky Popup Script

document.addEventListener('DOMContentLoaded', function() {
  const textInput = document.getElementById('textInput');
  const scanBtn = document.getElementById('scanBtn');
  const status = document.getElementById('status');
  const result = document.getElementById('result');
  const loading = document.getElementById('loading');
  const resultAvatar = document.getElementById('resultAvatar');
  const resultTitle = document.getElementById('resultTitle');
  const resultContent = document.getElementById('resultContent');

  // Check Blinky server status
  checkBlinkyStatus();

  // Handle scan button click
  scanBtn.addEventListener('click', function() {
    const text = textInput.value.trim();
    if (!text) {
      showResult({
        is_safe: true,
        blinky_emotion: 'neutral',
        message: "Please type a message for me to check!"
      });
      return;
    }

    scanText(text);
  });

  // Handle Enter key in textarea
  textInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.ctrlKey) {
      scanBtn.click();
    }
  });

  function checkBlinkyStatus() {
    chrome.runtime.sendMessage({ type: 'GET_BLINKY_STATUS' }, function(response) {
      if (response && response.online) {
        status.className = 'status online';
        status.innerHTML = '✅ Blinky is online and ready to help!';
        scanBtn.disabled = false;
      } else {
        status.className = 'status offline';
        status.innerHTML = '❌ Blinky is sleeping. Please start the Blinky server first.';
        scanBtn.disabled = true;
      }
    });
  }

  function scanText(text) {
    // Show loading
    result.style.display = 'none';
    loading.style.display = 'block';
    scanBtn.disabled = true;

    // Send to background script for analysis
    chrome.runtime.sendMessage({
      type: 'POPUP_SCAN',
      text: text
    }, function(response) {
      loading.style.display = 'none';
      scanBtn.disabled = false;

      if (response && response.success) {
        showResult(response.data);
      } else {
        showError(response ? response.error : 'Unknown error');
      }
    });
  }

  function showResult(data) {
    result.style.display = 'block';
    
    // Set Blinky avatar based on emotion
    resultAvatar.src = `images/blinky_${data.blinky_emotion || 'happy'}.png`;
    
    if (data.is_safe) {
      result.className = 'result safe';
      resultTitle.textContent = "✅ This looks safe!";
      resultContent.innerHTML = `
        <p>Blinky thinks this message is okay! 😊</p>
        <p><strong>Remember:</strong> If anything ever makes you feel uncomfortable, it's always okay to talk to a trusted adult.</p>
      `;
    } else {
      result.className = 'result unsafe';
      resultTitle.textContent = `⚠️ ${data.threat_level} Risk Detected`;
      
      let content = `<p>${getThreatMessage(data.threat_level)}</p>`;
      
      if (data.findings && data.findings.length > 0) {
        content += `<p><strong>What I noticed:</strong></p><ul>`;
        data.findings.slice(0, 3).forEach(finding => {
          content += `<li>${finding}</li>`;
        });
        content += `</ul>`;
      }
      
      if (data.suggestions && data.suggestions.length > 0) {
        content += `<p><strong>What you can do:</strong></p><ul>`;
        data.suggestions.slice(0, 3).forEach(suggestion => {
          content += `<li>${suggestion}</li>`;
        });
        content += `</ul>`;
      }
      
      resultContent.innerHTML = content;
    }
  }

  function showError(error) {
    result.style.display = 'block';
    result.className = 'result offline';
    resultAvatar.src = 'images/blinky_neutral.png';
    resultTitle.textContent = "😴 Blinky is taking a nap";
    resultContent.innerHTML = `
      <p>I can't check this message right now. Make sure the Blinky server is running!</p>
      <p><strong>Error:</strong> ${error}</p>
    `;
  }

  function getThreatMessage(threatLevel) {
    switch (threatLevel) {
      case 'HIGH':
        return "🚨 I'm really worried about this message. Please show it to a trusted adult right away!";
      case 'MEDIUM':
        return "⚠️ This message seems concerning. Be careful and consider talking to someone you trust.";
      case 'LOW':
        return "💛 I noticed something that might not be very nice. Remember, you don't have to respond to mean messages.";
      default:
        return "I'm here to help keep you safe online! 👻💙";
    }
  }

  // Auto-focus on text input
  textInput.focus();
});
// Blinky Chat Interface

class BlinkyChat {
    constructor() {
        this.messages = [];
        this.init();
    }

    init() {
        const sendBtn = document.getElementById('sendBtn');
        const messageInput = document.getElementById('messageInput');
        
        sendBtn.addEventListener('click', () => this.sendMessage());
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message
        this.addMessage(message, 'user');
        input.value = '';
        
        // Show typing indicator
        this.showTyping();
        
        try {
            const response = await fetch('http://localhost:5000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            
            const data = await response.json();
            this.hideTyping();
            
            if (data.success) {
                this.addMessage(data.response, 'blinky');
            } else {
                this.addMessage("Oops! I'm having trouble thinking right now. Can you try asking again? 🤔", 'blinky');
            }
        } catch (error) {
            this.hideTyping();
            this.addMessage("I can't connect to my brain right now! Make sure the Blinky server is running. 😅", 'blinky');
        }
    }

    addMessage(content, sender) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const avatar = sender === 'blinky' ? 'images/blinky_happy.png' : 'images/user_avatar.png';
        
        messageDiv.innerHTML = `
            <img src="${avatar}" alt="${sender}" class="message-avatar">
            <div class="message-content">${content}</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTyping() {
        document.getElementById('typingIndicator').style.display = 'block';
    }

    hideTyping() {
        document.getElementById('typingIndicator').style.display = 'none';
    }
}

// Initialize chat when page loads
document.addEventListener('DOMContentLoaded', () => {
    new BlinkyChat();
});
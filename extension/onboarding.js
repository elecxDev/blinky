// Blinky Onboarding Script

function completeSetup() {
    const form = document.getElementById('setupForm');
    const formData = new FormData(form);
    
    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Collect data
    const setupData = {
        parentName: formData.get('parentName'),
        parentEmail: formData.get('parentEmail'),
        parentPhone: formData.get('parentPhone'),
        childName: formData.get('childName'),
        setupComplete: true,
        setupDate: new Date().toISOString()
    };
    
    // Save to Chrome storage
    chrome.storage.local.set(setupData, () => {
        showSuccess();
    });
}

function showSuccess() {
    document.body.innerHTML = `
        <div class="container" style="text-align: center;">
            <img src="images/blinky_happy.png" alt="Blinky" class="blinky-logo" style="width: 100px; height: 100px; margin: 20px auto; display: block;">
            <h1 style="color: #4CAF50;">🎉 Setup Complete!</h1>
            <p style="font-size: 18px; margin: 20px 0;">Blinky is now protecting your child online!</p>
            
            <div style="background: #E8F5E8; padding: 20px; border-radius: 15px; margin: 20px 0;">
                <h3 style="color: #4CAF50; margin: 0 0 10px;">✅ What happens next:</h3>
                <ul style="text-align: left; max-width: 400px; margin: 0 auto;">
                    <li>Blinky will monitor for unsafe content in real-time</li>
                    <li>Your child will see friendly warnings when needed</li>
                    <li>You'll receive alerts for serious threats</li>
                    <li>Weekly safety reports will be sent to your email</li>
                </ul>
            </div>
            
            <p style="color: #666; margin: 20px 0;">You can close this tab now. Blinky is working in the background!</p>
            
            <button onclick="window.close()" style="background: #4CAF50; color: white; border: none; padding: 15px 30px; border-radius: 20px; font-size: 16px; cursor: pointer; font-family: inherit;">
                Close & Start Protecting 👻
            </button>
        </div>
    `;
}
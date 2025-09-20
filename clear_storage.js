// Run this in browser console to clear Blinky storage and force setup
chrome.storage.local.clear(() => {
  console.log('Blinky storage cleared - setup will show on next reload');
  location.reload();
});
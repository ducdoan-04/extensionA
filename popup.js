// popup.js
document.getElementById('save').onclick = () => {
  const key = document.getElementById('apiKey').value.trim();
  if (key && key.startsWith('AIza')) {
    chrome.storage.sync.set({ geminiKey: key }, () => {
      showStatus('ĐÃ LƯU KEY!', 'green');
    });
  } else {
    showStatus('Key không hợp lệ!', 'red');
  }
};

function showStatus(msg, color) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.style.color = color;
  setTimeout(() => el.textContent = '', 3000);
}

// Tải key
chrome.storage.sync.get('geminiKey', (data) => {
  if (data.geminiKey) {
    document.getElementById('apiKey').value = data.geminiKey;
    showStatus('Key đã sẵn sàng', 'green');
  }
});

// Test API
document.getElementById('test').onclick = async () => {
  const { geminiKey } = await chrome.storage.sync.get('geminiKey');
  if (!geminiKey) return showStatus('Chưa lưu key!', 'red');

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: '1 + 1 = ?' }] }],
          generationConfig: { maxOutputTokens: 10 }
        })
      }
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const ans = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'OK';
    showStatus(`GEMINI HOẠT ĐỘNG! → ${ans}`, 'green');
  } catch (e) {
    showStatus('Lỗi kết nối: ' + e.message, 'red');
  }
};
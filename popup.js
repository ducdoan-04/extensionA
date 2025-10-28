// Lưu key
document.getElementById('save').onclick = () => {
  const key = document.getElementById('apiKey').value.trim();
  if (key && key.startsWith('AIza')) {
    chrome.storage.sync.set({ geminiKey: key }, () => {
      alert('ĐÃ LƯU KEY THÀNH CÔNG!');
    });
  } else {
    alert('Key không hợp lệ!');
  }
};

// Tải key
chrome.storage.sync.get('geminiKey', (data) => {
  if (data.geminiKey) document.getElementById('apiKey').value = data.geminiKey;
});

// Test API
document.getElementById('test').onclick = async () => {
  chrome.storage.sync.get('geminiKey', async (data) => {
    const key = data.geminiKey;
    if (!key) return alert('Chưa lưu key!');

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: "Giải nhanh phép tính: 1 + 1 = ?" }
                ]
              }
            ],
            generationConfig: { 
              maxOutputTokens: 50,
              temperature: 0.3
            }
          })
        }
      );

      const json = await res.json();
      console.log("Gemini full response:", json);

      // Lấy phần text trả về (tuỳ theo kiểu dữ liệu)
      const ans =
        json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
        json?.candidates?.[0]?.output_text?.trim() ||
        json?.output_text ||
        json?.text ||
        "(Không có phản hồi)";

      alert(`GEMINI HOẠT ĐỘNG!\nTrả lời: ${ans}`);
    } catch (e) {
      alert('Lỗi: ' + e.message);
    }
  });
};
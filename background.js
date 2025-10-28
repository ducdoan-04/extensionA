chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'callGemini') {
    (async () => {
      try {
        const data = await chrome.storage.sync.get('geminiKey');
        const API_KEY = data.geminiKey;
        if (!API_KEY || !API_KEY.startsWith('AIza')) {
          return sendResponse({ success: false, error: 'Key không hợp lệ' });
        }

        // ✅ Chỉ dùng endpoint của Cloudflare Worker
        const proxyUrl = 'https://my-gemini-proxy.ducdoan04-work.workers.dev/gemini';
        const PROXY_TOKEN = 'my-secret-token';

        // ✅ Gửi body chuẩn tới proxy
        const res = await fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Proxy-Token': PROXY_TOKEN
          },
          body: JSON.stringify({
            apiKey: API_KEY,
            model: 'gemini-2.5-flash',
            contents: [
              { parts: [{ text: request.prompt }] }
            ],
            generationConfig: { temperature: 0.3, maxOutputTokens: 50 }
          })
        });

        console.log('Gemini status:', res.status);

        if (!res.ok) {
          const err = await res.text();
          console.error('Gemini lỗi:', res.status, err);
          return sendResponse({ success: false, error: `HTTP ${res.status}` });
        }

        const json = await res.json();
        console.log('Gemini response:', json);

const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase();
console.log("Gemini trả về:", text);

if (!text) {
  console.warn('Gemini trả rỗng → dùng đáp án 1');
  return sendResponse({ success: true, answer: 1 });
}

// Bắt chữ cái A/B/C/D
const matchLetter = text.match(/\b([A-D])\b/);
if (matchLetter) {
  const mapping = { A: 1, B: 2, C: 3, D: 4 };
  console.log("Gemini chọn:", matchLetter[1]);
  return sendResponse({ success: true, answer: mapping[matchLetter[1]] });
}

// Bắt số 1-4
const matchNum = text.match(/\b([1-4])\b/);
if (matchNum) {
  return sendResponse({ success: true, answer: parseInt(matchNum[1]) });
}

// Không hiểu → fallback
console.warn("Không nhận dạng được đáp án, fallback = 1");
return sendResponse({ success: true, answer: 1 });



      } catch (err) {
        console.error('Lỗi hệ thống:', err);
        sendResponse({ success: false, error: 'Lỗi mạng' });
      }
    })();
    return true;
  }
});
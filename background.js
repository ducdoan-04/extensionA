// background.js
let cache = new Map();

async function callGemini(prompt) {
  if (cache.has(prompt)) return cache.get(prompt);

  try {
    const { geminiKey } = await chrome.storage.sync.get('geminiKey');
    if (!geminiKey?.startsWith('AIza')) return { success: false };

    const res = await fetch('https://my-gemini-proxy.ducdoan04-work.workers.dev/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Proxy-Token': 'my-secret-token'
      },
      body: JSON.stringify({
        apiKey: geminiKey,
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 3 }
      })
    });

    if (!res.ok) return { success: false };

    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase();

    const match = text.match(/^[A-D]$/);
    const answer = match ? match[0] : 'A';

    const result = { success: true, answer };
    cache.set(prompt, result);
    return result;
  } catch {
    return { success: false };
  }
}

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === 'callGemini') {
    callGemini(req.prompt).then(sendResponse);
    return true;
  }
});
// === EXTRACT QUESTIONS ===
function extractQuestions() {
  const questions = [];
  document.querySelectorAll('.azt-question').forEach((block, index) => {
    const qText = block.querySelector('.question-standalone-content-box span')?.innerText?.trim();
    if (!qText) return;

    const options = [];
    block.querySelectorAll('.item-answer').forEach(item => {
      const text = item.querySelector('.answer-content span')?.innerText?.trim();
      if (text) options.push(text);
    });

    if (options.length >= 2) {
      questions.push({ id: index, text: qText, options, element: block });
    }
  });
  return questions;
}

// === GỌI GEMINI ===
async function getCorrectAnswer(qText, options) {
  // ✅ Dùng đúng biến đầu vào, không dùng questionData
  const prompt = `
Câu hỏi: ${questionText}
Các lựa chọn:
A. ${options[0] || ""}
B. ${options[1] || ""}
C. ${options[2] || ""}
D. ${options[3] || ""}

Chỉ trả lời đúng **một chữ cái A, B, C hoặc D**. Không giải thích.
`;
return new Promise((resolve) => {
    const id = Date.now() + Math.random();
    const listener = (e) => {
      if (e.data.id === id) {
        window.removeEventListener('message', listener);
        resolve(e.data.answer);
      }
    };
    window.addEventListener('message', listener);

    // Gửi prompt lên background qua postMessage
    window.postMessage({ type: 'CALL_GEMINI', prompt, id }, '*');
  });
}


// === HIGHLIGHT ===
function highlightAnswer(questionObj, correctIndex) {
  const items = questionObj.element.querySelectorAll('.item-answer');
  const target = items[correctIndex - 1];
  if (!target) return;

  const box = target.querySelector('.answer-content');
  if (!box) return;

  const originalText = box.innerText.trim();
  box.innerHTML = `<span style="
    background:#d4edda; border:2px solid #28a745; border-radius:8px;
    padding:8px 12px; display:inline-block; font-weight:600; color:#155724;
    box-shadow:0 2px 5px rgba(0,0,0,0.1); font-size:inherit; line-height:inherit;
  ">${originalText}</span>`;

  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// === INJECT BUTTON + AUTO SOLVE ===
function injectButton() {
  const oldBtn = document.getElementById('gemini-auto-solve-btn');
  if (oldBtn) oldBtn.remove();

  const btn = document.createElement('button');
  btn.id = 'gemini-auto-solve-btn';
  btn.innerText = 'Auto-Solve Gemini';
  btn.style.cssText = `position:fixed;top:20px;right:20px;z-index:2147483647;padding:14px 28px;background:linear-gradient(135deg,#007bff,#0056b3);color:white;border:none;border-radius:50px;font-weight:bold;font-size:16px;box-shadow:0 4px 15px rgba(0,123,255,0.5);cursor:pointer;transition:all 0.3s;font-family:system-ui,sans-serif;`;
  btn.onmouseover = () => btn.style.transform = 'scale(1.05)';
  btn.onmouseout = () => btn.style.transform = 'scale(1)';
  
  btn.onclick = async () => {
    if (btn.disabled) return;
    btn.disabled = true;
    btn.innerText = 'Đang xử lý...';
    await autoSolve();
    btn.disabled = false;
    btn.innerText = 'Auto-Solve Gemini';
  };

  document.body.appendChild(btn);
}

async function autoSolve() {
  for (let i = 0; i < 10; i++) {
    if (document.querySelectorAll('.azt-question').length > 0) break;
    await new Promise(r => setTimeout(r, 1000));
  }

  const questions = extractQuestions();
  if (questions.length === 0) return alert('Không tìm thấy câu hỏi!');

  let count = 0;
  for (const q of questions) {
    const idx = await getCorrectAnswer(q.text, q.options);
    if (idx) {
      highlightAnswer(q, idx);
      count++;
    }
    await new Promise(r => setTimeout(r, 3000));
  }
  alert(`HOÀN TẤT! Highlight ${count} câu.`);
}

// === CHẠY KHI TRANG LOAD ===
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectButton);
} else {
  injectButton();
}

const observer = new MutationObserver(() => {
  if (document.querySelector('.azt-question') && !document.getElementById('gemini-auto-solve-btn')) {
    injectButton();
  }
});
observer.observe(document.body, { childList: true, subtree: true });


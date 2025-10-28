// content.js - CẬP NHẬT CHO AZOTA MỚI
function extractQuestions() {
  const questions = [];
  const blocks = document.querySelectorAll('.question-item, .azt-question'); // hỗ trợ cả cũ + mới

  blocks.forEach((block, index) => {
    // Lấy nội dung câu hỏi
    const qSpan = block.querySelector('.question-content span, .question-standalone-content-box span');
    const qText = qSpan?.innerText?.trim();
    if (!qText) return;

    // Lấy các đáp án
    const options = [];
    const labels = block.querySelectorAll('.answer-item, .item-answer');
    
    labels.forEach(label => {
      const input = label.querySelector('input[type="radio"]');
      const textSpan = label.querySelector('.answer-text span, .answer-content span');
      const text = textSpan?.innerText?.trim();
      if (input && text) {
        options.push({ input, text });
      }
    });

    if (options.length >= 2) {
      questions.push({ id: index, text: qText, options, element: block });
    }
  });

  return questions;
}

// Gọi Gemini
async function getCorrectAnswer(qText, options) {
  const prompt = `
Câu hỏi: ${qText}
A. ${options[0]?.text || ""}
B. ${options[1]?.text || ""}
C. ${options[2]?.text || ""}
D. ${options[3]?.text || ""}

Trả lời đúng 1 chữ cái: A, B, C hoặc D.
`.trim();

  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'callGemini', prompt }, (res) => {
      const map = { A: 0, B: 1, C: 2, D: 3 };
      const idx = res?.success ? (map[res.answer] ?? 0) : 0;
      resolve(idx);
    });
  });
}

// TỰ ĐỘNG CHỌN (click)
async function selectAnswer(questionObj, correctIndex) {
  const option = questionObj.options[correctIndex];
  if (!option?.input) return false;

  option.input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
  option.input.click();
  return true;
}

// NÚT AUTO
function injectButton() {
  const old = document.getElementById('azota-auto-btn');
  if (old) old.remove();

  const btn = document.createElement('button');
  btn.id = 'azota-auto-btn';
  btn.innerText = 'Auto Azota';
  btn.style.cssText = `
    position:fixed; bottom:20px; right:20px; z-index:999999;
    padding:12px 24px; background:#28a745; color:white; border:none;
    border-radius:50px; font-weight:bold; font-size:15px; cursor:pointer;
    box-shadow:0 4px 12px rgba(0,0,0,0.3); transition:0.3s;
  `;
  btn.onclick = async () => {
    if (btn.disabled) return;
    btn.disabled = true;
    btn.innerText = 'Đang làm...';
    await autoSolve();
    btn.disabled = false;
    btn.innerText = 'Auto Azota';
  };
  document.body.appendChild(btn);
}

async function autoSolve() {
  // Đợi câu hỏi load hoàn toàn
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1000));
    if (extractQuestions().length > 0) break;
  }

  const questions = extractQuestions();
  if (questions.length === 0) {
    return alert('Không tìm thấy câu hỏi! Có thể Azota đã cập nhật giao diện.');
  }

  let count = 0;
  for (const q of questions) {
    const idx = await getCorrectAnswer(q.text, q.options);
    if (await selectAnswer(q, idx)) count++;
    await new Promise(r => setTimeout(r, 3000 + Math.random() * 4000));
  }

  alert(`HOÀN TẤT! Đã chọn ${count}/${questions.length} câu.`);
}

// CHẠY
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectButton);
} else {
  injectButton();
}
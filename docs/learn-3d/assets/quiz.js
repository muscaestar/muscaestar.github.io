/* 测验组件 — 点击选项即时反馈 + 选项随机排序 */
function initQuizzes() {
  document.querySelectorAll('.quiz').forEach(quiz => {
    const optionsContainer = quiz.querySelector('.options');
    const opts = Array.from(quiz.querySelectorAll('.opt'));
    const feedback = quiz.querySelector('.feedback');

    // Fisher-Yates 洗牌，随机打乱选项顺序
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    // 重新插入 DOM
    opts.forEach(opt => optionsContainer.appendChild(opt));

    let answered = false;
    opts.forEach(opt => {
      opt.addEventListener('click', () => {
        if (answered) return;
        answered = true;

        const isCorrect = opt.dataset.correct === 'true';
        opt.classList.add(isCorrect ? 'correct' : 'wrong');

        // 标记正确答案
        opts.forEach(o => {
          if (o.dataset.correct === 'true') o.classList.add('correct');
          o.style.cursor = 'default';
        });

        if (feedback) {
          feedback.classList.add('show');
          feedback.innerHTML = isCorrect
            ? '✅ ' + feedback.dataset.correct
            : '❌ ' + feedback.dataset.wrong;
        }
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', initQuizzes);

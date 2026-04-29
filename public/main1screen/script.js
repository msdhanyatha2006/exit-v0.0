/**
 * EXIT-VO.O — main1screen/script.js
 * Matrix rain background animation ONLY.
 * Navigation is handled entirely by index.html inline gsSubmit().
 * DO NOT add startBtn.onclick here — it overrides the modal flow.
 */
const canvas = document.getElementById('matrixCanvas');
const ctx    = canvas.getContext('2d');

canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;

const chars   = '01';
const fontSize = 20;
let columns   = Math.floor(canvas.width / fontSize);
const drops   = Array.from({ length: columns }, () => Math.random() * -100);

function drawMatrix() {
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ff4500';
  ctx.font      = fontSize + 'px monospace';

  for (let i = 0; i < drops.length; i++) {
    const text = chars.charAt(Math.floor(Math.random() * chars.length));
    ctx.fillText(text, i * fontSize, drops[i] * fontSize);
    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
    drops[i]++;
  }
}

setInterval(drawMatrix, 80);

window.addEventListener('resize', () => {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  columns       = Math.floor(canvas.width / fontSize);
});
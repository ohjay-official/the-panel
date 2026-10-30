// Full-screen scenes drawn on canvas. The portal window shows the next scene screen-locked,
// so each composition is built around the centre of the viewport, where the window opens.
// Everything here is real content from the hackathon page or illustration without numbers.

const INK = '#0d0c0b';
const PAPER = '#f2f0ec';
const DIM = 'rgba(242,240,236,0.5)';
const FAINT = 'rgba(242,240,236,0.16)';
const GREEN = '#76b900';
const RED = '#e0483b';
const BLUE = '#8fa0ff';
const SANS = "'Inter Tight Variable', 'Inter Tight', 'Helvetica Neue', Arial, sans-serif";
const MONO = "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace";
const DISPLAY = "'Bebas Neue', 'Arial Narrow', sans-serif";

const CRITERIA = ['Technological Implementation', 'Design', 'Potential Impact', 'Quality of the Idea'];
const JUDGES = [
  ['Nancy Agarwal', 'NVIDIA'], ['Abhinav Balasubramanian', 'NVIDIA'], ['Dylan Bristot', 'Nebius'], ['AbdulMajed Raja', 'Nebius'],
  ['Rob Spectre', 'Nebius'], ['Evan Rimer', 'Tavily'], ['Lakshmi Rameish', 'NVIDIA'], ['Surbhi Jha', 'NVIDIA'],
  ['Joe Sarabia', 'Nebius'], ['Marouane Khoukh', 'Nebius'], ['Ricky Johnson', 'Tavily'], ['Selena Williams', 'NVIDIA'],
  ['Aleksandr Patrushev', 'Nebius'], ['Unmesh Kurup', 'Nebius'], ['Daniel Myers', 'Nebius'], ['Jacquie Capur', 'Nebius'],
  ['Lakshya Prakash Agarwal', 'Tavily'], ['Johnny Nunez', 'NVIDIA'], ['Evan Helda', 'Nebius'], ['Mikhail Rozhkov', 'Nebius'],
  ['Dhruv Diddi', 'Nebius'], ['Aditya Sahu', 'NVIDIA'], ['Sayali Kandarkar', 'NVIDIA'],
];
const CO = { NVIDIA: GREEN, Nebius: PAPER, Tavily: BLUE };

function base(ctx, W, H) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(242,240,236,0.045)';
  ctx.lineWidth = 1;
  const step = 56;
  ctx.beginPath();
  for (let x = (W / 2) % step; x < W; x += step) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
  for (let y = (H / 2) % step; y < H; y += step) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
  ctx.stroke();
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function label(ctx, text, x, y, align = 'center') {
  ctx.font = `500 12px ${MONO}`;
  ctx.fillStyle = DIM;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function hatch(ctx, x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = 'rgba(242,240,236,0.08)';
  ctx.beginPath();
  for (let i = -h; i < w; i += 7) { ctx.moveTo(x + i, y + h); ctx.lineTo(x + i + h, y); }
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = FAINT;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function yours(ctx, W, H) {
  const cols = 5, rows = 5;
  const cw = Math.min(150, W * 0.13), ch = Math.min(70, H * 0.08), gap = 8;
  const gw = cols * cw + (cols - 1) * gap, gh = rows * ch + (rows - 1) * gap;
  const x0 = W / 2 - gw / 2, y0 = H / 2 - gh / 2;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) hatch(ctx, x0 + c * (cw + gap), y0 + r * (ch + gap), cw, ch);
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = 2;
  for (let r = 0; r < rows; r++) ctx.strokeRect(x0 + 4 * (cw + gap) + 1, y0 + r * (ch + gap) + 1, cw - 2, ch - 2);
  ctx.lineWidth = 1;
  ctx.font = `400 ${Math.max(72, Math.min(W * 0.11, 170))}px ${DISPLAY}`;
  ctx.fillStyle = PAPER;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('YOUR PROJECT', W / 2, H / 2 + 6);
  label(ctx, 'An empty rubric, waiting for a run', W / 2, y0 + gh + 34);
}

function event(ctx, W, H) {
  const big = Math.max(26, Math.min(W * 0.05, 72));
  const gap = big * 1.32;
  const top = H / 2 - (gap * (CRITERIA.length - 1)) / 2;
  label(ctx, 'nebiusglobalaihackathon.devpost.com', W / 2, top - gap * 0.95);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  CRITERIA.forEach((c, i) => {
    const y = top + i * gap;
    ctx.strokeStyle = FAINT;
    ctx.beginPath();
    ctx.moveTo(W * 0.12, y + gap / 2 + 0.5);
    ctx.lineTo(W * 0.88, y + gap / 2 + 0.5);
    ctx.stroke();
    ctx.font = `500 ${big}px ${SANS}`;
    ctx.fillStyle = i === 1 ? PAPER : 'rgba(242,240,236,0.86)';
    ctx.fillText(c, W / 2, y);
    ctx.font = `500 13px ${MONO}`;
    ctx.fillStyle = GREEN;
    ctx.textAlign = 'left';
    ctx.fillText(`0${i + 1}`, W * 0.12, y);
    ctx.textAlign = 'center';
  });
  label(ctx, 'The official judging criteria', W / 2, top + gap * (CRITERIA.length - 0.2));
}

function winners(ctx, W, H) {
  const cols = [
    { x: W / 2 - Math.min(W * 0.3, 430), big: '5/5', a: 'Injester', b: 'Nebius.Build SF, 1st', c: 'Accuracy up from 2 of 5', col: PAPER },
    { x: W / 2, big: '$320', a: 'MediSimplifier', b: 'Serverless AI Builders Challenge, 1st', c: 'Published its full bill', col: GREEN },
    { x: W / 2 + Math.min(W * 0.3, 430), big: '$3.64', a: 'Balagan', b: 'Serverless AI Builders Challenge, 3rd', c: '225 trials in 63 seconds', col: PAPER },
  ];
  const size = Math.max(84, Math.min(W * 0.15, 230));
  label(ctx, 'Past winners at Nebius events', W / 2, H / 2 - size * 0.85);
  cols.forEach((k) => {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `400 ${k.x === W / 2 ? size : size * 0.62}px ${DISPLAY}`;
    ctx.fillStyle = k.col;
    ctx.fillText(k.big, k.x, H / 2 + size * 0.28);
    ctx.font = `600 17px ${SANS}`;
    ctx.fillStyle = PAPER;
    ctx.fillText(k.a, k.x, H / 2 + size * 0.28 + 38);
    ctx.font = `400 13px ${SANS}`;
    ctx.fillStyle = DIM;
    ctx.fillText(k.b, k.x, H / 2 + size * 0.28 + 60);
    ctx.fillText(k.c, k.x, H / 2 + size * 0.28 + 79);
  });
}

function judges(ctx, W, H) {
  const cols = W > 1100 ? 6 : W > 700 ? 5 : 4;
  const tw = Math.min(176, (W * 0.9 - (cols - 1) * 10) / cols), th = 66, gap = 10;
  const rows = Math.ceil(JUDGES.length / cols);
  const gw = cols * tw + (cols - 1) * gap, gh = rows * th + (rows - 1) * gap;
  const x0 = W / 2 - gw / 2, y0 = H / 2 - gh / 2;
  label(ctx, '23 judges from the Devpost page', W / 2, y0 - 26);
  JUDGES.forEach(([name, co], i) => {
    const x = x0 + (i % cols) * (tw + gap), y = y0 + Math.floor(i / cols) * (th + gap);
    ctx.fillStyle = 'rgba(242,240,236,0.03)';
    ctx.fillRect(x, y, tw, th);
    ctx.strokeStyle = FAINT;
    ctx.strokeRect(x + 0.5, y + 0.5, tw - 1, th - 1);
    ctx.fillStyle = CO[co];
    ctx.fillRect(x + 10, y + 11, 18, 3);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `600 ${tw < 140 ? 11.5 : 13}px ${SANS}`;
    ctx.fillStyle = PAPER;
    let n = name;
    while (ctx.measureText(n).width > tw - 20 && n.length > 4) n = n.slice(0, -2);
    ctx.fillText(n === name ? n : n + '.', x + 10, y + 36);
    ctx.font = `400 11.5px ${SANS}`;
    ctx.fillStyle = DIM;
    ctx.fillText(co, x + 10, y + 54);
  });
}

function score(ctx, W, H) {
  const names = ['Abhinav Balasubramanian', 'Dylan Bristot', 'Lakshya Prakash Agarwal', 'AbdulMajed Raja', 'Sayali Kandarkar', 'Jacquie Capur'];
  const heads = ['Tech', 'Design', 'Impact', 'Idea', 'Overall'];
  // Illustrative heat only. No numbers are shown, because only a real run produces scores.
  const heat = [
    [0.7, 0.5, 0.8, 0.6, 0.7], [0.4, 0.6, 0.5, 0.7, 0.55], [0.85, 0.3, 0.6, 0.75, 0.65],
    [0.5, 0.7, 0.45, 0.6, 0.55], [0.9, 0.55, 0.7, 0.8, 0.8], [0.35, 0.65, 0.6, 0.5, 0.5],
  ];
  const cw = Math.min(124, W * 0.105), ch = Math.min(58, H * 0.065), gap = 6, nameW = Math.min(230, W * 0.2);
  const gw = nameW + 5 * cw + 4 * gap, gh = names.length * ch + (names.length - 1) * gap;
  const x0 = W / 2 - gw / 2 + nameW, y0 = H / 2 - gh / 2 + 14;
  ctx.textBaseline = 'middle';
  heads.forEach((h, c) => {
    ctx.font = `500 12px ${SANS}`;
    ctx.fillStyle = DIM;
    ctx.textAlign = 'center';
    ctx.fillText(h, x0 + c * (cw + gap) + cw / 2, y0 - 22);
  });
  names.forEach((n, r) => {
    const y = y0 + r * (ch + gap);
    ctx.textAlign = 'right';
    ctx.font = `600 13px ${SANS}`;
    ctx.fillStyle = PAPER;
    ctx.fillText(n, x0 - 16, y + ch / 2);
    heat[r].forEach((t, c) => {
      const x = x0 + c * (cw + gap);
      ctx.fillStyle = `rgba(118,185,0,${0.12 + t * 0.78})`;
      ctx.fillRect(x, y, cw, ch);
      if (c === 4) {
        ctx.strokeStyle = PAPER;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, cw - 2, ch - 2);
        ctx.lineWidth = 1;
      }
    });
  });
  ctx.strokeStyle = GREEN;
  ctx.shadowColor = 'rgba(118,185,0,0.8)';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.moveTo(x0 - nameW, y0 + gh * 0.62);
  ctx.lineTo(x0 + 5 * cw + 4 * gap, y0 + gh * 0.62);
  ctx.stroke();
  ctx.shadowBlur = 0;
  label(ctx, 'Each judge scores every criterion from 1 to 10', W / 2, y0 + gh + 34);
}

function fixes(ctx, W, H) {
  const items = [
    ['Put the measured cost per run in your README', 'Low effort, high impact'],
    ['Show a live run in the first 20 seconds of the video', 'Low effort, high impact'],
    ['Use Tavily extract on sources, not only search', 'Medium effort, medium impact'],
  ];
  const size = Math.max(20, Math.min(W * 0.03, 40));
  const rowH = size * 2.6;
  const blockW = Math.min(W * 0.84, 980);
  const x0 = W / 2 - blockW / 2, y0 = H / 2 - (rowH * items.length) / 2;
  label(ctx, 'A ranked fix list, as the moderator writes it', W / 2, y0 - 30);
  items.forEach(([t, m], i) => {
    const y = y0 + i * rowH;
    ctx.strokeStyle = FAINT;
    ctx.beginPath();
    ctx.moveTo(x0, y + 0.5);
    ctx.lineTo(x0 + blockW, y + 0.5);
    ctx.stroke();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = `400 ${size * 1.5}px ${DISPLAY}`;
    ctx.fillStyle = RED;
    ctx.fillText(String(i + 1), x0, y + rowH * 0.42);
    ctx.font = `500 ${size}px ${SANS}`;
    ctx.fillStyle = PAPER;
    ctx.fillText(t, x0 + size * 1.6, y + rowH * 0.38);
    ctx.font = `400 13px ${MONO}`;
    ctx.fillStyle = i < 2 ? GREEN : DIM;
    ctx.fillText(m, x0 + size * 1.6, y + rowH * 0.38 + size * 0.95);
  });
  const y = y0 + rowH * 0.38;
  ctx.strokeStyle = RED;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x0 + blockW * 0.62, y + size * 0.9);
  ctx.quadraticCurveTo(x0 + blockW * 0.78, y + size * 1.15, x0 + blockW * 0.96, y + size * 0.85);
  ctx.stroke();
  ctx.lineWidth = 1;
}

const DRAW = { yours, event, winners, judges, score, fixes };

export function renderScene(key, W, H, dpr) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(W * dpr));
  c.height = Math.max(1, Math.round(H * dpr));
  const ctx = c.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  base(ctx, W, H);
  (DRAW[key] || yours)(ctx, W, H);
  return c;
}

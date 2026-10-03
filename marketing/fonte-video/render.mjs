import { chromium } from "playwright";
import { mkdirSync } from "fs";
const FPS = 30;
mkdirSync("frames", { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto("file://" + process.cwd() + "/promo.html", { waitUntil: "networkidle" });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(500);
const only = process.argv[2]; // ex: "4,10,15" para gerar prévias
const times = only ? only.split(",").map(Number) : Array.from({ length: 30 * FPS }, (_, i) => i / FPS);
let i = 0;
for (const t of times) {
  await p.evaluate((t) => window.render(t), t);
  await p.screenshot({ path: only ? `preview_${t}.jpg` : `frames/f${String(i).padStart(4, "0")}.jpg`, type: "jpeg", quality: 92 });
  i++;
}
await b.close();
console.log("frames", i);

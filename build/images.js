// Converts client source photos (_source/) into web-ready WebP images in docs/img/.
// Usage: node build/images.js   (skips files that already exist; delete docs/img/p to rebuild)
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, '_source');
const OUT = path.join(ROOT, 'docs', 'img');
const projects = require('../data/projects.json');

const MAX_GALLERY = 16;
const SIZES = { lg: 1600, sm: 720 };

function listImages(folder) {
  return fs.readdirSync(path.join(SRC, folder))
    .filter(f => /\.(jpe?g|png)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, 'ru', { numeric: true }));
}

// Cover first, then an even sample of the rest, kept in source order
function pickGallery(files, cover) {
  const rest = files.filter((_, i) => i !== cover);
  const n = Math.min(MAX_GALLERY - 1, rest.length);
  const picked = [];
  for (let k = 0; k < n; k++) picked.push(rest[Math.floor(k * rest.length / n)]);
  return [files[cover], ...picked];
}

async function makeLogo() {
  const src = path.join(SRC, 'SmartSelect_20210618-002323_Canva..jpg');
  // Luminance becomes alpha: white strokes stay, black background disappears
  const { data, info } = await sharp(src).greyscale().raw().toBuffer({ resolveWithObject: true });
  const px = info.width * info.height;
  const white = Buffer.alloc(px * 4), black = Buffer.alloc(px * 4);
  for (let i = 0; i < px; i++) {
    const a = data[i] < 40 ? 0 : Math.min(255, Math.round((data[i] - 40) * 255 / 175));
    white[i * 4] = white[i * 4 + 1] = white[i * 4 + 2] = 255; white[i * 4 + 3] = a;
    black[i * 4] = black[i * 4 + 1] = black[i * 4 + 2] = 0; black[i * 4 + 3] = a;
  }
  const raw = { raw: { width: info.width, height: info.height, channels: 4 } };
  fs.mkdirSync(OUT, { recursive: true });
  // Full lockup (mark + wordmark), trimmed to content
  await sharp(white, raw).trim().png().toFile(path.join(OUT, 'logo-white.png'));
  await sharp(black, raw).trim().png().toFile(path.join(OUT, 'logo-black.png'));
  // Mark only (the framed K): the top part of the original, above the wordmark
  // (extract and trim in separate pipelines: sharp applies trim before extract)
  const mark = { left: 355, top: 258, width: 262, height: 278 };
  const crop = async buf => sharp(await sharp(buf, raw).extract(mark).png().toBuffer()).trim();
  await (await crop(white)).png().toFile(path.join(OUT, 'mark-white.png'));
  await (await crop(black)).png().toFile(path.join(OUT, 'mark-black.png'));
  // Apple touch icon: white mark on black
  const markBuf = await (await crop(white)).resize(120, 120, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  await sharp({ create: { width: 180, height: 180, channels: 4, background: '#0b0b0b' } })
    .composite([{ input: markBuf, top: 30, left: 30 }]).png().toFile(path.join(OUT, 'apple-touch-icon.png'));
}

async function main() {
  await makeLogo();
  const manifest = {};
  for (const p of projects) {
    const files = listImages(p.folder);
    const gallery = pickGallery(files, p.cover);
    const dir = path.join(OUT, 'p', p.slug);
    fs.mkdirSync(dir, { recursive: true });
    manifest[p.slug] = { total: files.length, images: [] };
    for (let i = 0; i < gallery.length; i++) {
      const src = path.join(SRC, p.folder, gallery[i]);
      const name = String(i + 1).padStart(2, '0');
      const meta = await sharp(src).metadata();
      // Many renders carry a stamp along the bottom edge ("Corona Renderer | Time | Passes",
      // "Design by Capsule_ …"). Its size and look vary, so every image loses the same thin
      // bottom strip: 34px at the 1600px output size (~2–3% of height, always floor).
      const stamp = Math.ceil(34 * meta.width / Math.min(meta.width, SIZES.lg));
      for (const [key, w] of Object.entries(SIZES)) {
        const dest = path.join(dir, `${name}-${key}.webp`);
        if (!fs.existsSync(dest)) {
          const input = await sharp(src).extract({ left: 0, top: 0, width: meta.width, height: meta.height - stamp }).toBuffer();
          await sharp(input).rotate().resize({ width: w, withoutEnlargement: true })
            .webp({ quality: key === 'lg' ? 72 : 66, effort: 5 }).toFile(dest);
        }
      }
      const lgMeta = await sharp(path.join(dir, `${name}-lg.webp`)).metadata();
      manifest[p.slug].images.push({ file: name, w: lgMeta.width, h: lgMeta.height, source: gallery[i], srcW: meta.width });
    }
    console.log(p.slug, gallery.length + '/' + files.length);
  }
  fs.writeFileSync(path.join(ROOT, 'data', 'images.json'), JSON.stringify(manifest, null, 1));
}

main().catch(e => { console.error(e); process.exit(1); });

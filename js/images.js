// Préparation des images ajoutées dans l'éditeur :
// redimensionnement, compression (WebP si possible) et nom unique basé sur le contenu.

export async function sha256Hex(buf) {
  const h = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function loadBitmap(file) {
  if (window.createImageBitmap) {
    try { return await createImageBitmap(file); } catch (e) { /* repli ci-dessous */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function toBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

const EXT = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };

export async function prepareImage(file, { maxSide = 2000, folder = 'pages', quality = 0.9 } = {}) {
  if (!file || !/^image\//.test(file.type)) throw new Error(`« ${file && file.name} » n’est pas une image.`);
  const bmp = await loadBitmap(file);
  const w0 = bmp.width;
  const h0 = bmp.height;
  const scale = Math.min(1, maxSide / Math.max(w0, h0));
  const w = Math.round(w0 * scale);
  const h = Math.round(h0 * scale);

  let blob;
  const keepOriginal = scale === 1 && (file.type === 'image/webp' || file.type === 'image/jpeg') && file.size < 1.6e6;
  if (keepOriginal) {
    blob = file;
  } else {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, 0, 0, w, h);
    blob = await toBlob(canvas, 'image/webp', quality);
    if (!blob || blob.type !== 'image/webp') {
      // Safari ne sait pas toujours encoder en WebP : on passe en JPEG.
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      blob = await toBlob(canvas, 'image/jpeg', 0.9);
    }
  }
  if (bmp.close) bmp.close();
  const type = blob.type || file.type;
  const ext = EXT[type] || 'img';
  const hash = (await sha256Hex(await blob.arrayBuffer())).slice(0, 16);
  return {
    blob: blob instanceof File ? new Blob([blob], { type }) : blob,
    path: `${folder}/${hash}.${ext}`,
    w,
    h,
  };
}

// Tri « naturel » : page2 avant page10.
export function naturalSort(files) {
  const coll = new Intl.Collator('fr', { numeric: true, sensitivity: 'base' });
  return [...files].sort((a, b) => coll.compare(a.name, b.name));
}

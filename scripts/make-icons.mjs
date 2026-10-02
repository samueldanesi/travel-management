// Genera le icone PNG della PWA senza dipendenze: sfondo teal, "C" bianca con un piccolo aereo di carta.
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td))
  return Buffer.concat([len, td, c])
}

function png(size, { maskable }) {
  const S = 3 // supersampling
  const bg = [14, 122, 134], bg2 = [10, 93, 103], fg = [255, 255, 255]
  const px = Buffer.alloc(size * (size * 4 + 1))
  const cx = size / 2, cy = size / 2
  const scale = maskable ? 0.62 : 0.78 // zona sicura più ampia per le maschere adattive
  const R = (size / 2) * scale, thick = R * 0.26
  const corner = maskable ? 0 : size * 0.22
  for (let y = 0; y < size; y++) {
    px[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      let a = 0, rr = 0, gg = 0, bb = 0
      for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
        const X = x + (sx + 0.5) / S, Y = y + (sy + 0.5) / S
        // angolo arrotondato dell'icona
        const dx = Math.max(corner - X, 0, X - (size - corner)), dy = Math.max(corner - Y, 0, Y - (size - corner))
        if (dx * dx + dy * dy > corner * corner) continue
        const t = (X + Y) / (2 * size)
        let col = bg.map((v, i) => v + (bg2[i] - v) * t)
        const d = Math.hypot(X - cx, Y - cy)
        const ang = Math.atan2(Y - cy, X - cx) // 0 = destra
        const inRing = d <= R && d >= R - thick
        const inGap = Math.abs(ang) < 0.62 // apertura della "C" a destra
        // aereo di carta (triangolo) dentro l'apertura
        const px0 = cx + R * 0.1, py0 = cy
        const tri = (() => {
          const p = [[px0 - R * 0.28, py0 + R * 0.2], [px0 + R * 0.5, py0 - R * 0.28], [px0 + R * 0.18, py0 + R * 0.34]]
          const s = (a1, b1, c1) => (a1[0] - c1[0]) * (b1[1] - c1[1]) - (b1[0] - c1[0]) * (a1[1] - c1[1])
          const q = [X, Y]
          const d1 = s(q, p[0], p[1]), d2 = s(q, p[1], p[2]), d3 = s(q, p[2], p[0])
          return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))
        })()
        if ((inRing && !inGap) || tri) col = fg
        a++; rr += col[0]; gg += col[1]; bb += col[2]
      }
      const o = y * (size * 4 + 1) + 1 + x * 4
      if (a) { px[o] = rr / a; px[o + 1] = gg / a; px[o + 2] = bb / a; px[o + 3] = (255 * a) / (S * S) }
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(px)), chunk('IEND', Buffer.alloc(0))])
}

const out = new URL('../public/icons/', import.meta.url).pathname
writeFileSync(out + 'icon-192.png', png(192, {}))
writeFileSync(out + 'icon-512.png', png(512, {}))
writeFileSync(out + 'icon-maskable-512.png', png(512, { maskable: true }))
writeFileSync(out + 'apple-touch-icon.png', png(180, { maskable: true }))
console.log('icone generate')

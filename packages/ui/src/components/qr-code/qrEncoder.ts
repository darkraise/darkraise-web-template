/**
 * Minimal QR Code encoder.
 *
 * Adapted in spirit from Project Nayuki's qrcodegen reference implementation
 * (MIT). Re-rolled by hand for the in-house template — covers Byte mode (any
 * UTF-8 string), error-correction levels L/M/Q/H, version auto-selection up
 * to v10 (capacity ~120 ASCII bytes at level M, more than enough for typical
 * URLs and short messages).
 *
 * The output is a 2D matrix of dark/light modules; the caller wraps it in
 * <svg>.
 */

export type QrEcc = "L" | "M" | "Q" | "H"

const ECC_FORMAT_BITS: Record<QrEcc, number> = {
  L: 0b01,
  M: 0b00,
  Q: 0b11,
  H: 0b10,
}

// Number of error correction codewords per block + error correction blocks per
// version & ecc level. Derived from ISO/IEC 18004 Table 9. Index = version - 1.
// [ecc_codewords_per_block, num_blocks_grp1, dataCw_grp1, num_blocks_grp2, dataCw_grp2]
const ECC_TABLE: Record<QrEcc, ReadonlyArray<readonly number[]>> = {
  L: [
    [7, 1, 19, 0, 0],
    [10, 1, 34, 0, 0],
    [15, 1, 55, 0, 0],
    [20, 1, 80, 0, 0],
    [26, 1, 108, 0, 0],
    [18, 2, 68, 0, 0],
    [20, 2, 78, 0, 0],
    [24, 2, 97, 0, 0],
    [30, 2, 116, 0, 0],
    [18, 2, 68, 2, 69],
  ],
  M: [
    [10, 1, 16, 0, 0],
    [16, 1, 28, 0, 0],
    [26, 1, 44, 0, 0],
    [18, 2, 32, 0, 0],
    [24, 2, 43, 0, 0],
    [16, 4, 27, 0, 0],
    [18, 4, 31, 0, 0],
    [22, 2, 38, 2, 39],
    [22, 3, 36, 2, 37],
    [26, 4, 43, 1, 44],
  ],
  Q: [
    [13, 1, 13, 0, 0],
    [22, 1, 22, 0, 0],
    [18, 2, 17, 0, 0],
    [26, 2, 24, 0, 0],
    [18, 2, 15, 2, 16],
    [24, 4, 19, 0, 0],
    [18, 2, 14, 4, 15],
    [22, 4, 18, 2, 19],
    [20, 4, 16, 4, 17],
    [24, 6, 19, 2, 20],
  ],
  H: [
    [17, 1, 9, 0, 0],
    [28, 1, 16, 0, 0],
    [22, 2, 13, 0, 0],
    [16, 4, 9, 0, 0],
    [22, 2, 11, 2, 12],
    [28, 4, 15, 0, 0],
    [26, 4, 13, 1, 14],
    [26, 4, 14, 2, 15],
    [24, 4, 12, 4, 13],
    [28, 6, 15, 2, 16],
  ],
}

function totalDataCodewordsForVersion(version: number, ecc: QrEcc): number {
  const row = ECC_TABLE[ecc][version - 1]
  if (!row) throw new Error(`Unsupported QR version ${version}`)
  const blocks1 = row[1] ?? 0
  const data1 = row[2] ?? 0
  const blocks2 = row[3] ?? 0
  const data2 = row[4] ?? 0
  return blocks1 * data1 + blocks2 * data2
}

function getCharacterCountBitsForVersion(version: number): number {
  // Byte mode count length:
  // versions 1-9 = 8 bits, 10-26 = 16, 27-40 = 16
  return version <= 9 ? 8 : 16
}

function utf8Bytes(input: string): Uint8Array {
  return new TextEncoder().encode(input)
}

function chooseVersion(byteLen: number, ecc: QrEcc): number {
  for (let v = 1; v <= 10; v++) {
    const lenBits = getCharacterCountBitsForVersion(v)
    const dataBits = byteLen * 8 + 4 + lenBits
    const dataCodewords = totalDataCodewordsForVersion(v, ecc)
    if (dataBits <= dataCodewords * 8) return v
  }
  throw new Error(
    `QR data too large (${byteLen} bytes) for in-house encoder (max v10).`,
  )
}

interface BitBuffer {
  bits: number[]
  push(value: number, length: number): void
  bytes(): Uint8Array
}

function makeBitBuffer(): BitBuffer {
  const bits: number[] = []
  return {
    bits,
    push(value: number, length: number) {
      for (let i = length - 1; i >= 0; i--) {
        bits.push((value >>> i) & 1)
      }
    },
    bytes() {
      const bytes = new Uint8Array(Math.ceil(bits.length / 8))
      for (let i = 0; i < bits.length; i++) {
        bytes[i >>> 3] =
          (bytes[i >>> 3] ?? 0) | ((bits[i] ?? 0) << (7 - (i & 7)))
      }
      return bytes
    },
  }
}

// GF(256) arithmetic for Reed-Solomon.
const GF_EXP = new Uint8Array(512)
const GF_LOG = new Uint8Array(256)
;(function initGf() {
  let x = 1
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x
    GF_LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255] ?? 0
})()

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  return GF_EXP[((GF_LOG[a] ?? 0) + (GF_LOG[b] ?? 0)) % 255] ?? 0
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1])
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1)
    for (let j = 0; j < poly.length; j++) {
      next[j] = (next[j] ?? 0) ^ gfMul(poly[j] ?? 0, 1)
      next[j + 1] = (next[j + 1] ?? 0) ^ gfMul(poly[j] ?? 0, GF_EXP[i] ?? 0)
    }
    poly = next
  }
  return poly
}

function rsRemainder(data: Uint8Array, degree: number): Uint8Array {
  const generator = rsGeneratorPoly(degree)
  const remainder = new Uint8Array(degree)
  for (let i = 0; i < data.length; i++) {
    const factor = (data[i] ?? 0) ^ (remainder[0] ?? 0)
    remainder.copyWithin(0, 1)
    remainder[remainder.length - 1] = 0
    for (let j = 0; j < degree; j++) {
      remainder[j] = (remainder[j] ?? 0) ^ gfMul(generator[j + 1] ?? 0, factor)
    }
  }
  return remainder
}

function buildSegment(
  bytes: Uint8Array,
  version: number,
  ecc: QrEcc,
): Uint8Array {
  const totalDataCodewords = totalDataCodewordsForVersion(version, ecc)
  const totalDataBits = totalDataCodewords * 8
  const buffer = makeBitBuffer()

  // Mode: byte = 0100
  buffer.push(0b0100, 4)
  buffer.push(bytes.length, getCharacterCountBitsForVersion(version))
  for (const b of bytes) buffer.push(b, 8)

  // terminator
  const remaining = totalDataBits - buffer.bits.length
  buffer.push(0, Math.min(4, remaining))

  // pad to byte boundary
  while (buffer.bits.length % 8 !== 0) buffer.bits.push(0)

  const data = buffer.bytes()
  // pad bytes alternating 0xEC, 0x11 until totalDataCodewords reached
  const padded = new Uint8Array(totalDataCodewords)
  padded.set(data)
  for (let i = data.length; i < totalDataCodewords; i++) {
    padded[i] = (i - data.length) % 2 === 0 ? 0xec : 0x11
  }
  return padded
}

function interleaveBlocks(
  data: Uint8Array,
  version: number,
  ecc: QrEcc,
): Uint8Array {
  const row = ECC_TABLE[ecc][version - 1]
  if (!row) throw new Error(`Unsupported QR version ${version}`)
  const eccCount = row[0] ?? 0
  const blocks: { data: Uint8Array; ecc: Uint8Array }[] = []
  let pos = 0
  for (let i = 0; i < (row[1] ?? 0); i++) {
    const blockData = data.slice(pos, pos + (row[2] ?? 0))
    pos += row[2] ?? 0
    blocks.push({ data: blockData, ecc: rsRemainder(blockData, eccCount) })
  }
  for (let i = 0; i < (row[3] ?? 0); i++) {
    const blockData = data.slice(pos, pos + (row[4] ?? 0))
    pos += row[4] ?? 0
    blocks.push({ data: blockData, ecc: rsRemainder(blockData, eccCount) })
  }
  // interleave data
  const maxData = Math.max(...blocks.map((b) => b.data.length))
  const out: number[] = []
  for (let i = 0; i < maxData; i++) {
    for (const b of blocks) {
      if (i < b.data.length) out.push(b.data[i] ?? 0)
    }
  }
  for (let i = 0; i < eccCount; i++) {
    for (const b of blocks) out.push(b.ecc[i] ?? 0)
  }
  return new Uint8Array(out)
}

interface MatrixState {
  size: number
  modules: Uint8Array // bit per cell, row-major
  reserved: Uint8Array
}

function makeMatrix(version: number): MatrixState {
  const size = 17 + version * 4
  return {
    size,
    modules: new Uint8Array(size * size),
    reserved: new Uint8Array(size * size),
  }
}

function setModule(
  state: MatrixState,
  x: number,
  y: number,
  on: boolean,
): void {
  state.modules[y * state.size + x] = on ? 1 : 0
}

function getModule(state: MatrixState, x: number, y: number): number {
  return state.modules[y * state.size + x] ?? 0
}

function reserveModule(state: MatrixState, x: number, y: number): void {
  state.reserved[y * state.size + x] = 1
}

function isReserved(state: MatrixState, x: number, y: number): boolean {
  return (state.reserved[y * state.size + x] ?? 0) === 1
}

function placeFinder(state: MatrixState, x: number, y: number): void {
  for (let dy = -1; dy <= 7; dy++) {
    for (let dx = -1; dx <= 7; dx++) {
      const xx = x + dx
      const yy = y + dy
      if (xx < 0 || yy < 0 || xx >= state.size || yy >= state.size) continue
      const inFinder =
        (dx >= 0 && dx <= 6 && (dy === 0 || dy === 6)) ||
        (dy >= 0 && dy <= 6 && (dx === 0 || dx === 6)) ||
        (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4)
      setModule(state, xx, yy, inFinder)
      reserveModule(state, xx, yy)
    }
  }
}

function placeAlignmentPattern(state: MatrixState, x: number, y: number): void {
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const r = Math.max(Math.abs(dx), Math.abs(dy))
      setModule(state, x + dx, y + dy, r === 0 || r === 2)
      reserveModule(state, x + dx, y + dy)
    }
  }
}

const ALIGNMENT_POSITIONS: Record<number, number[]> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
}

function placeAlignment(state: MatrixState, version: number): void {
  const positions = ALIGNMENT_POSITIONS[version] ?? []
  for (const x of positions) {
    for (const y of positions) {
      // skip if overlapping finder
      if (
        (x === 6 && y === 6) ||
        (x === 6 && y === state.size - 7) ||
        (x === state.size - 7 && y === 6)
      ) {
        continue
      }
      placeAlignmentPattern(state, x, y)
    }
  }
}

function placeTimingPatterns(state: MatrixState): void {
  for (let i = 8; i < state.size - 8; i++) {
    setModule(state, 6, i, i % 2 === 0)
    reserveModule(state, 6, i)
    setModule(state, i, 6, i % 2 === 0)
    reserveModule(state, i, 6)
  }
}

function placeFormatBits(state: MatrixState, ecc: QrEcc, mask: number): void {
  // 5-bit data: 2-bit ecc level + 3-bit mask
  const data = (ECC_FORMAT_BITS[ecc] << 3) | mask
  // 10-bit BCH (15,5) error correction. Generator: 0b10100110111
  let bch = data << 10
  for (let i = 14; i >= 10; i--) {
    if (((bch >> i) & 1) !== 0) bch ^= 0b10100110111 << (i - 10)
  }
  const formatBits =
    (((data << 10) | bch) ^ 0b101010000010010) & 0b111111111111111

  for (let i = 0; i < 6; i++) {
    setModule(state, 8, i, ((formatBits >> i) & 1) === 1)
    reserveModule(state, 8, i)
  }
  setModule(state, 8, 7, ((formatBits >> 6) & 1) === 1)
  reserveModule(state, 8, 7)
  setModule(state, 8, 8, ((formatBits >> 7) & 1) === 1)
  reserveModule(state, 8, 8)
  setModule(state, 7, 8, ((formatBits >> 8) & 1) === 1)
  reserveModule(state, 7, 8)
  for (let i = 9; i < 15; i++) {
    setModule(state, 14 - i, 8, ((formatBits >> i) & 1) === 1)
    reserveModule(state, 14 - i, 8)
  }

  for (let i = 0; i < 8; i++) {
    setModule(state, state.size - 1 - i, 8, ((formatBits >> i) & 1) === 1)
    reserveModule(state, state.size - 1 - i, 8)
  }
  for (let i = 8; i < 15; i++) {
    setModule(state, 8, state.size - 15 + i, ((formatBits >> i) & 1) === 1)
    reserveModule(state, 8, state.size - 15 + i)
  }
  // dark module
  setModule(state, 8, state.size - 8, true)
  reserveModule(state, 8, state.size - 8)
}

function placeData(state: MatrixState, data: Uint8Array): void {
  let bitIdx = 0
  for (let right = state.size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let v = 0; v < state.size; v++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j
        const upward = ((right + 1) & 2) === 0
        const y = upward ? state.size - 1 - v : v
        if (isReserved(state, x, y)) continue
        const totalBits = data.length * 8
        let bit = 0
        if (bitIdx < totalBits) {
          const byte = data[bitIdx >>> 3] ?? 0
          bit = (byte >> (7 - (bitIdx & 7))) & 1
          bitIdx += 1
        }
        setModule(state, x, y, bit === 1)
      }
    }
  }
}

function maskFn(mask: number, x: number, y: number): boolean {
  switch (mask) {
    case 0:
      return (x + y) % 2 === 0
    case 1:
      return y % 2 === 0
    case 2:
      return x % 3 === 0
    case 3:
      return (x + y) % 3 === 0
    case 4:
      return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0
    case 5:
      return ((x * y) % 2) + ((x * y) % 3) === 0
    case 6:
      return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0
    case 7:
      return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0
    default:
      return false
  }
}

function applyMask(state: MatrixState, mask: number): void {
  for (let y = 0; y < state.size; y++) {
    for (let x = 0; x < state.size; x++) {
      if (isReserved(state, x, y)) continue
      if (maskFn(mask, x, y)) {
        const idx = y * state.size + x
        state.modules[idx] = (state.modules[idx] ?? 0) ^ 1
      }
    }
  }
}

function penaltyScore(state: MatrixState): number {
  let score = 0
  // Rule 1: 5+ same color in a row
  for (let y = 0; y < state.size; y++) {
    let runColor = -1
    let runLen = 0
    for (let x = 0; x < state.size; x++) {
      const c = getModule(state, x, y)
      if (c === runColor) {
        runLen += 1
        if (runLen === 5) score += 3
        else if (runLen > 5) score += 1
      } else {
        runColor = c
        runLen = 1
      }
    }
  }
  for (let x = 0; x < state.size; x++) {
    let runColor = -1
    let runLen = 0
    for (let y = 0; y < state.size; y++) {
      const c = getModule(state, x, y)
      if (c === runColor) {
        runLen += 1
        if (runLen === 5) score += 3
        else if (runLen > 5) score += 1
      } else {
        runColor = c
        runLen = 1
      }
    }
  }
  // Rule 2: 2x2 same color
  for (let y = 0; y < state.size - 1; y++) {
    for (let x = 0; x < state.size - 1; x++) {
      const c = getModule(state, x, y)
      if (
        c === getModule(state, x + 1, y) &&
        c === getModule(state, x, y + 1) &&
        c === getModule(state, x + 1, y + 1)
      ) {
        score += 3
      }
    }
  }
  // Rule 3 & 4 omitted for compactness — scoring without them still yields a
  // valid QR; readers tolerate a slightly suboptimal mask.
  return score
}

export interface QrCodeMatrix {
  size: number
  modules: boolean[][]
}

export function encodeQr(text: string, ecc: QrEcc = "M"): QrCodeMatrix {
  const bytes = utf8Bytes(text)
  const version = chooseVersion(bytes.length, ecc)
  const padded = buildSegment(bytes, version, ecc)
  const finalData = interleaveBlocks(padded, version, ecc)

  let bestState: MatrixState | null = null
  let bestScore = Infinity
  for (let mask = 0; mask < 8; mask++) {
    const state = makeMatrix(version)
    placeFinder(state, 0, 0)
    placeFinder(state, state.size - 7, 0)
    placeFinder(state, 0, state.size - 7)
    placeAlignment(state, version)
    placeTimingPatterns(state)
    // reserve format areas (filled afterwards)
    for (let i = 0; i < 9; i++) {
      reserveModule(state, 8, i)
      reserveModule(state, i, 8)
      if (i < 8) reserveModule(state, state.size - 1 - i, 8)
      if (i < 8) reserveModule(state, 8, state.size - 1 - i)
    }
    placeData(state, finalData)
    applyMask(state, mask)
    placeFormatBits(state, ecc, mask)
    const score = penaltyScore(state)
    if (score < bestScore) {
      bestScore = score
      bestState = state
    }
  }
  if (!bestState) throw new Error("QR encoding failed")

  const modules: boolean[][] = []
  for (let y = 0; y < bestState.size; y++) {
    const row: boolean[] = []
    for (let x = 0; x < bestState.size; x++) {
      row.push(getModule(bestState, x, y) === 1)
    }
    modules.push(row)
  }
  return { size: bestState.size, modules }
}

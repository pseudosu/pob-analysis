import { inflate, inflateRaw } from 'zlib'
import { promisify } from 'util'

const inflateAsync = promisify(inflate)
const inflateRawAsync = promisify(inflateRaw)

/**
 * Decode a PoB build code into an XML string.
 *
 * PoB encodes as: XML → Deflate (zlib-wrapped) → base64 → URL-safe substitutions
 * Some older exports use raw DEFLATE; we try zlib first, then fallback to raw.
 */
export async function decodePobCode(code: string): Promise<string> {
  const b64 = code.trim().replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
  const compressed = Buffer.from(padded, 'base64')

  // Try zlib-wrapped inflate first (PoB default), fall back to raw DEFLATE
  try {
    const xml = await inflateAsync(compressed)
    return xml.toString('utf-8')
  } catch {
    const xml = await inflateRawAsync(compressed)
    return xml.toString('utf-8')
  }
}

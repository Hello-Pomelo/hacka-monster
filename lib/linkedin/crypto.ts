import "server-only"

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

// Chiffrement AES-256-GCM des secrets LinkedIn (jeton d'accès, connexion en attente).
// Format : "v1.<iv>.<tag>.<texte chiffré>", chaque partie en base64url.
const FORMAT_VERSION = "v1"
const ALGORITHM = "aes-256-gcm"
const IV_BYTES = 12
const TAG_BYTES = 16

function getKey(): Buffer {
  const raw = process.env.LINKEDIN_TOKEN_KEY
  const key = raw ? Buffer.from(raw, "base64") : Buffer.alloc(0)
  if (key.length !== 32) {
    throw new Error("LINKEDIN_TOKEN_KEY doit contenir 32 octets encodés en base64.")
  }
  return key
}

export function encryptSecret(plain: string): string {
  const key = getKey()
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_BYTES })
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return [FORMAT_VERSION, ...[iv, tag, ciphertext].map((part) => part.toString("base64url"))].join(".")
}

// Lève une erreur si le format est invalide ou si le texte a été modifié (tag GCM).
export function decryptSecret(payload: string): string {
  const parts = payload.split(".")
  if (parts.length !== 4 || parts[0] !== FORMAT_VERSION) {
    throw new Error("Secret chiffré illisible.")
  }

  const [iv, tag, ciphertext] = parts.slice(1).map((part) => Buffer.from(part, "base64url"))
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) {
    throw new Error("Secret chiffré illisible.")
  }

  const decipher = createDecipheriv(ALGORITHM, getKey(), iv, { authTagLength: TAG_BYTES })
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")
}

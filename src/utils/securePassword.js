import request from 'src/api/request'

let cachedKeyPromise = null

const pemToArrayBuffer = (pem) => {
  const base64 = String(pem || '')
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s+/g, '')

  const binary = window.atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes.buffer
}

const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return window.btoa(binary)
}

const importPublicKey = async (pem) => {
  return window.crypto.subtle.importKey(
    'spki',
    pemToArrayBuffer(pem),
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256'
    },
    false,
    ['encrypt']
  )
}

export const resetSecureLoginKeyCache = () => {
  cachedKeyPromise = null
}

const loadSecureLoginKey = async () => {
  if (!window.crypto?.subtle) {
    throw new Error('当前浏览器不支持安全登录')
  }

  if (!cachedKeyPromise) {
    cachedKeyPromise = request.get('/auth/secure-login/key').then(async ({ data }) => {
      const publicKey = String(data?.public_key || '').trim()
      const keyId = String(data?.key_id || '').trim()
      if (!publicKey || !keyId) {
        throw new Error('安全登录公钥获取失败')
      }
      return {
        keyId,
        cryptoKey: await importPublicKey(publicKey)
      }
    }).catch((error) => {
      cachedKeyPromise = null
      throw error
    })
  }

  return cachedKeyPromise
}

export const buildSecureLoginPayload = async ({ username, password }) => {
  const { keyId, cryptoKey } = await loadSecureLoginKey()
  const encodedPassword = new TextEncoder().encode(String(password || ''))
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP'
    },
    cryptoKey,
    encodedPassword
  )

  return {
    username,
    encrypted_password: arrayBufferToBase64(encrypted),
    key_id: keyId
  }
}

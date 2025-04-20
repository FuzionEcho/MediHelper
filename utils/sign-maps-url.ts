/**
 * Utility to sign Google Maps API URLs with a secret key
 */

import crypto from "crypto"

/**
 * Signs a URL with a secret key
 * @param url - The URL to sign
 * @param secret - The secret key for signing
 * @returns The signed URL
 */
export function signMapsUrl(url: string, secret: string): string {
  // Remove the protocol and domain from the URL if present
  const urlToSign = url.includes("://") ? url.split("://")[1].split("?")[1] : url

  // Decode the base64 secret
  const decodedSecret = Buffer.from(secret, "base64")

  // Create an HMAC using the secret
  const hmac = crypto.createHmac("sha1", decodedSecret)
  hmac.update(urlToSign)

  // Get the signature
  const signature = hmac.digest("base64")

  // Make the signature URL-safe
  const urlSafeSignature = signature.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")

  // Append the signature to the URL
  return `${url}&signature=${urlSafeSignature}`
}

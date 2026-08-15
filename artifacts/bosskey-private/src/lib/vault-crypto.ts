import sodium from "libsodium-wrappers-sumo";

const VAULT_VERIFIER_KEY = "bosskey.private.vault.verifier";
const VERIFIER_TEXT = "BossKey Private local vault verifier";
const ALGORITHM = "xchacha20-poly1305-ietf";

type EncryptedEnvelope = {
  version: 1;
  algorithm: typeof ALGORITHM;
  salt: string;
  nonce: string;
  ciphertext: string;
  aad: string;
};

let activeKey: Uint8Array | null = null;

function encode(value: Uint8Array) {
  return sodium.to_base64(value, sodium.base64_variants.ORIGINAL);
}

function decode(value: string) {
  return sodium.from_base64(value, sodium.base64_variants.ORIGINAL);
}

async function deriveKey(masterPassword: string, salt: Uint8Array) {
  await sodium.ready;
  return sodium.crypto_pwhash(
    sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
    masterPassword,
    salt,
    sodium.crypto_pwhash_OPSLIMIT_MODERATE,
    sodium.crypto_pwhash_MEMLIMIT_MODERATE,
    sodium.crypto_pwhash_ALG_ARGON2ID13,
  );
}

export async function encryptLocalValue(
  masterPassword: string,
  value: string,
  metadata: Record<string, string>,
): Promise<EncryptedEnvelope> {
  await sodium.ready;
  const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
  const nonce = sodium.randombytes_buf(
    sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES,
  );
  const aad = JSON.stringify(metadata);
  const key = await deriveKey(masterPassword, salt);
  const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    value,
    aad,
    null,
    nonce,
    key,
  );
  sodium.memzero(key);
  return {
    version: 1,
    algorithm: ALGORITHM,
    salt: encode(salt),
    nonce: encode(nonce),
    ciphertext: encode(ciphertext),
    aad,
  };
}

export async function decryptLocalValue(
  masterPassword: string,
  envelope: EncryptedEnvelope,
) {
  await sodium.ready;
  if (envelope.version !== 1 || envelope.algorithm !== ALGORITHM) {
    throw new Error("Unsupported vault envelope");
  }
  const key = await deriveKey(masterPassword, decode(envelope.salt));
  try {
    return sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null,
      decode(envelope.ciphertext),
      envelope.aad,
      decode(envelope.nonce),
      key,
    );
  } finally {
    sodium.memzero(key);
  }
}

export async function unlockLocalVault(masterPassword: string) {
  if (masterPassword.trim().length < 12) {
    throw new Error("Use a master password with at least 12 characters.");
  }

  const existing = localStorage.getItem(VAULT_VERIFIER_KEY);
  if (existing) {
    const verified = await decryptLocalValue(
      masterPassword,
      JSON.parse(existing) as EncryptedEnvelope,
    );
    const text = sodium.to_string(verified);
    if (text !== VERIFIER_TEXT) {
      throw new Error("The local vault verifier did not match.");
    }
  } else {
    const envelope = await encryptLocalValue(masterPassword, VERIFIER_TEXT, {
      purpose: "local-vault-verifier",
      product: "bosskey-private",
    });
    localStorage.setItem(VAULT_VERIFIER_KEY, JSON.stringify(envelope));
  }

  activeKey = await deriveKey(
    masterPassword,
    existing
      ? decode((JSON.parse(existing) as EncryptedEnvelope).salt)
      : decode(
          (
            JSON.parse(
              localStorage.getItem(VAULT_VERIFIER_KEY) as string,
            ) as EncryptedEnvelope
          ).salt,
        ),
  );
}

export function lockLocalVault() {
  if (activeKey) sodium.memzero(activeKey);
  activeKey = null;
}

export function isLocalVaultUnlocked() {
  return activeKey !== null;
}
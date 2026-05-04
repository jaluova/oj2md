/**
 * Build a CRX3 Chrome extension package.
 *
 * Usage: node scripts/build-crx.js <zip> <pem-key> <output.crx>
 *
 * CRX3 format:
 *   "Cr24" | version(4B LE) | header_size(4B LE) | protobuf_header | zip
 *
 * Signing (two-pass):
 *   Pass 1 — serialize header without signature, compute SHA256 over
 *            (header_size_LE + header_without_sig + zip), sign with RSA.
 *   Pass 2 — rebuild header with the signature attached.
 */
const crypto = require('crypto');
const fs = require('fs');

// ── Protobuf helpers (wire type 2 = length-delimited) ──────────
function encodeVarint(n) {
  const bytes = [];
  while (n > 127) {
    bytes.push((n & 0x7f) | 0x80);
    n >>>= 7;
  }
  bytes.push(n);
  return Buffer.from(bytes);
}

function encodeTag(fieldNumber) {
  // wire type 2 (length-delimited)
  return encodeVarint((fieldNumber << 3) | 2);
}

function encodeBytes(fieldNumber, value) {
  const tag = encodeTag(fieldNumber);
  const len = encodeVarint(value.length);
  return Buffer.concat([tag, len, value]);
}

function encodeMessage(fieldNumber, msg) {
  const tag = encodeTag(fieldNumber);
  const len = encodeVarint(msg.length);
  return Buffer.concat([tag, len, msg]);
}

// ── SignedData protobuf ────────────────────────────────────────
function buildSignedData(crxId) {
  // field 1: crx_id (bytes, 16 bytes)
  return encodeBytes(1, crxId);
}

// ── CrxFileHeader protobuf (without signature proof) ──────────
function buildHeaderProto(signedData) {
  // field 10000: signed_header_data = signedData
  // field 2: sha256_with_rsa (empty placeholder — filled in pass 2)
  return encodeBytes(10000, signedData);
}

// ── AsymmetricKeyProof protobuf ────────────────────────────────
function buildProof(publicKeyDer, signature) {
  // field 1: public_key, field 2: signature
  return Buffer.concat([
    encodeBytes(1, publicKeyDer),
    encodeBytes(2, signature),
  ]);
}

// ── Full CrxFileHeader with proof ─────────────────────────────
function buildFinalHeader(signedData, proof) {
  const signedDataField = encodeBytes(10000, signedData);
  const proofField = encodeMessage(2, proof);
  return Buffer.concat([proofField, signedDataField]);
}

// ═══════════════════════════════════════════════════════════════
function main() {
  const [,, zipPath, keyPath, outPath] = process.argv;
  if (!zipPath || !keyPath || !outPath) {
    console.error('Usage: node build-crx.js <zip> <key.pem> <output.crx>');
    process.exit(1);
  }

  const zip = fs.readFileSync(zipPath);
  const privateKeyPem = fs.readFileSync(keyPath, 'utf8');

  // Create private key object
  const privateKey = crypto.createPrivateKey({
    key: privateKeyPem,
    format: 'pem',
    type: 'pkcs1',
  });

  // Extract public key DER (SPKI format)
  const publicKey = crypto.createPublicKey(privateKey);
  const publicKeyDer = publicKey.export({ type: 'spki', format: 'der' });

  // crx_id = first 16 bytes of SHA256(public_key_der)
  const crxId = crypto.createHash('sha256').update(publicKeyDer).digest().subarray(0, 16);

  // ── Pass 1: build header without signature, compute verified data hash ──
  const signedData = buildSignedData(crxId);
  const headerProtoWithoutSig = buildHeaderProto(signedData);

  // verified_data = uint32LE(header_size) + header + zip
  const headerSize1 = Buffer.alloc(4);
  headerSize1.writeUInt32LE(headerProtoWithoutSig.length, 0);
  const verifiedData = Buffer.concat([headerSize1, headerProtoWithoutSig, zip]);

  // Sign SHA256(verified_data) with RSA-SHA256
  const hash = crypto.createHash('sha256').update(verifiedData).digest();
  const signature = crypto.sign('sha256', hash, {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PADDING,
  });

  // ── Pass 2: rebuild header with signature ──
  const proof = buildProof(publicKeyDer, signature);
  const finalHeader = buildFinalHeader(signedData, proof);

  const headerSize2 = Buffer.alloc(4);
  headerSize2.writeUInt32LE(finalHeader.length, 0);

  // ── Build CRX3 ──
  const magic = Buffer.from('Cr24');
  const version = Buffer.alloc(4);
  version.writeUInt32LE(3, 0);

  const crx = Buffer.concat([magic, version, headerSize2, finalHeader, zip]);

  fs.writeFileSync(outPath, crx);
  console.log(`✅ ${outPath} (${(crx.length / 1024).toFixed(1)} KB)`);
}

main();

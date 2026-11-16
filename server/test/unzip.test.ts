import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { unzip } from "../src/unzip.js";

describe("Unzip Module", () => {
  it("rejects non-zip files", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "listenmusic-unzip-"));
    const fakeFile = path.join(tmpDir, "fake.zip");
    await fs.writeFile(fakeFile, Buffer.from("not a real zip file at all"));
    await assert.rejects(() => unzip(fakeFile, tmpDir), /Not a zip file/);
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("prevents path traversal (Zip Slip)", async () => {
    // Construct a minimal synthetic ZIP containing an entry named '../../evil.txt'
    const name = "../../evil.txt";
    const nameBuf = Buffer.from(name, "utf8");
    const content = Buffer.from("malicious content", "utf8");

    // Local file header (30 bytes + name)
    const local = Buffer.alloc(30 + nameBuf.length + content.length);
    local.writeUInt32LE(0x04034b50, 0); // signature
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0, 6); // flags
    local.writeUInt16LE(0, 8); // compression: 0 (stored)
    local.writeUInt16LE(0, 10); // time
    local.writeUInt16LE(0, 12); // date
    local.writeUInt32LE(0, 14); // crc32
    local.writeUInt32LE(content.length, 18); // compressed size
    local.writeUInt32LE(content.length, 22); // uncompressed size
    local.writeUInt16LE(nameBuf.length, 26); // name length
    local.writeUInt16LE(0, 28); // extra length
    nameBuf.copy(local, 30);
    content.copy(local, 30 + nameBuf.length);

    // Central directory header (46 bytes + name)
    const central = Buffer.alloc(46 + nameBuf.length);
    central.writeUInt32LE(0x02014b50, 0); // signature
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(20, 6); // version needed
    central.writeUInt16LE(0, 8); // flags
    central.writeUInt16LE(0, 10); // compression
    central.writeUInt16LE(0, 12); // time
    central.writeUInt16LE(0, 14); // date
    central.writeUInt32LE(0, 16); // crc32
    central.writeUInt32LE(content.length, 20); // compressed size
    central.writeUInt32LE(content.length, 24); // uncompressed size
    central.writeUInt16LE(nameBuf.length, 28); // name length
    central.writeUInt16LE(0, 30); // extra length
    central.writeUInt16LE(0, 32); // comment length
    central.writeUInt16LE(0, 34); // disk start
    central.writeUInt16LE(0, 36); // internal attr
    central.writeUInt32LE(0, 38); // external attr
    central.writeUInt32LE(0, 42); // local header offset
    nameBuf.copy(central, 46);

    // End of Central Directory (22 bytes)
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0); // signature
    eocd.writeUInt16LE(0, 4); // disk number
    eocd.writeUInt16LE(0, 6); // start disk
    eocd.writeUInt16LE(1, 8); // entries on disk
    eocd.writeUInt16LE(1, 10); // total entries
    eocd.writeUInt32LE(central.length, 12); // central dir size
    eocd.writeUInt32LE(local.length, 16); // central dir offset
    eocd.writeUInt16LE(0, 20); // comment length

    const zipBuffer = Buffer.concat([local, central, eocd]);

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "listenmusic-zipslip-"));
    const outDir = path.join(tmpDir, "extracted");
    await fs.mkdir(outDir, { recursive: true });
    const zipPath = path.join(tmpDir, "test.zip");
    await fs.writeFile(zipPath, zipBuffer);

    await assert.rejects(
      () => unzip(zipPath, outDir),
      /Unsafe path in zip/,
    );

    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});

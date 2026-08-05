#!/usr/bin/env node

import { constants } from "node:fs";
import {
  chmod,
  copyFile,
  mkdir,
  opendir,
  rename,
  rm,
  stat,
} from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const watermarkText = "BookToVilla";
const watermarkMarker = 'btv:WatermarkVersion="1"';
const watermarkXmp = `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:btv="https://booktovilla.com/ns/1.0/" btv:WatermarkVersion="1" btv:WatermarkText="BookToVilla" />
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

function readArgument(name) {
  const prefix = `--${name}=`;
  return process.argv.slice(2).find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

function parsePositiveInteger(value, label) {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} pozitif bir tam sayi olmalidir.`);
  }

  return parsed;
}

async function listWebpFiles(directory) {
  const files = [];
  const entries = await opendir(directory);

  for await (const entry of entries) {
    const targetPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listWebpFiles(targetPath)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".webp")) {
      files.push(targetPath);
    }
  }

  return files;
}

function createWatermarkOverlay(imageWidth, imageHeight) {
  const margin = Math.max(12, Math.round(Math.min(imageWidth, imageHeight) * 0.025));
  const fontSize = Math.min(
    52,
    Math.max(18, Math.round(Math.min(imageWidth, imageHeight) * 0.04)),
  );
  const horizontalPadding = Math.round(fontSize * 0.75);
  const verticalPadding = Math.round(fontSize * 0.45);
  const estimatedTextWidth = Math.ceil(watermarkText.length * fontSize * 0.62);
  const overlayWidth = Math.min(
    imageWidth - margin * 2,
    Math.max(fontSize * 4, estimatedTextWidth + horizontalPadding * 2),
  );
  const overlayHeight = fontSize + verticalPadding * 2;
  const textWidth = Math.max(fontSize * 2, overlayWidth - horizontalPadding * 2);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${overlayWidth}" height="${overlayHeight}" viewBox="0 0 ${overlayWidth} ${overlayHeight}">
      <rect width="${overlayWidth}" height="${overlayHeight}" rx="6" fill="#111827" fill-opacity="0.48" />
      <text
        x="${overlayWidth / 2}"
        y="${overlayHeight / 2}"
        dy="0.36em"
        text-anchor="middle"
        textLength="${textWidth}"
        lengthAdjust="spacingAndGlyphs"
        fill="#ffffff"
        fill-opacity="0.92"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fontSize}"
        font-weight="700"
        letter-spacing="0.4"
      >${watermarkText}</text>
    </svg>
  `;

  return {
    input: Buffer.from(svg),
    left: Math.round((imageWidth - overlayWidth) / 2),
    top: Math.round((imageHeight - overlayHeight) / 2),
  };
}

function hasWatermarkMarker(metadata) {
  const xmp = metadata.xmpAsString ?? metadata.xmp?.toString("utf8") ?? "";
  return xmp.includes(watermarkMarker);
}

async function backupOriginal(filePath, uploadRoot, backupRoot) {
  const relativePath = path.relative(uploadRoot, filePath);
  const backupPath = path.join(backupRoot, relativePath);

  await mkdir(path.dirname(backupPath), { recursive: true });

  try {
    await copyFile(filePath, backupPath, constants.COPYFILE_EXCL);
  } catch (error) {
    if (!(typeof error === "object" && error && "code" in error && error.code === "EEXIST")) {
      throw error;
    }
  }
}

async function watermarkFile(filePath) {
  const metadata = await sharp(filePath).metadata();

  if (hasWatermarkMarker(metadata)) {
    return "already-watermarked";
  }

  if (!metadata.width || !metadata.height || metadata.width < 80 || metadata.height < 80) {
    return "invalid-dimensions";
  }

  const fileStats = await stat(filePath);
  const temporaryPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.watermark.tmp`,
  );

  try {
    await sharp(filePath)
      .composite([createWatermarkOverlay(metadata.width, metadata.height)])
      .webp({ quality: 82, effort: 3 })
      .withXmp(watermarkXmp)
      .toFile(temporaryPath);
    await chmod(temporaryPath, fileStats.mode);
    await rename(temporaryPath, filePath);
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }

  return "watermarked";
}

async function main() {
  const apply = process.argv.includes("--apply");
  const noBackup = process.argv.includes("--no-backup");
  const uploadRoot = path.resolve(
    readArgument("root") ??
      process.env.VILLA_UPLOAD_DIRECTORY ??
      path.join(process.cwd(), "public", "uploads", "villas"),
  );
  const backupRoot = path.resolve(
    readArgument("backup-dir") ?? path.join(process.cwd(), "storage", "villa-watermark-backup-v1"),
  );
  const limit = parsePositiveInteger(readArgument("limit"), "limit");

  sharp.concurrency(1);
  sharp.cache(false);

  const files = (await listWebpFiles(uploadRoot)).sort();
  const summary = {
    scanned: 0,
    eligible: 0,
    watermarked: 0,
    alreadyWatermarked: 0,
    skipped: 0,
    failed: 0,
  };

  console.log(`Mod: ${apply ? "UYGULA" : "ONIZLEME"}`);
  console.log(`Upload klasoru: ${uploadRoot}`);
  console.log(`Bulunan WEBP: ${files.length}`);

  if (apply && !noBackup) {
    console.log(`Yedek klasoru: ${backupRoot}`);
  }

  for (const filePath of files) {
    if (limit && summary.eligible >= limit) {
      break;
    }

    summary.scanned += 1;

    try {
      const metadata = await sharp(filePath).metadata();

      if (hasWatermarkMarker(metadata)) {
        summary.alreadyWatermarked += 1;
        continue;
      }

      if (!metadata.width || !metadata.height || metadata.width < 80 || metadata.height < 80) {
        summary.skipped += 1;
        continue;
      }

      summary.eligible += 1;

      if (!apply) {
        continue;
      }

      if (!noBackup) {
        await backupOriginal(filePath, uploadRoot, backupRoot);
      }

      const result = await watermarkFile(filePath);

      if (result === "watermarked") {
        summary.watermarked += 1;
      } else if (result === "already-watermarked") {
        summary.alreadyWatermarked += 1;
      } else {
        summary.skipped += 1;
      }

      if (summary.watermarked > 0 && summary.watermarked % 25 === 0) {
        console.log(`${summary.watermarked} gorsel filigranlandi...`);
      }
    } catch (error) {
      summary.failed += 1;
      console.error(`Hata: ${path.relative(uploadRoot, filePath)}`, error);
    }
  }

  console.log("Sonuc:", summary);

  if (!apply) {
    console.log("Bu bir onizlemeydi. Degisiklik yapmak icin komutu --apply ile calistir.");
  }

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Filigran islemi baslatilamadi:", error);
  process.exitCode = 1;
});

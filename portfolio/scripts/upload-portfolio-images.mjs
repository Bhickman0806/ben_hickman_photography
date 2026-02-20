/**
 * Bulk upload script: images/portfolio_imgs → Sanity CMS
 *
 * Usage (from the portfolio/ directory):
 *   node scripts/upload-portfolio-images.mjs
 *
 * Required env vars in portfolio/.env:
 *   PUBLIC_SANITY_PROJECT_ID
 *   PUBLIC_SANITY_DATASET
 *   SANITY_API_TOKEN      (Editor-level write token from sanity.io/manage)
 *   ANTHROPIC_API_KEY
 */

import 'dotenv/config';
import { createClient } from '@sanity/client';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.resolve(__dirname, '../../images/portfolio_imgs');
const VALID_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

// --- Clients ---

const sanity = createClient({
  projectId: process.env.PUBLIC_SANITY_PROJECT_ID || '6xolgh7z',
  dataset: process.env.PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-03-20',
  useCdn: false,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// --- Helpers ---

function toTitleCase(filename) {
  return path
    .basename(filename, path.extname(filename))
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function toSlug(filename) {
  return path
    .basename(filename, path.extname(filename))
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

async function generateAltText(imageUrl) {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'url',
              // Request a 800px-wide version from Sanity CDN to stay well under API limits
              url: `${imageUrl}?w=800`,
            },
          },
          {
            type: 'text',
            text: 'Write a concise alt text description for this photograph (1 sentence, 125 characters max) suitable for screen readers. Focus on the subject, action, and mood. Do not start with "A photo of" or "An image of".',
          },
        ],
      },
    ],
  });

  return response.content[0].text.trim().slice(0, 125);
}

async function uploadImageToSanity(imagePath) {
  const filename = path.basename(imagePath);
  const stream = fs.createReadStream(imagePath);
  return await sanity.assets.upload('image', stream, { filename });
}

async function createPhotoDocument(title, slug, assetId, altText) {
  return await sanity.create({
    _type: 'photo',
    title,
    slug: { _type: 'slug', current: slug },
    image: {
      _type: 'image',
      asset: { _type: 'reference', _ref: assetId },
      alt: altText,
    },
    featured: false,
  });
}

async function createCollectionDocument(photoDocs, collectionTitle = 'Portfolio') {
  const photos = photoDocs.map((doc, i) => ({
    _type: 'reference',
    _ref: doc._id,
    _key: `photo-${i}`,
  }));

  return await sanity.create({
    _type: 'collection',
    title: collectionTitle,
    slug: { _type: 'slug', current: collectionTitle.toLowerCase().replace(/\s+/g, '-') },
    photos,
    coverPhoto: photos.length > 0 ? { _type: 'reference', _ref: photoDocs[0]._id } : undefined,
    sortOrder: 0,
  });
}

// --- Main ---

async function main() {
  if (!process.env.SANITY_API_TOKEN) {
    console.error('Error: SANITY_API_TOKEN is not set in portfolio/.env');
    process.exit(1);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY is not set in portfolio/.env');
    process.exit(1);
  }

  const files = fs
    .readdirSync(IMAGES_DIR)
    .filter((f) => VALID_EXTENSIONS.has(path.extname(f).toLowerCase()))
    .sort();

  if (files.length === 0) {
    console.log(`No images found in ${IMAGES_DIR}`);
    process.exit(0);
  }

  console.log(`Found ${files.length} images in ${IMAGES_DIR}\n`);

  const successfulDocs = [];
  const failures = [];

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const imagePath = path.join(IMAGES_DIR, filename);
    const title = toTitleCase(filename);
    const slug = toSlug(filename);

    console.log(`[${i + 1}/${files.length}] ${filename}`);

    try {
      // Step 1: Upload image to Sanity first to get CDN URL
      process.stdout.write('  Uploading image to Sanity...');
      const asset = await uploadImageToSanity(imagePath);
      console.log(` ✓`);

      // Step 2: Generate alt text using the Sanity CDN URL (avoids local file size limits)
      process.stdout.write('  Generating alt text via Claude...');
      const altText = await generateAltText(asset.url);
      console.log(` ✓`);
      console.log(`  Alt: "${altText}"`);

      // Step 3: Create the photo document
      process.stdout.write('  Creating photo document...');
      const doc = await createPhotoDocument(title, slug, asset._id, altText);
      console.log(` ✓ (${doc._id})\n`);

      successfulDocs.push(doc);
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}\n`);
      failures.push({ filename, error: err.message });
    }
  }

  // Step 4: Create the collection document
  if (successfulDocs.length > 0) {
    process.stdout.write(
      `Creating "Portfolio" collection with ${successfulDocs.length} photos...`
    );
    try {
      const col = await createCollectionDocument(successfulDocs);
      console.log(` ✓ (${col._id})\n`);
    } catch (err) {
      console.error(` ✗ Failed to create collection: ${err.message}\n`);
    }
  }

  console.log('--- Summary ---');
  console.log(`✓ ${successfulDocs.length} photos uploaded successfully`);
  if (failures.length > 0) {
    console.log(`✗ ${failures.length} failed:`);
    failures.forEach((f) => console.log(`  - ${f.filename}: ${f.error}`));
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

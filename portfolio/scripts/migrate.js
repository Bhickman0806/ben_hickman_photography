import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';

// Using the credentials found in the .env file
const token = 'skrlbTX3xijxE50pSLDjsv3fDV4HUZwVya9FjosgD4VNQW0E65SYQbFIx7pDelEtmfajKfrlLrWVMP7VvgNEhDFUHJt1DOaf96du8ybHNWWHgVFCnrFKjGGlljFUneSV34xoDfcrCfNQvFjB3zS3ox7w3R4EZ8whDngkcf4DoM1v52py6YeV';
const projectId = '6xolgh7z';
const dataset = 'production'; // Using production as requested

const client = createClient({
    projectId,
    dataset,
    useCdn: false, // We must bypass CDN for writing
    apiVersion: '2024-03-20',
    token,
});

const IMAGES_DIR = '/Users/bhickman/Documents/Anitgravity Tests/ben_hickman_photography/images/portfolio_imgs';

// Helper to generate a slug from a string (e.g. "Continuous feasting 2021" -> "continuous-feasting-2021")
function generateSlug(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')       // Replace spaces with -
        .replace(/[^\w-]+/g, '')     // Remove all non-word chars
        .replace(/--+/g, '-')       // Replace multiple - with single -
        .replace(/^-+/, '')         // Trim - from start of text
        .replace(/-+$/, '');        // Trim - from end of text
}

// Clean up folder names slightly
function cleanTitle(title) {
    return title.trim().replace(/^Hero zings$/i, 'Hero').replace(/^About Section Imgs$/i, 'About');
}

async function clearExistingData() {
    console.log('--- Step 1: Clearing existing collections and photos ---');

    try {
        console.log('Clearing references from pages...');
        const pages = await client.fetch(`*[_type == "page"]`);
        for (const page of pages) {
            let patches = [];
            if (page.featuredCollections) patches.push('featuredCollections');
            if (page.heroImages) patches.push('heroImages');
            if (patches.length > 0) {
                console.log(`Clearing ${patches.join(', ')} from page ${page.slug?.current || page._id}`);
                await client.patch(page._id).unset(patches).commit();
            }
        }

        // Fetch collections first and delete them
        let collectionsQuery = `*[_type == "collection"]._id`;
        let collectionIds = await client.fetch(collectionsQuery);
        if (collectionIds.length > 0) {
            console.log(`Found ${collectionIds.length} collections. Deleting...`);
            let tx = client.transaction();
            for (const id of collectionIds) tx.delete(id);
            await tx.commit();
        }

        // Then fetch photos and delete them
        let photosQuery = `*[_type == "photo"]._id`;
        let photoIds = await client.fetch(photosQuery);
        if (photoIds.length > 0) {
            console.log(`Found ${photoIds.length} photos. Deleting...`);
            let tx = client.transaction();
            for (const id of photoIds) tx.delete(id);
            await tx.commit();
        }

        console.log('Successfully deleted existing document types.');

        // Optionally delete orphaned assets (Images not attached to anywhere)
        console.log('Finding orphaned assets to delete...');
        const assetQuery = `*[_type == "sanity.imageAsset" && count(*[references(^._id)]) == 0]._id`;
        const assetIds = await client.fetch(assetQuery);

        if (assetIds.length > 0) {
            console.log(`Found ${assetIds.length} orphaned assets. Deleting...`);
            let assetTx = client.transaction();
            for (const assetId of assetIds) {
                assetTx.delete(assetId);
            }
            await assetTx.commit();
            console.log('Successfully deleted orphaned assets.');
        } else {
            console.log('No orphaned assets found.');
        }

    } catch (err) {
        console.error('Error clearing data:', err.message);
        throw err;
    }
}

async function processDirectory() {
    console.log(`\n--- Step 2: Processing directory ${IMAGES_DIR} ---`);

    const folders = fs.readdirSync(IMAGES_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory());

    console.log(`Found ${folders.length} folders to process.`);

    for (const folder of folders) {
        const folderName = folder.name;
        const folderPath = path.join(IMAGES_DIR, folderName);

        // Skip explicitly non-portfolio assets, or decide to keep them
        // the user's instructions were to create collections for all subfolders. I will honor that but clean names.
        const cleanedName = cleanTitle(folderName);
        const slug = generateSlug(cleanedName);

        const files = fs.readdirSync(folderPath).filter(f => {
            const ext = path.extname(f).toLowerCase();
            return !f.startsWith('.') && ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
        });

        if (files.length === 0) {
            console.log(`Skipping empty folder: "${folderName}"`);
            continue; // Skip empty folders entirely
        }

        console.log(`\nCreating Collection: "${cleanedName}" with ${files.length} images...`);

        // Create the Collection document in Sanity
        const collectionDoc = {
            _type: 'collection',
            title: cleanedName,
            slug: { current: slug, _type: 'slug' },
            sortOrder: 0
        };

        try {
            const createdCollection = await client.create(collectionDoc);
            const collectionId = createdCollection._id;
            console.log(`Created collection document with ID: ${collectionId}`);

            // Upload photos and link them
            let firstPhotoId = null;

            for (const file of files) {
                const filePath = path.join(folderPath, file);
                const photoTitle = path.parse(file).name;
                const photoSlug = generateSlug(photoTitle) + '-' + Math.floor(Math.random() * 10000); // Randomize to prevent collisions

                console.log(`  Uploading asset: ${file}...`);
                const asset = await client.assets.upload('image', fs.createReadStream(filePath), {
                    filename: file
                });

                const photoDoc = {
                    _type: 'photo',
                    title: photoTitle,
                    slug: { current: photoSlug, _type: 'slug' },
                    image: {
                        _type: 'image',
                        asset: { _type: 'reference', _ref: asset._id },
                        alt: photoTitle // Basic alt text, can be refined later
                    },
                    collection: { _type: 'reference', _ref: collectionId }
                };

                const createdPhoto = await client.create(photoDoc);
                console.log(`  -> Created Photo document: ${createdPhoto.title}`);

                if (!firstPhotoId) {
                    firstPhotoId = createdPhoto._id;
                }
            }

            // Assign the first photo as the cover photo for the collection
            if (firstPhotoId) {
                console.log(`Assigning cover photo to collection "${cleanedName}"...`);
                await client
                    .patch(collectionId)
                    .set({ coverPhoto: { _type: 'reference', _ref: firstPhotoId } })
                    .commit();
            }

        } catch (err) {
            console.error(`Error processing folder ${folderName}:`, err.message);
            // Non-fatal, keep trying other folders
        }
    }
}

async function run() {
    try {
        await clearExistingData();
        await processDirectory();
        console.log('\n--- Migration Complete! ---');
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

run();

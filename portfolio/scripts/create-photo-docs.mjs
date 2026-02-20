import { createClient } from '@sanity/client'

const PROJECT_ID = process.env.PUBLIC_SANITY_PROJECT_ID || '6xolgh7z'
const DATASET = process.env.PUBLIC_SANITY_DATASET || 'production'
const TOKEN = process.env.SANITY_API_TOKEN

if (!TOKEN) {
    console.error('❌ SANITY_API_TOKEN is not set.')
    process.exit(1)
}

const client = createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    token: TOKEN,
    apiVersion: '2024-01-01',
    useCdn: false,
})

// Convert filename like "boy_field_grass.jpg" → "Boy Field Grass"
function toTitle(filename) {
    return filename
        .replace(/\.[^.]+$/, '')           // remove extension
        .replace(/[_-]+/g, ' ')            // underscores/dashes to spaces
        .replace(/\b\w/g, c => c.toUpperCase()) // capitalize each word
}

// Convert title to slug like "boy-field-grass"
function toSlug(title) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function run() {
    // 1. Fetch all image assets uploaded to this project
    console.log('\n📡 Fetching uploaded image assets from Sanity...')
    const assets = await client.fetch(`*[_type == "sanity.imageAsset"]{ _id, originalFilename }`)
    console.log(`   Found ${assets.length} assets.\n`)

    // 2. Find which filenames already have Photo docs so we don't double-create
    const existingDocs = await client.fetch(`*[_type == "photo"]{ image { asset->{ _id, originalFilename } } }`)
    const existingAssetIds = new Set(existingDocs.map(d => d?.image?.asset?._id).filter(Boolean))

    const toCreate = assets.filter(a => !existingAssetIds.has(a._id))
    console.log(`   ${existingAssetIds.size} already have Photo docs. Creating ${toCreate.length} new docs.\n`)

    let successCount = 0
    let errorCount = 0

    for (const asset of toCreate) {
        const filename = asset.originalFilename || asset._id
        const title = toTitle(filename)
        const slug = toSlug(title)

        const doc = {
            _type: 'photo',
            title,
            slug: { _type: 'slug', current: slug },
            image: {
                _type: 'image',
                asset: { _type: 'reference', _ref: asset._id },
                alt: title,
            },
            featured: false,
        }

        try {
            process.stdout.write(`  📄 Creating "${title}"...`)
            await client.create(doc)
            console.log(' ✅')
            successCount++
        } catch (err) {
            console.log(` ❌ ${err.message}`)
            errorCount++
        }
    }

    console.log(`\n📊 Done!`)
    console.log(`   ✅ Created: ${successCount}`)
    if (errorCount > 0) console.log(`   ❌ Failed:  ${errorCount}`)
    console.log(`\nView them at: http://localhost:3333/structure/photo\n`)
}

run().catch(err => { console.error(err); process.exit(1) })

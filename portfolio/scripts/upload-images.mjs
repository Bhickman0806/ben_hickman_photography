import { createClient } from '@sanity/client'
import { createReadStream, readdirSync, statSync } from 'fs'
import { join, extname, basename } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Config — reads from environment or uses hardcoded values from .env
const PROJECT_ID = process.env.PUBLIC_SANITY_PROJECT_ID || '6xolgh7z'
const DATASET = process.env.PUBLIC_SANITY_DATASET || 'production'
const TOKEN = process.env.SANITY_API_TOKEN

if (!TOKEN) {
    console.error('❌ SANITY_API_TOKEN is not set. Please run with dotenv or export the variable.')
    process.exit(1)
}

const client = createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    token: TOKEN,
    apiVersion: '2024-01-01',
    useCdn: false,
})

const IMAGES_DIR = join(__dirname, '../../images/portfolio_imgs')
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']

async function uploadImages() {
    const files = readdirSync(IMAGES_DIR).filter(file => {
        const ext = extname(file).toLowerCase()
        return SUPPORTED_EXTENSIONS.includes(ext) && statSync(join(IMAGES_DIR, file)).isFile()
    })

    console.log(`\n📁 Found ${files.length} image(s) to upload from:\n   ${IMAGES_DIR}\n`)

    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    for (const file of files) {
        const filePath = join(IMAGES_DIR, file)
        const fileBasename = basename(file)
        const ext = extname(file).toLowerCase().replace('.', '')
        const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
            : ext === 'png' ? 'image/png'
                : ext === 'webp' ? 'image/webp'
                    : ext === 'gif' ? 'image/gif'
                        : ext === 'avif' ? 'image/avif'
                            : 'image/jpeg'

        try {
            process.stdout.write(`  ⬆️  Uploading ${fileBasename}...`)
            const asset = await client.assets.upload('image', createReadStream(filePath), {
                filename: fileBasename,
                contentType: mimeType,
            })
            console.log(` ✅ Done (${asset._id})`)
            successCount++
        } catch (err) {
            console.log(` ❌ Failed: ${err.message}`)
            errorCount++
        }
    }

    console.log(`\n📊 Upload complete!`)
    console.log(`   ✅ Successful: ${successCount}`)
    if (skipCount > 0) console.log(`   ⏭️  Skipped:    ${skipCount}`)
    if (errorCount > 0) console.log(`   ❌ Failed:     ${errorCount}`)
    console.log(`\nYou can view your assets at: https://www.sanity.io/manage/personal/project/${PROJECT_ID}/datasets/${DATASET}/assets\n`)
}

uploadImages().catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
})

import { getCliClient } from 'sanity/cli'

const client = getCliClient()

function generateKey() {
    return Math.random().toString(36).substring(2, 10)
}

async function migrate() {
    console.log('Fetching all collections...')
    const collections = await client.fetch(`*[_type == "collection"]{_id, title}`)

    for (const collection of collections) {
        console.log(`Processing collection: ${collection.title} (${collection._id})`)

        // Fetch photos currently pointing to this collection
        const photos = await client.fetch(`*[_type == "photo" && collection._ref == $collectionId] | order(dateTaken desc) {_id}`, {
            collectionId: collection._id
        })

        if (photos.length === 0) {
            console.log(`  No photos found for this collection.`)
            continue
        }

        console.log(`  Found ${photos.length} photos. Updating collection...`)

        // Prepare the array of photo references
        const photoReferences = photos.map((photo) => ({
            _type: 'reference',
            _ref: photo._id,
            _key: generateKey()
        }))

        // Patch the collection
        try {
            await client.patch(collection._id)
                .setIfMissing({ photos: [] })
                .set({ photos: photoReferences })
                .commit()
            console.log(`  Successfully updated ${collection.title}.`)
        } catch (error) {
            console.error(`  Failed to update ${collection.title}:`, error)
        }
    }

    console.log('Migration complete.')
}

migrate().catch(console.error)

import { getCliClient } from 'sanity/cli'

const client = getCliClient()

function generateKey() {
    return Math.random().toString(36).substring(2, 10)
}

interface CollectionDoc {
    _id: string
    title: string
    subtitle?: string
    description?: string
    writeup?: unknown[]
    coverPhoto?: { _id: string }
    photos?: { _id: string }[]
    spreads?: unknown[]
}

async function migrate() {
    const dataset = client.config().dataset
    console.log(`Migrating collections to spreads on dataset: ${dataset}`)

    const collections: CollectionDoc[] = await client.fetch(`*[_type == "collection"]{
        _id,
        title,
        subtitle,
        description,
        writeup,
        "coverPhoto": coverPhoto->{ _id },
        "photos": photos[]->{ _id },
        spreads
    }`)

    for (const collection of collections) {
        if (collection.spreads?.length) {
            console.log(`Skipping ${collection.title}: spreads already defined (${collection.spreads.length})`)
            continue
        }

        const spreads: Record<string, unknown>[] = []

        if (collection.coverPhoto?._id) {
            spreads.push({
                _type: 'coverSpread',
                _key: generateKey(),
                overlayTitle: collection.title,
                photo: { _type: 'reference', _ref: collection.coverPhoto._id },
            })
        }

        if (collection.description || collection.subtitle) {
            spreads.push({
                _type: 'titleTextSpread',
                _key: generateKey(),
                heading: collection.title,
                subtitle: collection.subtitle,
                body: collection.description,
            })
        }

        if (collection.writeup?.length) {
            spreads.push({
                _type: 'textImageSpread',
                _key: generateKey(),
                body: collection.writeup,
                imagePosition: 'right',
            })
        }

        for (const photo of collection.photos || []) {
            spreads.push({
                _type: 'fullBleedSpread',
                _key: generateKey(),
                photo: { _type: 'reference', _ref: photo._id },
            })
        }

        if (spreads.length > 0) {
            spreads.push({
                _type: 'closingSpread',
                _key: generateKey(),
                body: 'End of collection',
            })
        }

        if (spreads.length === 0) {
            console.log(`Skipping ${collection.title}: no source content to migrate`)
            continue
        }

        try {
            await client.patch(collection._id).set({ spreads }).commit()
            console.log(`Migrated ${collection.title}: ${spreads.length} spreads`)
        } catch (error) {
            console.error(`Failed to migrate ${collection.title}:`, error)
        }
    }

    console.log('Migration complete.')
}

migrate().catch(console.error)

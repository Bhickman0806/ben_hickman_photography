import { getCliClient } from 'sanity/cli'

const client = getCliClient()

async function main() {
    console.log('Fetching photos with strong collection references...')
    // Fetch photos where `collection` is defined but does NOT have `_weak: true`
    const photos = await client.fetch(
        `*[_type == "photo" && defined(collection) && collection._weak != true]{_id, collection}`
    )

    console.log(`Found ${photos.length} photos to update.`)

    if (photos.length > 0) {
        const transaction = client.transaction()
        for (const photo of photos) {
            transaction.patch(photo._id, (p) =>
                p.set({
                    collection: {
                        ...photo.collection,
                        _weak: true,
                    },
                })
            )
        }
        await transaction.commit()
        console.log('Successfully updated photos.')
    }

    // Same thing for pages with featured collections
    console.log('Fetching pages with strong featuredCollections references...')
    const pages = await client.fetch(
        `*[_type == "page" && defined(featuredCollections)]{_id, featuredCollections}`
    )

    const pageTransaction = client.transaction()
    let pageUpdatesCount = 0

    for (const page of pages) {
        let changed = false
        const newCollections = page.featuredCollections.map((ref: any) => {
            if (!ref._weak) {
                changed = true
                return { ...ref, _weak: true }
            }
            return ref
        })

        if (changed) {
            pageTransaction.patch(page._id, (p) => p.set({ featuredCollections: newCollections }))
            pageUpdatesCount++
        }
    }

    if (pageUpdatesCount > 0) {
        await pageTransaction.commit()
        console.log(`Successfully updated ${pageUpdatesCount} pages.`)
    } else {
        console.log('No pages needed updating.')
    }

    console.log('Migration complete.')
}

main().catch(console.error)

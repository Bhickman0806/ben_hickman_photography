import { createClient } from '@sanity/client';
const client = createClient({
    projectId: '6xolgh7z',
    dataset: 'production',
    useCdn: false,
    apiVersion: '2024-03-20',
    token: 'skrlbTX3xijxE50pSLDjsv3fDV4HUZwVya9FjosgD4VNQW0E65SYQbFIx7pDelEtmfajKfrlLrWVMP7VvgNEhDFUHJt1DOaf96du8ybHNWWHgVFCnrFKjGGlljFUneSV34xoDfcrCfNQvFjB3zS3ox7w3R4EZ8whDngkcf4DoM1v52py6YeV',
});

async function restore() {
    const page = await client.fetch(`*[_type == "page" && slug.current == "/"][0]`);
    if (!page) return console.log("Homepage not found");

    const collections = await client.fetch(`*[_type == "collection"]._id`);
    const photos = await client.fetch(`*[_type == "photo"]._id`);

    const featuredCollections = collections.map(id => ({ _type: 'reference', _ref: id, _key: id }));
    // Just pick the first 5 photos for the hero slider
    const heroImages = photos.slice(0, 5).map(id => ({ _type: 'reference', _ref: id, _key: id }));

    await client.patch(page._id)
        .set({ featuredCollections, heroImages })
        .commit();
    
    console.log("Restored homepage references!");
}
restore();

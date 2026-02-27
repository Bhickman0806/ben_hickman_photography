import { createClient } from '@sanity/client';
const client = createClient({
    projectId: '6xolgh7z',
    dataset: 'production',
    useCdn: false,
    apiVersion: '2024-03-20',
    token: 'skrlbTX3xijxE50pSLDjsv3fDV4HUZwVya9FjosgD4VNQW0E65SYQbFIx7pDelEtmfajKfrlLrWVMP7VvgNEhDFUHJt1DOaf96du8ybHNWWHgVFCnrFKjGGlljFUneSV34xoDfcrCfNQvFjB3zS3ox7w3R4EZ8whDngkcf4DoM1v52py6YeV',
});
client.getDocument('b1fba870-c6ad-46d8-abef-81aa6975fdad').then(console.log);

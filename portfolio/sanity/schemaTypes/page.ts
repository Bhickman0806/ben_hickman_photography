import { defineType, defineField } from 'sanity'

export const page = defineType({
    name: 'page',
    title: 'Page',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'title',
                maxLength: 96,
            },
        }),
        defineField({
            name: 'seo',
            title: 'SEO Metadata',
            type: 'object',
            fields: [
                defineField({ name: 'metaTitle', type: 'string', title: 'Meta Title' }),
                defineField({ name: 'metaDescription', type: 'text', title: 'Meta Description' }),
                defineField({ name: 'ogImage', type: 'image', title: 'Open Graph Image' }),
            ],
        }),

        // Homepage content fields
        defineField({
            name: 'heroHeading',
            title: 'Hero Heading (HTML allowed)',
            type: 'string',
            description: 'e.g. "Cinematic... unapologetically bold."',
        }),
        defineField({
            name: 'heroImages',
            title: 'Hero Images',
            type: 'array',
            of: [{ type: 'reference', to: { type: 'photo' } }],
            validation: (Rule) => Rule.max(2),
        }),
        defineField({
            name: 'featuredCollections',
            title: 'Featured Collections',
            type: 'array',
            of: [{ type: 'reference', to: { type: 'collection' } }],
        }),
    ],
})

import { defineType, defineField, defineArrayMember } from 'sanity'

export const collection = defineType({
    name: 'collection',
    title: 'Collection',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'isHidden',
            title: 'Hide Collection',
            type: 'boolean',
            description: 'If checked, this collection will not be visible on the public website.',
            initialValue: false,
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'title',
                maxLength: 96,
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'subtitle',
            title: 'Subtitle',
            type: 'string',
        }),
        defineField({
            name: 'description',
            title: 'Description',
            type: 'text',
        }),
        defineField({
            name: 'writeup',
            title: 'Write-up',
            type: 'array',
            of: [
                // Standard text blocks
                defineArrayMember({
                    type: 'block',
                    styles: [
                        { title: 'Paragraph', value: 'normal' },
                        { title: 'Section Heading', value: 'h2' },
                    ],
                    marks: {
                        decorators: [
                            { title: 'Bold', value: 'strong' },
                            { title: 'Italic', value: 'em' },
                        ],
                    },
                }),
                // Pull quote — spans both columns in the layout
                defineArrayMember({
                    name: 'pullQuote',
                    title: 'Pull Quote',
                    type: 'object',
                    fields: [
                        defineField({
                            name: 'text',
                            title: 'Quote',
                            type: 'text',
                            rows: 3,
                            validation: (Rule) => Rule.required(),
                        }),
                        defineField({
                            name: 'attribution',
                            title: 'Attribution',
                            type: 'string',
                            description: 'Optional. E.g. "On waiting for light, Utah — 2024"',
                        }),
                    ],
                    preview: {
                        select: { text: 'text' },
                        prepare({ text }) {
                            return { title: `❝ ${text?.slice(0, 60) ?? ''}…` }
                        },
                    },
                }),
                // Inline image — sits within the column flow
                defineArrayMember({
                    name: 'inlineImage',
                    title: 'Inline Image',
                    type: 'image',
                    options: { hotspot: true },
                    fields: [
                        defineField({
                            name: 'alt',
                            title: 'Alt Text',
                            type: 'string',
                            validation: (Rule) => Rule.required().warning('Alt text required for accessibility'),
                        }),
                        defineField({
                            name: 'caption',
                            title: 'Caption',
                            type: 'string',
                        }),
                    ],
                }),
            ],
        }),
        defineField({
            name: 'coverPhoto',
            title: 'Cover Photo',
            type: 'reference',
            to: [{ type: 'photo' }],
        }),
        defineField({
            name: 'photos',
            title: 'Photos',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'photo' }] }],
            description: 'Legacy photo list. Used as fallback when spreads is empty. Prefer building the collection in spreads.',
        }),
        defineField({
            name: 'spreads',
            title: 'Book Spreads',
            type: 'array',
            description: 'Ordered sequence of pages for the photo book view. Drag to reorder.',
            of: [
                { type: 'coverSpread' },
                { type: 'titleTextSpread' },
                { type: 'fullBleedSpread' },
                { type: 'diptychSpread' },
                { type: 'textImageSpread' },
                { type: 'closingSpread' },
            ],
        }),

        defineField({
            name: 'sortOrder',
            title: 'Sort Order',
            type: 'number',
            initialValue: 0,
        }),
    ],
})

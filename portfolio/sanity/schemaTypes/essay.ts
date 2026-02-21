import { defineType, defineField, defineArrayMember } from 'sanity'

export const essay = defineType({
    name: 'essay',
    title: 'Essay',
    type: 'document',
    fields: [
        // ── Core metadata ──────────────────────────────────────────────────────
        defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: { source: 'title', maxLength: 96 },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'deck',
            title: 'Deck',
            type: 'string',
            description: 'The italic summary sentence shown beneath the title.',
        }),
        defineField({
            name: 'category',
            title: 'Category',
            type: 'string',
            description: 'Shown in the breadcrumb as "Writing / {category}". E.g. "On Seeing", "Practice".',
        }),
        defineField({
            name: 'publishedAt',
            title: 'Published',
            type: 'date',
        }),
        defineField({
            name: 'readingTime',
            title: 'Reading Time (minutes)',
            type: 'number',
        }),
        defineField({
            name: 'tags',
            title: 'Tags',
            type: 'array',
            of: [{ type: 'string' }],
            options: { layout: 'tags' },
        }),

        // ── Hero image ─────────────────────────────────────────────────────────
        defineField({
            name: 'heroImage',
            title: 'Hero Image',
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
                    description: 'Shown beneath the image in small caps. E.g. "Canyon vista — f/11, 4 sec — 2024"',
                }),
            ],
        }),

        // ── Body ───────────────────────────────────────────────────────────────
        // Portable Text with paragraphs, section headings, pull quotes, and inline images.
        defineField({
            name: 'body',
            title: 'Body',
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

        // ── Related essays ─────────────────────────────────────────────────────
        defineField({
            name: 'relatedEssays',
            title: 'Related Essays',
            type: 'array',
            of: [defineArrayMember({ type: 'reference', to: [{ type: 'essay' }] })],
            validation: (Rule) => Rule.max(2),
        }),
    ],

    preview: {
        select: { title: 'title', deck: 'deck', media: 'heroImage' },
        prepare({ title, deck, media }) {
            return { title, subtitle: deck, media }
        },
    },
})

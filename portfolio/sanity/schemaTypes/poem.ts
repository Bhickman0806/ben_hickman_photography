import { defineType, defineField, defineArrayMember } from 'sanity'

export const poem = defineType({
    name: 'poem',
    title: 'Poem',
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
            name: 'publishedAt',
            title: 'Published',
            type: 'date',
        }),
        defineField({
            name: 'form',
            title: 'Form',
            type: 'string',
            description: 'E.g. "Free Verse", "Sonnet", "Lyric", "Prose Poem".',
            options: {
                list: [
                    { title: 'Free Verse', value: 'Free Verse' },
                    { title: 'Sonnet', value: 'Sonnet' },
                    { title: 'Lyric', value: 'Lyric' },
                    { title: 'Prose Poem', value: 'Prose Poem' },
                    { title: 'Haiku', value: 'Haiku' },
                    { title: 'Elegy', value: 'Elegy' },
                    { title: 'Ode', value: 'Ode' },
                ],
                layout: 'radio',
            },
        }),
        defineField({
            name: 'location',
            title: 'Location & Year',
            type: 'string',
            description: 'Shown in the article header. E.g. "Canyonlands, 2024".',
        }),
        defineField({
            name: 'tags',
            title: 'Tags',
            type: 'array',
            of: [{ type: 'string' }],
            options: { layout: 'tags' },
        }),

        // ── Epigraph ───────────────────────────────────────────────────────────
        defineField({
            name: 'epigraph',
            title: 'Epigraph',
            type: 'object',
            description: 'Optional quote shown before the poem begins.',
            fields: [
                defineField({
                    name: 'text',
                    title: 'Text',
                    type: 'text',
                    rows: 3,
                }),
                defineField({
                    name: 'attribution',
                    title: 'Attribution',
                    type: 'string',
                    description: 'E.g. "Field journal, November 2023"',
                }),
            ],
        }),

        // ── Stanzas ────────────────────────────────────────────────────────────
        // Each stanza is an object with an optional section numeral and a block of lines.
        // The renderer splits `lines` on newline characters to get individual poetic lines.
        defineField({
            name: 'stanzas',
            title: 'Stanzas',
            type: 'array',
            of: [
                defineArrayMember({
                    name: 'stanza',
                    title: 'Stanza',
                    type: 'object',
                    fields: [
                        defineField({
                            name: 'numeral',
                            title: 'Section Numeral',
                            type: 'string',
                            description: 'Optional. E.g. "I", "II", "III" — shown in small caps above the stanza.',
                        }),
                        defineField({
                            name: 'lines',
                            title: 'Lines',
                            type: 'text',
                            description: 'Write the poem line by line. Each line break is a new poetic line.',
                            rows: 8,
                            validation: (Rule) => Rule.required(),
                        }),
                    ],
                    preview: {
                        select: { numeral: 'numeral', lines: 'lines' },
                        prepare({ numeral, lines }) {
                            const firstLine = lines?.split('\n')[0] ?? 'Empty stanza'
                            return {
                                title: numeral ? `${numeral}.  ${firstLine}` : firstLine,
                            }
                        },
                    },
                }),
            ],
            validation: (Rule) => Rule.required().min(1),
        }),

        // ── Poet's note ────────────────────────────────────────────────────────
        defineField({
            name: 'poetsNote',
            title: "Poet's Note",
            type: 'text',
            rows: 5,
            description: 'Optional prose note shown below the poem.',
        }),

        // ── Related poems ──────────────────────────────────────────────────────
        defineField({
            name: 'relatedPoems',
            title: 'Related Poems',
            type: 'array',
            of: [defineArrayMember({ type: 'reference', to: [{ type: 'poem' }] })],
            validation: (Rule) => Rule.max(4),
        }),
    ],

    preview: {
        select: { title: 'title', form: 'form', location: 'location' },
        prepare({ title, form, location }) {
            return {
                title,
                subtitle: [form, location].filter(Boolean).join(' · '),
            }
        },
    },
})

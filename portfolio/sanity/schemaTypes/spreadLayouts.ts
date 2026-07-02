import { defineType, defineField, defineArrayMember } from 'sanity'

const photoRef = defineField({
    name: 'photo',
    title: 'Photo',
    type: 'reference',
    to: [{ type: 'photo' }],
})

const portableTextBody = defineArrayMember({
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
})

export const coverSpread = defineType({
    name: 'coverSpread',
    title: 'Cover',
    type: 'object',
    fields: [
        photoRef,
        defineField({
            name: 'overlayTitle',
            title: 'Overlay Title',
            type: 'string',
            description: 'Optional title overlaid on the cover image. Defaults to collection title.',
        }),
    ],
    preview: {
        select: { title: 'overlayTitle', media: 'photo.image' },
        prepare({ title, media }) {
            return { title: `Cover${title ? `: ${title}` : ''}`, media }
        },
    },
})

export const titleTextSpread = defineType({
    name: 'titleTextSpread',
    title: 'Title + Text',
    type: 'object',
    fields: [
        defineField({
            name: 'heading',
            title: 'Heading',
            type: 'string',
        }),
        defineField({
            name: 'subtitle',
            title: 'Subtitle',
            type: 'string',
        }),
        defineField({
            name: 'body',
            title: 'Body',
            type: 'text',
            rows: 6,
        }),
    ],
    preview: {
        select: { title: 'heading', subtitle: 'subtitle' },
        prepare({ title, subtitle }) {
            return { title: `Title + Text: ${title || 'Untitled'}`, subtitle }
        },
    },
})

export const fullBleedSpread = defineType({
    name: 'fullBleedSpread',
    title: 'Full Bleed Image',
    type: 'object',
    fields: [
        photoRef,
        defineField({
            name: 'caption',
            title: 'Caption',
            type: 'string',
        }),
    ],
    preview: {
        select: { title: 'caption', media: 'photo.image' },
        prepare({ title, media }) {
            return { title: `Full Bleed${title ? `: ${title}` : ''}`, media }
        },
    },
})

export const diptychSpread = defineType({
    name: 'diptychSpread',
    title: 'Diptych (Two Images)',
    type: 'object',
    fields: [
        defineField({
            name: 'photos',
            title: 'Photos',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'photo' }] }],
            validation: (Rule) => Rule.min(2).max(2),
        }),
        defineField({
            name: 'gap',
            title: 'Gap Size',
            type: 'string',
            options: {
                list: [
                    { title: 'None', value: 'none' },
                    { title: 'Small', value: 'small' },
                    { title: 'Medium', value: 'medium' },
                ],
            },
            initialValue: 'small',
        }),
    ],
    preview: {
        select: { media: 'photos.0.image' },
        prepare({ media }) {
            return { title: 'Diptych', media }
        },
    },
})

export const textImageSpread = defineType({
    name: 'textImageSpread',
    title: 'Text + Image',
    type: 'object',
    fields: [
        defineField({
            name: 'body',
            title: 'Body',
            type: 'array',
            of: [
                portableTextBody,
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
                        }),
                        defineField({
                            name: 'attribution',
                            title: 'Attribution',
                            type: 'string',
                        }),
                    ],
                }),
            ],
        }),
        photoRef,
        defineField({
            name: 'imagePosition',
            title: 'Image Position',
            type: 'string',
            options: {
                list: [
                    { title: 'Right', value: 'right' },
                    { title: 'Left', value: 'left' },
                ],
            },
            initialValue: 'right',
        }),
    ],
    preview: {
        select: { media: 'photo.image' },
        prepare({ media }) {
            return { title: 'Text + Image', media }
        },
    },
})

export const closingSpread = defineType({
    name: 'closingSpread',
    title: 'Closing',
    type: 'object',
    fields: [
        defineField({
            name: 'body',
            title: 'Body',
            type: 'text',
            rows: 4,
        }),
        photoRef,
    ],
    preview: {
        select: { title: 'body', media: 'photo.image' },
        prepare({ title, media }) {
            return {
                title: 'Closing',
                subtitle: title ? `${title.slice(0, 60)}…` : undefined,
                media,
            }
        },
    },
})

export const spreadLayoutTypes = [
    coverSpread,
    titleTextSpread,
    fullBleedSpread,
    diptychSpread,
    textImageSpread,
    closingSpread,
]

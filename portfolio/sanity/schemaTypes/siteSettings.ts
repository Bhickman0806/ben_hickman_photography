import { defineType, defineField } from 'sanity'

export const siteSettings = defineType({
    name: 'siteSettings',
    title: 'Site Settings',
    type: 'document',
    fields: [
        defineField({
            name: 'siteName',
            title: 'Site Name',
            type: 'string',
            initialValue: 'Ben Hickman Photography Portfolio',
        }),
        defineField({
            name: 'navLinks',
            title: 'Navigation Links',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        defineField({ name: 'label', type: 'string', title: 'Label' }),
                        defineField({ name: 'href', type: 'string', title: 'URL' }),
                    ],
                },
            ],
        }),
        defineField({
            name: 'footer',
            title: 'Footer Settings',
            type: 'object',
            fields: [
                defineField({ name: 'copyright', type: 'string', title: 'Copyright Text' }),
                defineField({
                    name: 'socialLinks',
                    type: 'object',
                    fields: [
                        defineField({ name: 'instagram', type: 'url' }),
                        defineField({ name: 'email', type: 'string' }),
                    ]
                }),
            ],
        }),
    ],
})

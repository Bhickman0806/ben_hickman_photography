import type { StructureResolver } from 'sanity/structure'

export const structure: StructureResolver = (S) =>
    S.list()
        .title('Content')
        .items([
            // Photos organized by Collection
            S.listItem()
                .title('Photos by Collection')
                .child(
                    S.documentTypeList('collection')
                        .title('Photos by Collection')
                        .child((collectionId) =>
                            S.documentList()
                                .title('Photos')
                                .filter('_type == "photo" && collection._ref == $collectionId')
                                .params({ collectionId })
                        )
                ),

            S.divider(),

            // All other document types (e.g., Pages, Essays, etc.)
            ...S.documentTypeListItems().filter(
                (listItem) => !['photo', 'collection'].includes(listItem.getId() as string)
            ),

            S.divider(),

            // Keep flat lists available for managing Collections themselves, or finding unassigned photos
            S.documentTypeListItem('collection').title('All Collections'),
            S.documentTypeListItem('photo').title('All Photos (Unorganized)'),
        ])

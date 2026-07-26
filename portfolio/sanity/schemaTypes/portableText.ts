/** Standard list types — numbered first so it leads the Studio toolbar. */
export const flatListTypes = [
  {title: 'Numbered', value: 'number'},
  {title: 'Bullet', value: 'bullet'},
] as const

type PortableTextBlock = {
  _type?: string
  level?: number
  listItem?: string
}

/**
 * Rejects nested Portable Text lists (level > 1).
 * Sanity's default editor may still allow indent; this blocks publishing.
 */
export function validateNoNestedLists(
  blocks: PortableTextBlock[] | undefined,
): true | string {
  if (!Array.isArray(blocks)) return true

  const hasNested = blocks.some(
    (block) =>
      block?._type === 'block' &&
      typeof block.level === 'number' &&
      block.level > 1,
  )

  return hasNested
    ? 'Nested lists are not supported. Keep every list item at the top level (do not indent).'
    : true
}

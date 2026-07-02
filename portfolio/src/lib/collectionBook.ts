export interface BookPhoto {
    title?: string;
    image?: any;
    alt?: string;
    slug?: string;
    location?: string;
    dateTaken?: string;
}

export type SpreadLayout =
    | 'coverSpread'
    | 'titleTextSpread'
    | 'fullBleedSpread'
    | 'diptychSpread'
    | 'textImageSpread'
    | 'closingSpread';

export interface BookSpread {
    _key: string;
    _type: SpreadLayout;
    overlayTitle?: string;
    heading?: string;
    subtitle?: string;
    body?: string | any[];
    caption?: string;
    gap?: 'none' | 'small' | 'medium';
    imagePosition?: 'left' | 'right';
    photo?: BookPhoto;
    photos?: BookPhoto[];
}

export interface CollectionBookData {
    title: string;
    subtitle?: string;
    description?: string;
    slug: string;
    spreads: BookSpread[];
}

const photoProjection = `{
    title,
    "image": image,
    "alt": image.alt,
    "slug": slug.current,
    dateTaken,
    location
}`;

export const spreadProjection = `
  _key,
  _type,
  overlayTitle,
  heading,
  subtitle,
  body,
  caption,
  gap,
  imagePosition,
  "photo": photo->${photoProjection},
  "photos": photos[]->${photoProjection}
`;

interface LegacyCollection {
    title: string;
    subtitle?: string;
    description?: string;
    slug: string;
    writeup?: any[];
    coverPhoto?: BookPhoto;
    photos?: BookPhoto[];
    spreads?: BookSpread[];
}

function generateKey(prefix: string, index: number) {
    return `${prefix}-${index}`;
}

export function buildSpreadsFromLegacy(collection: LegacyCollection): BookSpread[] {
    const spreads: BookSpread[] = [];

    if (collection.coverPhoto?.image) {
        spreads.push({
            _key: generateKey('cover', spreads.length),
            _type: 'coverSpread',
            overlayTitle: collection.title,
            photo: collection.coverPhoto,
        });
    }

    if (collection.description || collection.subtitle) {
        spreads.push({
            _key: generateKey('intro', spreads.length),
            _type: 'titleTextSpread',
            heading: collection.title,
            subtitle: collection.subtitle,
            body: collection.description,
        });
    }

    if (collection.writeup?.length) {
        spreads.push({
            _key: generateKey('writeup', spreads.length),
            _type: 'textImageSpread',
            body: collection.writeup,
            imagePosition: 'right',
        });
    }

    for (const photo of collection.photos || []) {
        if (!photo?.image) continue;
        spreads.push({
            _key: generateKey(photo.slug || 'photo', spreads.length),
            _type: 'fullBleedSpread',
            photo,
            caption: photo.alt || photo.title,
        });
    }

    if (spreads.length > 0) {
        spreads.push({
            _key: generateKey('closing', spreads.length),
            _type: 'closingSpread',
            body: 'End of collection',
        });
    }

    return spreads;
}

export function resolveCollectionSpreads(collection: LegacyCollection): BookSpread[] {
    if (collection.spreads?.length) {
        return collection.spreads.filter((spread) => Boolean(spread?._type));
    }
    return buildSpreadsFromLegacy(collection);
}

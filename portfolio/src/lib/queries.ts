import { client } from './sanity';
import { resolveCollectionSpreads, spreadProjection, type CollectionBookData } from './collectionBook';

export async function getSiteSettings() {
  const query = `*[_type == "siteSettings"][0]{
    siteName,
    navLinks,
    footer
  }`;
  return await client.fetch(query);
}

export async function getHomePage() {
  const query = `*[_type == "page" && slug.current == "/"][0]{
    heroHeading,
    "heroImages": heroImages[]->image,
    "featuredCollections": featuredCollections[@->isHidden != true]->{
      title,
      subtitle,
      description,
      "slug": slug.current,
      "image": coverPhoto->image,
      "alt": coverPhoto->alt
    }
  }`;
  return await client.fetch(query);
}

// Get all collection slugs for static paths
export async function getCollectionPaths() {
  const query = `*[_type == "collection" && defined(slug.current) && isHidden != true][].slug.current`;
  return await client.fetch(query);
}

// Get data for a specific collection (legacy shape)
export async function getCollectionData(slug: string) {
  const query = `*[_type == "collection" && slug.current == $slug && isHidden != true][0]{
    title,
    subtitle,
    description,
    writeup,
    "slug": slug.current,
    "coverPhoto": coverPhoto->{
      title,
      "image": image,
      "alt": image.alt,
      "slug": slug.current,
      dateTaken,
      location
    },
    "photos": photos[]->{
      title,
      "image": image,
      "alt": image.alt,
      "slug": slug.current,
      dateTaken,
      location
    },
    "spreads": spreads[]{
      ${spreadProjection}
    }
  }`;
  return await client.fetch(query, { slug });
}

// Get collection data shaped for the photo book view
export async function getCollectionBookData(slug: string): Promise<CollectionBookData | null> {
  const collection = await getCollectionData(slug);
  if (!collection) return null;

  return {
    title: collection.title,
    subtitle: collection.subtitle,
    description: collection.description,
    slug: collection.slug,
    spreads: resolveCollectionSpreads(collection),
  };
}
// Get all photo slugs for static paths
export async function getPhotoPaths() {
  const query = `*[_type == "photo" && defined(slug.current)][].slug.current`;
  return await client.fetch(query);
}

// Get data for a specific photo
export async function getPhotoData(slug: string) {
  const query = `*[_type == "photo" && slug.current == $slug][0]{
    title,
    "slug": slug.current,
    "image": image,
    "alt": image.alt,
    caption,
    location,
    dateTaken,
    tags,
    "relatedCollections": *[_type == "collection" && ^._id in photos[]._ref && isHidden != true]{
      title,
      "slug": slug.current
    }
  }`;
  return await client.fetch(query, { slug });
}

// Get all photos for the archive page
export async function getArchivePhotos() {
  const query = `*[_type == "photo"] | order(dateTaken desc) {
    title,
    "slug": slug.current,
    "image": image,
    "alt": image.alt,
    dateTaken,
    location
  }`;
  return await client.fetch(query);
}

// Get all essays and poems merged for the writing index, sorted by publishedAt desc
export async function getWritingIndex() {
  const essays = await client.fetch(`*[_type == "essay"] | order(publishedAt desc) {
    "type": "essay",
    title,
    "slug": slug.current,
    deck,
    publishedAt,
    readingTime,
    tags
  }`);

  const poems = await client.fetch(`*[_type == "poem"] | order(publishedAt desc) {
    "type": "poem",
    title,
    "slug": slug.current,
    form,
    location,
    publishedAt,
    tags
  }`);

  return [...essays, ...poems].sort((a: any, b: any) => {
    if (!a.publishedAt) return 1;
    if (!b.publishedAt) return -1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

// Get all essay slugs for static paths
export async function getEssayPaths() {
  return await client.fetch(`*[_type == "essay" && defined(slug.current)][].slug.current`);
}

// Get data for a specific essay
export async function getEssayData(slug: string) {
  return await client.fetch(`*[_type == "essay" && slug.current == $slug][0]{
    title,
    "slug": slug.current,
    deck,
    category,
    publishedAt,
    readingTime,
    tags,
    heroImage,
    body,
    "relatedEssays": relatedEssays[]->{
      title,
      "slug": slug.current,
      deck,
      "heroImage": heroImage
    }
  }`, { slug });
}

// Get all poem slugs for static paths
export async function getPoemPaths() {
  return await client.fetch(`*[_type == "poem" && defined(slug.current)][].slug.current`);
}

// Get data for a specific poem
export async function getPoemData(slug: string) {
  return await client.fetch(`*[_type == "poem" && slug.current == $slug][0]{
    title,
    "slug": slug.current,
    publishedAt,
    form,
    location,
    tags,
    epigraph,
    stanzas,
    poetsNote,
    "relatedPoems": relatedPoems[]->{
      title,
      "slug": slug.current,
      publishedAt,
      form
    }
  }`, { slug });
}

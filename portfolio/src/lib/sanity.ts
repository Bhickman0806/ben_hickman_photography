import { createClient } from "@sanity/client";
import createImageUrlBuilder from "@sanity/image-url";

export const client = createClient({
    projectId: "6xolgh7z",
    dataset: "production",
    useCdn: true,
    apiVersion: "2024-03-20",
});

const builder = createImageUrlBuilder(client);

export function urlFor(source: any) {
    return builder.image(source);
}

interface ImageParams {
    src: string;
    srcset: string;
    sizes: string;
}

export function getResponsiveProps(
    source: any,
    config: { width: number; aspectRatio?: number; sizes?: string }
): ImageParams {
    if (!source) return { src: '', srcset: '', sizes: '' };

    const builder = urlFor(source);
    const { width: baseWidth, aspectRatio, sizes = '100vw' } = config;

    let srcBuilder = builder.width(baseWidth);
    if (aspectRatio) {
        srcBuilder = srcBuilder.height(Math.round(baseWidth / aspectRatio));
    }
    const src = srcBuilder.url();

    // Generate srcset for 0.5x, 1x, 1.5x, 2x
    const widths = [baseWidth * 0.5, baseWidth, baseWidth * 1.5, baseWidth * 2]
        .map(Math.round)
        .filter(w => w < 2500); // Cap at 2500px

    const srcset = widths
        .map(w => {
            let b = builder.width(w);
            if (aspectRatio) {
                b = b.height(Math.round(w / aspectRatio));
            }
            return `${b.url()} ${w}w`;
        })
        .join(', ');

    return { src, srcset, sizes };
}

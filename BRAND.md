# Identité Atlas

## Direction

Monogramme géométrique compact, sobre et moderne. Une découpe nette apporte une légère touche futuriste. Aucun élément spatial, orbite, planète ou étoile.

Le logo de l’interface assemble le symbole avec le nom Atlas en texte HTML, lisible et adapté aux thèmes clair/sombre. Les icônes fonctionnelles utilisent toujours Lucide.

## Fichiers

- `design/atlas-source.png` : master raster créé avec le moteur Imagegen intégré.
- `apps/web/public/brand/atlas-mark.png` : symbole optimisé pour le header.
- `apps/web/public/brand/atlas-icon-192.png` et `atlas-icon-512.png` : icônes du manifeste.
- `apps/web/app/favicon.ico` : icônes navigateur 16/32 px.
- `apps/web/app/icon.png` : icône navigateur 48 px.
- `apps/web/app/apple-icon.png` : icône Apple 180 px.
- `apps/web/components/atlas-logo.tsx` : composition du logo dans l’interface.

Les dérivés sont des conversions de taille/format du master. Régénération : `pnpm --filter @atlas/web icons`.

## Brief Imagegen

« Create one final minimal modern logo symbol for Atlas, a professional developer tools app. A compact abstract architectural monogram inspired by capital A: two balanced thick geometric uprights with a precise diagonal negative-space cut. Restrained Swiss graphic design, contemporary software brand, a subtle futuristic feeling through precise geometry only. Extremely simple, recognizable silhouette legible at favicon size. Flat off-white symbol centered on an opaque uniform anthracite square #191b1f. Symbol occupies 65 percent of square. Two or three clean polygonal shapes maximum. No orbit, planets, stars, solar system, space imagery, rings, satellites, rocket or sphere. No decorative elements, gradients, lighting, texture, shadows, neon, outlines, mockup or wordmark. One polished square icon with crisp clean edges. »

Passe de finition Imagegen : « Keep the geometry and arrangement. Eliminate ragged edges, halos, outlines, shading and stray pixels. Solid flat off-white polygons, crisp edges, opaque uniform anthracite #191b1f background. No additional elements. Preserve the understated architectural abstract A. »

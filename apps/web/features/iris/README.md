# Iris — Cartographie du SI

Premier périmètre : inventaire visuel manuel des services, zones imbriquées, flux dirigés documentés. Références de conception : [C4 — System Landscape](https://c4model.com/diagrams/system-landscape), [groupes Structurizr](https://docs.structurizr.com/dsl/cookbook/), [catalogue infrastructure draw.io](https://icons.diagrams.net/sets/infrastructure).

Le canvas est une cartographie libre inspirée de ces usages, pas une implémentation certifiée C4 ou ArchiMate. Pas de découverte automatique, de synchronisation cloud ou de supervision réelle.

Projet en mémoire navigateur. Enregistrer via Projet ou Ctrl+S produit un fichier `.atlas.json` : enveloppe `atlas-iris`, version 1, validation Zod et intégrité des références à l’import. Les fichiers Athena ne sont pas interchangeables. Limites : 500 composants/zones, 2 000 flux, 5 Mo à l’import, huit niveaux de zones. Annuler/rétablir : 60 opérations.

Déplacement d’une zone par son titre, redimensionnement par ses poignées. Glisser un service entièrement dans une zone le rattache ; le sortir le détache. Le choix de zone dans les propriétés permet aussi l’imbrication. Dissoudre une zone conserve ses services et ses flux. Organiser réagence récursivement le contenu des zones.

PNG et SVG partagent un rendu vectoriel local, avec les logos embarqués. Le fichier exporté est indépendant du zoom du canvas ; les exports PNG sont plafonnés à 8 192 px par côté et 24 mégapixels. Les noms très longs sont tronqués dans l’image, conservés intégralement dans le JSON. Le routage orthogonal n’évite pas encore tous les obstacles sur des cartes denses.

Catalogue : 44 entrées dans 11 familles, dont 31 logos de marque (neuf issus des éditeurs et 22 distribués par Devicon), attributions dans `public/iris/logos/README.md`. Aucun import depuis les internals d’Athena.

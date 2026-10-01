# Hestia — Atelier de design system

Hestia aide à poser les fondations visuelles d’un site avant les maquettes et le code. L’outil fonctionne entièrement dans le navigateur : aucune IA, aucun compte et aucun contenu envoyé à un service externe.

La bibliothèque propose douze palettes, cinq directions complètes (Minimal, Éditorial, Produit, Structure, Organique), trois familles typographiques réellement distinctes, une densité, des arrondis et trois niveaux d’ombre. Les réglages se reflètent dans les composants, une page exemple et une planche de fondations. L’interface Atlas conserve ses couleurs neutres.

Les couleurs de marque claire et sombre sont indépendantes. Chaque rôle peut être personnalisé dans chaque thème, puis réinitialisé. Une gamme de onze nuances et des harmonies analogue, complémentaire et triadique sont calculées localement. Les nuances sont des interpolations sRGB, pas des gammes perceptuellement uniformes ni une garantie de contraste.

Les couleurs sont utilisées par rôles (`background`, `surface`, `foreground`, `muted`, `border`, `brand`) afin de pouvoir changer de thème sans recolorer chaque composant à la main. Le contrôle de contraste compare le texte principal, le texte secondaire et l’action principale avec le seuil AA de 4,5:1 pour le texte courant. Le résultat reste un contrôle automatisé à confirmer dans le contexte réel.

Les fondations sont exportables en CSS (deux thèmes, gamme de marque, espacements), JSON de tokens et page HTML autonome. Ce JSON de tokens est un format d’intégration Hestia, distinct du fichier projet ; il ne revendique pas la conformité DTCG. L’HTML reprend les fondations et des composants exemples, sans reproduire pixel pour pixel la planche d’édition. Les polices système varient selon l’appareil ; IBM Plex doit être installé ou auto-hébergé par le site destinataire.

Le projet `atlas-hestia` version 2 conserve tous les réglages ; la version 1 reste importable. Validation des noms de palette, couleurs hexadécimales, clés et limites numériques. Import limité à 1 Mo, confirmation intégrée avant remplacement, avertissement à la fermeture et menus fermés au clic extérieur. Les projets restent en mémoire : utiliser Projet → Enregistrer avant de quitter.

Les choix de tokens et de contraste s’inspirent des recommandations publiques de [USWDS sur les design tokens et les rôles de couleur](https://designsystem.digital.gov/design-tokens/color/overview/), de [Carbon sur les tokens sémantiques et les couches](https://www.carbondesignsystem.com/building-blocks/foundations/color/tokens) et de [USWDS sur l’accessibilité visuelle](https://designsystem.digital.gov/documentation/accessibility/). Hestia ne reprend pas leurs composants ni leurs marques ; ces références servent à structurer l’outil.

La séparation entre palette et rôles suit aussi les principes de [composition Radix Colors](https://www.radix-ui.com/colors/docs/palette-composition/composing-a-palette). Les seuils affichés proviennent du [W3C WCAG](https://www.w3.org/TR/WCAG22/) : 4,5:1 pour le texte courant, 3:1 pour l’indicateur de focus contre la surface. Huit couples sont contrôlés ; ni les variations de vision, ni tous les états possibles, ni la page entière ne sont certifiés.

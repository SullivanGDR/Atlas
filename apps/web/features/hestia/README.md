# Hestia — Atelier de design system

Hestia aide à poser les fondations visuelles d’un site avant les maquettes et le code. L’outil fonctionne entièrement dans le navigateur : aucune IA, aucun compte et aucun contenu envoyé à un service externe.

La bibliothèque propose quatre palettes de départ, une couleur de marque personnalisable, trois bibliothèques typographiques, une échelle d’espacement, des arrondis et trois niveaux d’ombre. Chaque choix est projeté dans une planche de composants : action, champ, carte et hiérarchie de texte.

Les couleurs sont utilisées par rôles (`background`, `surface`, `foreground`, `muted`, `border`, `brand`) afin de pouvoir changer de thème sans recolorer chaque composant à la main. Le contrôle de contraste compare le texte principal, le texte secondaire et l’action principale avec le seuil AA de 4,5:1 pour le texte courant. Le résultat reste un contrôle automatisé à confirmer dans le contexte réel.

Les fondations sont exportables en CSS et en projet `atlas-hestia` version 1. Le JSON permet de reprendre l’édition ; le CSS contient les tokens clairs et sombres, la typographie, l’échelle, les arrondis et l’ombre. Les projets restent dans les fichiers de l’utilisateur et en mémoire navigateur.

Les choix de tokens et de contraste s’inspirent des recommandations publiques de [USWDS sur les design tokens et les rôles de couleur](https://designsystem.digital.gov/design-tokens/color/overview/), de [Carbon sur les tokens sémantiques et les couches](https://www.carbondesignsystem.com/building-blocks/foundations/color/tokens) et de [USWDS sur l’accessibilité visuelle](https://designsystem.digital.gov/documentation/accessibility/). Hestia ne reprend pas leurs composants ni leurs marques ; ces références servent à structurer l’outil.

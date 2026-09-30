# Thémis — Cahier des charges

Thémis, associée à l’ordre et aux règles communes, accompagne le cadrage d’un projet. Le module reste indépendant des internals d’Athena et d’Iris.

## Rédaction

Quatre trames (générique, application web, site vitrine, infrastructure SI), quinze rubriques réordonnables, rubriques libres et exclusions explicites. Questions et exemples restent hors du document ; l’insertion d’une trame introduit des champs « À préciser », détectés par la relecture. Texte simple, `**gras**`, listes `- ` et sous-titres `## ` ; aucune exécution de HTML.

Exigences identifiées durablement, typologie, priorisation MoSCoW en français, justification, responsable, statut et critères de recette. Les contrôles déterministes signalent champs vides, marqueurs à compléter et quelques qualificatifs ambigus. Ils ne certifient pas la qualité, la faisabilité, la conformité ou l’accord des parties prenantes. Pas de génération par IA ni de service payant.

Projet en mémoire ; fichier `atlas-themis` version 1 avec métadonnées, rubriques et exigences. Limites : 50 rubriques, 300 exigences, 40 000 caractères par champ long, import de 5 Mo maximum. Historique de session de 60 opérations, frappe regroupée par champ. Aucun compte ni base de données.

## Export

DOCX OOXML natif produit localement avec `fflate` : styles Word, paragraphes, listes, tableaux à en-tête répété, références internes du sommaire et champ de pagination. Aucun HTML importé, police distante ou zone de texte flottante. Papier Letter par défaut, A4 disponible. Page de garde séparée, sommaire et inclusion des rubriques vides sont configurables. Le sommaire est un instantané cliquable sans numéros de page ; il ne se met pas à jour automatiquement après édition externe.

Le bouton Google Docs télécharge ce même DOCX et explique l’import/conversion par Google Drive. Il ne crée pas de document dans un compte Google et ne transmet aucune donnée. Les styles standards favorisent l’interopérabilité ; la pagination et les retours à la ligne peuvent changer lors d’une conversion. L’aperçu web est structurel, pas un moteur de pagination Word. Le DOCX est un livrable ; le JSON permet de reprendre l’édition dans Thémis. Import DOCX/Google Docs non implémenté.

## Références de conception

- [NASA — How to Write a Good Requirement](https://www.nasa.gov/reference/appendix-c-how-to-write-a-good-requirement/) : exigences précises, vérifiables, identifiables et formulation non ambiguë.
- [Atlassian — Product requirements](https://www.atlassian.com/software/confluence/templates/product-requirements) : contexte, objectifs, hypothèses, priorités et décisions explicites.
- [Google — Travailler avec des fichiers Microsoft Office](https://support.google.com/docs/answer/9406611?hl=fr) : ouverture et conversion des fichiers Office.

Synthèse adaptée aux projets numériques, sans reproduction de leurs modèles et sans prétendre à une conformité formelle à un standard d’ingénierie.

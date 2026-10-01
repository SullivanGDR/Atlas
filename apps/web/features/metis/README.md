# Métis — Atelier de prompts

Outil autonome de rédaction, sans appel à un modèle, compte ou stockage serveur. Six usages (sur mesure, développement, rédaction, recherche, analyse, design) adaptent les exemples ; changer d’usage ne remplace jamais le contenu.

Neuf rubriques : objectif, contexte, périmètre, exemples attendus, données, contraintes, format, critères de réussite et incertitudes. Le générateur conserve toutes les rubriques renseignées en mode détaillé et compact ; ce dernier allège seulement les titres. Les données et exemples de référence sont isolés dans un bloc Markdown dont la clôture s’adapte aux backticks du contenu. Cette séparation est une aide de lecture, pas une garantie contre l’injection de prompt dans un modèle externe.

Le panneau « Consignes de réalisation » ajoute, à la demande, des instructions explicites pour la cible (assistant ou agent), le mode de travail (livrable ou plan), les informations manquantes, la méthode, les vérifications et le compte rendu final. Le mode agent demande seulement les actions possibles avec les outils réellement disponibles ; il ne simule pas un accès absent. Les consignes désactivées ne sont pas exportées et une consigne personnalisée dans « Incertitudes » prend priorité sur le réglage générique.

La relecture heuristique signale les rubriques essentielles absentes, placeholders, certains qualificatifs vagues et deux contradictions explicites. Faux positifs possibles ; aucun score de qualité ou promesse d’optimalité. L’utilisateur choisit et vérifie les exemples insérés.

Quatre blocs suggérés et jusqu’à cinquante blocs personnels, insérables dans leur rubrique. La bibliothèque personnelle voyage dans le fichier projet ; elle n’est pas enregistrée entre les sessions sans export. Annuler/rétablir conserve soixante étapes avec regroupement de la frappe. Ctrl+S exporte le projet depuis l’espace de travail ; les raccourcis natifs des champs restent disponibles.

Format `atlas-metis`, version 2, validé par Zod ; la version 1 est migrée sans activer automatiquement les nouvelles consignes. Limites : 30 000 caractères par champ et bloc, 50 blocs, import de 8 Mo maximum. Les imports d’autres outils et les identifiants dupliqués sont refusés. Les modifications non enregistrées déclenchent une confirmation avant remplacement et l’avertissement natif à la fermeture de l’onglet.

Copie du prompt, exports Markdown et texte ; le JSON conserve les rubriques, les consignes et la bibliothèque pour reprendre l’édition. Aucun import Markdown ou texte vers les rubriques. Interface à deux colonnes sur grand écran et vues rédaction/aperçu sous 950 px, palette Atlas claire et sombre.

La sortie est un cadre de travail plus explicite, pas une mesure de performance ni une garantie d’exécution identique selon le modèle utilisé. La relecture reste heuristique et les contrôles doivent être confirmés dans l’environnement réel.

Les principes de conception suivent les recommandations publiques de [Google sur les instructions, le contexte et le format de sortie](https://ai.google.dev/gemini-api/docs/prompting-strategies) et d’[Anthropic sur la sélection du contexte et les critères de réussite](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents). Ces sources orientent l’interface ; Métis n’appelle aucun de ces services.

# Métis — Atelier de prompts

Outil autonome de rédaction, sans appel à un modèle, compte ou stockage serveur. Six usages (sur mesure, développement, rédaction, recherche, analyse, design) adaptent les exemples ; changer d’usage ne remplace jamais le contenu.

Sept rubriques : objectif, contexte, données, contraintes, format, critères de réussite et incertitudes. Le générateur conserve toutes les rubriques renseignées en mode détaillé et compact ; ce dernier allège seulement les titres. Les données de référence sont isolées dans un bloc Markdown dont la clôture s’adapte aux backticks du contenu. Cette séparation est une aide de lecture, pas une garantie contre l’injection de prompt dans un modèle externe.

La relecture heuristique signale les rubriques essentielles absentes, placeholders, certains qualificatifs vagues et deux contradictions explicites. Faux positifs possibles ; aucun score de qualité ou promesse d’optimalité. L’utilisateur choisit et vérifie les exemples insérés.

Quatre blocs suggérés et jusqu’à cinquante blocs personnels, insérables dans leur rubrique. La bibliothèque personnelle voyage dans le fichier projet ; elle n’est pas enregistrée entre les sessions sans export. Annuler/rétablir conserve soixante étapes avec regroupement de la frappe. Ctrl+S exporte le projet depuis l’espace de travail ; les raccourcis natifs des champs restent disponibles.

Format `atlas-metis`, version 1, validé par Zod ; limites : 30 000 caractères par champ et bloc, 50 blocs, import de 8 Mo maximum. Les imports d’autres outils et les identifiants dupliqués sont refusés. Les modifications non enregistrées déclenchent une confirmation avant remplacement et l’avertissement natif à la fermeture de l’onglet.

Copie du prompt, exports Markdown et texte ; le JSON conserve les rubriques et la bibliothèque pour reprendre l’édition. Aucun import Markdown ou texte vers les rubriques. Interface à deux colonnes sur grand écran et vues rédaction/aperçu sous 950 px, palette Atlas claire et sombre.

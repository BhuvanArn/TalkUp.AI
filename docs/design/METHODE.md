# Méthode de design TalkUp

Ce guide transmet ce que le séminaire UI/UX du 6 novembre 2026 nous a appris, pour que chaque ajout au site soit **designé**, même sans designer dans l'équipe. Il s'adresse aux humains. Les agents de code suivent la même méthode via le skill `.agents/skills/talkup-design/` (voir `AGENTS.md`).

La designer du séminaire faisait trois choses que nous ne faisions pas :

1. **Se mettre à la place de l'utilisateur et oser proposer.** Elle ne s'est pas contentée de polir la bulle du chatbot : elle a remis en cause le concept (« ça fait support des années 2010 ») et proposé Tali, un assistant en colonne qui agit.
2. **Mesurer.** « Entre email et password c'est trop grand. Le 24px, généralement c'est soit 16 ou 20. »
3. **Avoir du goût.** « La rondeur des boutons fait très IA slop. » « Éviter les éléments décoratifs sans réelle valeur ajoutée. »

La méthode transforme ces trois réflexes en étapes.

## Sommaire

1. La règle d'or
2. Qui fait foi : Figma ou code ?
3. Les sept étapes
4. Faire des pistes
5. Mesurer
6. Les 15 signes qui font « IA »
7. Les ressources, et quand s'en servir
8. Avant de merger une PR UI

## 1. La règle d'or

**Pas de code d'UI avant d'avoir choisi entre des pistes visuelles.** Toujours, même pour une petite retouche : « on ne sait jamais ce qu'on peut louper en se disant juste "c'est rapide à faire" ». Seule la profondeur change :

| Taille | Pistes |
|---|---|
| Retouche (un lien, un bouton, un champ) | 2 variantes, posées dans une capture recadrée de l'écran réel |
| Nouvelle fonctionnalité : un nouvel écran ou parcours, de nouvelles données ou une nouvelle route d'API, ou un élément « Maquette » du registre Figma | 3 pistes qui diffèrent sur une **décision** : une sûre (la convention bien faite), une « TalkUp » (identité du séminaire), une tournée vers l'avenir |

Si la tâche correspond à un élément du registre Figma, la piste A est la décision Figma appliquée à l'écran actuel. Les autres pistes peuvent s'en écarter, en le signalant : l'écart demande l'accord de la designer.

## 2. Qui fait foi : Figma ou code ?

- Un élément listé dans [`figma-backlog.md`](figma-backlog.md) (validé au séminaire, pas encore codé) suit le **Figma** « TalkUp — App & Design System ». La PR qui l'implémente le retire du registre.
- Tout le reste suit le **code** : les tokens de `web/src/styles/tailwind.css` (ils gagnent toujours), puis `web/DESIGN.md`. Le Figma n'est plus maintenu pour ces éléments.
- Besoin d'une valeur sans token ? On propose un token (nom, valeur claire, valeur sombre, contraste) et on l'ajoute seulement après accord. Jamais de couleur en dur.

## 3. Les sept étapes

| # | Étape | Ce qu'on produit |
|---|---|---|
| 0 | **Cadrer** | Des captures de l'écran actuel (clair, sombre, 1440 et 390 px), puis en une ligne chacun : le type d'écran (outil, vitrine ou lecture), l'utilisateur, la tâche principale de l'écran, **le concept remis en question** (« est-ce le bon élément, ou l'utilisateur a-t-il besoin d'autre chose ? »), les éléments du registre Figma concernés. |
| 1 | **Références** | Des produits réels qui ont résolu le problème, avec pour chacun ce qu'on garde et ce qu'on laisse. Les principes et citations du séminaire qui s'appliquent. |
| 2 | **Pistes** | Une page de pistes (voir §4), en FR et EN, en clair et en sombre, avec une recommandation et les questions bloquantes. |
| 3 | **Choisir** | L'équipe regarde les pistes et choisit, ou mélange. On note le choix dans la page. |
| 4 | **Implémenter** | La piste choisie, avec les composants et tokens existants, clés i18n en `en` et `fr`. |
| 5 | **Mesurer** | Espacements, typo, contraste, cibles, focus, mouvement (§5). |
| 6 | **Critiquer** | Captures en 1440 et 390 px, clair et sombre, FR et EN. Critique à la manière de la designer : l'élément, la mesure ou l'observation, pourquoi ça gêne l'utilisateur, une proposition. |

## 4. Faire des pistes

**Avec un agent :** il génère la page de pistes et la remplit.

**À la main :**
```bash
node .agents/skills/talkup-design/scripts/new-pistes.mjs <slug> --title "<titre>" --count 2   # ou 3
```
La page `docs/design/pistes/<slug>/index.html` s'ouvre dans n'importe quel navigateur, sans outil. Elle reprend les vrais tokens de l'app. On peut aussi travailler dans Figma et coller les captures dans la page.

**Remplir chaque piste, une phrase par case** (la page doit se lire en cinq minutes) :
- **Intention** : ce que la piste cherche à faire pour l'utilisateur.
- **Idée forte** : l'unique élément audacieux de l'écran ; tout le reste est calme.
- **Références** : liens vers des produits réels, avec ce qu'on en retient.
- **Lois UX** : par exemple proximité, Fitts, Hick (voir `.agents/skills/talkup-design/references/ux-laws.md`).
- **États et mesures** : les chiffres mesurés sur la maquette (contrastes, tailles de cibles, écarts) et les états montrés.
- **Compromis** : ce que la piste sacrifie.
- **Écarts Figma ↔ code** : les éléments du registre concernés.

Puis, en bas de page : la **recommandation** (quelle piste et pourquoi, en deux phrases), les **questions bloquantes** (données, back, produit), et le **choix de l'équipe** une fois décidé.

La maquette utilise un contenu réel à la bonne longueur (« Ingénieur logiciel backend (Go) chez Qonto », 42 candidatures), la même personne et les mêmes données dans toutes les pistes, dans les deux langues. On commence par le français, qui est plus long. On montre aussi les cas vide, erreur et débordement. Pour les moments émotionnels (vide, blocage, réussite), une illustration simple ou un emplacement qui la décrit, jamais un emoji.

Outils utiles :
```bash
node .agents/skills/talkup-design/scripts/capture.mjs http://localhost:8081/<route> --out context.png --clip "<sélecteur>" --theme dark
node .agents/skills/talkup-design/scripts/fr-typo.mjs docs/design/pistes/<slug>/index.html   # espaces insécables du français
```

**Lire une page de pistes :** elle s'ouvre sur une piste à la fois, en pleine largeur. `←` `→` passent d'une piste à l'autre, `V` les met côte à côte, `T` bascule le thème, `L` la langue, `O` la vue organisation.

## 5. Mesurer

Les normes, avec leurs sources, sont dans `.agents/skills/talkup-design/references/craft-rules.md`. Les plus fréquentes :

| Quoi | Norme |
|---|---|
| Label → champ | 4–8 px |
| Champ → champ | **16–20 px** |
| Dernier champ → bouton principal | **32 px** (jamais moins que l'écart entre champs) |
| Groupes | l'écart entre groupes vaut au moins 1,5 × l'écart dans un groupe |
| Valeurs d'espacement | multiples de 4 px |
| Tailles de texte par écran | 8 au plus (viser 5–6) |
| Longueur de ligne | 45–75 caractères |
| Contraste du texte | ≥ 4,5:1 (3:1 au-dessus de 24 px) |
| Contour d'un champ, anneau de focus | ≥ 3:1 |
| Cibles cliquables | ≥ 24 × 24 px, 44 px au doigt |
| Animations | 100–200 ms pour un survol ou un clic, 200–400 ms pour un panneau |

**Avec l'outil** (l'app doit tourner, `VITE_PORT=8081 npm run dev:web`) :
```bash
node .agents/skills/talkup-design/scripts/run-audit.mjs http://localhost:8081/login --themes light,dark --width 1440,390 --axe
node .agents/skills/talkup-design/scripts/tells.mjs --diff origin/staging
```
Le premier rend des constats chiffrés, du type « Gap between #email and #password is 12px; norm 16–20px ». Le second repère dans les lignes ajoutées les signes qui font « IA ».

**À la main :** dans les DevTools, sélectionnez un élément et lisez le panneau *Computed* (boîte, marges), ou comparez `$0.getBoundingClientRect()` de deux éléments. Pour le contraste, utilisez le sélecteur de couleur des DevTools, l'extension Assistant RGAA ou Lighthouse.

## 6. Les 15 signes qui font « IA »

1. Dégradés, texte en dégradé, halos colorés.
2. Violet ou indigo par défaut.
3. Boutons en pilule (« la rondeur des boutons fait très IA slop »).
4. Trop de tailles et de graisses de texte (« trop de variantes de typo créées par l'IA »).
5. Petits sur-titres en MAJUSCULES espacées au-dessus de chaque titre.
6. Trois cartes identiques avec une icône en haut, répétées partout.
7. Des cartes dans des cartes.
8. Des emojis ou des icônes ✨ / ⚡ / 🚀 en guise de décoration.
9. Une flèche « → » sur chaque bouton.
10. Une numérotation 01 / 02 / 03 sur ce qui n'est pas une suite.
11. Des ombres décalées, du verre dépoli, des blobs décoratifs.
12. Des mots creux : « booster », « révolutionner », « sans effort », « propulsé par l'IA », « unlock », « seamless ».
13. Du contenu factice : lorem ipsum, John Doe, chiffres ronds.
14. Le même espacement partout, sans groupes.
15. Une bulle de chat flottante qui recouvre la page.

Le test final : **cachez le logo. Est-ce que ça pourrait être n'importe quel SaaS IA ?** Si oui, qu'est-ce qui rend l'écran propre à TalkUp ?

La liste complète, avec ce qu'il faut faire à la place : `.agents/skills/talkup-design/references/ai-tells.md`.

## 7. Les ressources, et quand s'en servir

| Étape | Ressources |
|---|---|
| Cadrer | NN/g (nngroup.com, en partant du « study guide » du sujet), UX Myths, growth.design/psychology (biais cognitifs) |
| Références (écrans d'app) | Refero, Mobbin (payants), AI UX Playground (gratuit, la référence pour Tali), UI-Patterns, les produits qu'on utilise (Linear, Notion, Airtable, Google Agenda, Welcome to the Jungle) |
| Références (vitrine, landing) | Awwwards, Httpster, Siteinspire, Behance, Dribbble, Collect UI, Designspiration, Muzli |
| Pistes | Laws of UX (lawsofux.com), UI-Patterns |
| Accessibilité | design.numerique.gouv.fr (« design.gouv » : checklist formulaires, checklist dev, Diagnostic Flash), RGAA, Ara, Lighthouse |
| Pour s'entraîner l'œil | Basti UI (Twitch, YouTube), Cléa Cassutti (Instagram, LinkedIn), The Cacatoès Theory (LinkedIn, Instagram) |

Détail par ressource : `.agents/skills/talkup-design/references/resources.md`. Matière brute du séminaire : [`research/`](research/).

## 8. Avant de merger une PR UI

- [ ] La page de pistes est commitée dans `docs/design/pistes/<slug>/`, avec le choix de l'équipe noté (quelle piste, quand, qui).
- [ ] La PR contient les captures en clair et sombre, à 1440 et 390 px.
- [ ] Testé en FR et en EN ; toutes les clés i18n existent dans les deux langues.
- [ ] Mesures : aucun échec de contraste, de cible ou de focus ; écarts de formulaire 16–20 / 32 px.
- [ ] Aucune couleur en dur, aucun bouton pilule, aucun signe « IA » non justifié.
- [ ] Tous les états sont couverts : survol, focus, désactivé, chargement, vide, erreur, succès.
- [ ] Si un élément du registre Figma est implémenté, il en est retiré.
- [ ] Clair, sombre et vue organisation vérifiés pour toute UI persistante.

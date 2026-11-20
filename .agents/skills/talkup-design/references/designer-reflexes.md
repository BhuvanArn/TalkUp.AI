# Designer reflexes

**Read this when:** critiquing a piste or an implementation (phases 2 and 6), and whenever you hesitate on a detail.
**What it is:** the designer's own comments from the 2026-11-06 seminar (Figma page "Avant / Après"), verbatim in French, grouped by theme, each with the rule it implies. They show *how she looks*: from the user's seat, with a ruler, and with taste.
**Source:** `docs/design/research/figma-avant-apres-texts.txt` (all annotations). Screen codes refer to `docs/design/research/research-seminar-lessons.md`.

Use them as a checklist of questions: for each group, ask "would she say this about my screen?"

## Contents
1. Concept and the user's seat
2. Spacing and density
3. Colour and contrast
4. Shape, type and decoration ("ça fait IA")
5. Illustrations and icons
6. The assistant
7. Data, scale and lists
8. Copy and explanation
9. Mobile
10. How she gives feedback

## 1. Concept and the user's seat

| Quote | Rule |
|---|---|
| « le faire faire des actions sur le site à la place de l'utilisateur » | Question what an element is for. A support chat that only answers is 2010; an assistant that acts is now. |
| « ou dans une collapse bar à droite » / « c'est surtout que la sidebar que tu as proposée fait qu'il y a du contenu de perdu derrière » | A panel must never hide the content the user is working on: push, don't cover. |
| « la landing interactive n'est pas forcément bien pour le hero, peut-être plus utilisable dans une landing de teasing comme une opération de com. Par contre ça plaît pour des jurys marketing/com » | Put each idea where it serves its audience; a good idea in the wrong place is still wrong. |
| « flouter les infos clés et s'ils veulent avoir ces infos-là ils doivent créer un compte » | Show real value, withhold the key part: tease, don't tour. |
| « manque un retour quand on est dans les détails d'une application » | Every detail page needs a way back. Walk the path, not the screen. |
| « c'est très bien mais peut-être ne pas l'activer quand on a moins de 3 applications » | Features earn their place by scale: hide tools that make no sense yet. |
| « ça devient commun que des gens postulent à plusieurs dizaines d'offres » / « quand quelqu'un postule à 3 offres chez la même entreprise » | Design for the real volume and the edge case (same company, many offers). |
| « Notre parti pris pourrait être que simulations ne doit être qu'avec pc car personne en entretien ne va se balader en tenant son téléphone » | Take a position grounded in the real-world situation, and say it honestly in the UI. |
| « permettre à l'utilisateur de modifier le nom d'une application pour faire quelque chose de custom » | Let users own generated content (rename, keep the original visible). |
| « Inspiration : airtable pour kanban / workflow » / « voilà aussi un screenshot de l'assistant d'airtable » | She starts from real products. So do you: references before drawing. |

## 2. Spacing and density

| Quote | Rule |
|---|---|
| « sauf entre les input, genre entre email et password c'est trop grand. (Le 24px, généralement c'est soit 16 ou 20) » | Field-to-field gap 16–20 px. Measure it; don't eyeball it. |
| « Aérer un peu plus comme entre "Forgot password" et le bouton primaire » | The primary action gets more space above it than the fields have between them (32 px). |
| « Aérer le dessus, on a fait une belle marge autour donc lecture fastidieuse » | Big margins around a block and cramped inside it make reading tiring. Inner and outer spacing are designed together. |
| « l'espacement est bien mieux » | Spacing is the first thing she checks, and the first thing that improves a screen. |
| « L1 : l'illustration flottante touche les boutons au-dessus visuellement, donc un peu d'espace serait cool » | Nothing touches visually unless it belongs together (proximity). |
| « les talking points c'est mieux à droite mais maintenant on a trop de place en bas donc peut-être déplacer ça en dessous de la roadmap » | Look at the whole page after each move: fixing one zone can leave a hole elsewhere. |
| « le bloc bleu foncé du carousel est trop voyant et cache le reste de la page, sa marge est aussi » | One block must not dominate a page it doesn't own. |

## 3. Colour and contrast

| Quote | Rule |
|---|---|
| « Boutons désactivé : on voit pas le texte dedans, le gris est trop foncé » | Disabled is still readable (≥ 4.5:1). No grey-on-grey. |
| « Peux-tu regarder le contraste du texte ? la carte "New" de la navbar ou certains textes du board ont l'air trop sombre » | Check contrast with numbers, in both themes. |
| « le mot "Organisation" en vert au-dessus du nom de l'org ça fait attirer l'oeil pour un texte pas interactif, donc plus en gris » | Colour attracts the eye: reserve it for what is interactive or meaningful. |
| « donc avoir du vert ne rappelant pas de la validation, donc peut-être du vert foncé » / « aussi enlever le vert "Talkup Demo school" de la navbar pour une autre couleur » | Green means success. A brand green must not read as "validated". |
| « si on veut garder les CTA bleu avec texte noir, vaut mieux passer le noir du bg en bleu très très foncé » | In dark mode, tint the background toward the brand (navy), don't use black. |
| « "pastellifier" ces couleurs-là » | On dark, saturated colours vibrate: go pastel. |
| « peut-être la sidebar est un peu trop grise » | Chrome stays quiet but not dull: light surface + hairline, not a grey block. |
| « la couleur de hover des applications quand on cherche est trop forte » | Hover is a hint, not a selection. |
| « Ajouter un léger glow bleu très clair sous le microphone en mode sombre » / « le glow discret ne serait pas vraiment sur le bouton mais sur des grands titres … car les boutons sont déjà assez voyants » | Glow is for large titles and illustrations in dark mode, never on things that are already loud. |

## 4. Shape, type and decoration ("ça fait IA")

| Quote | Rule |
|---|---|
| « la rondeur des boutons fait très IA slop et je pense n'est pas généralisé avec les autres boutons du site » | Pill buttons read as AI default. One radius for all buttons (8 px). |
| « attention aux typos à ne pas avoir trop de variantes de typo différentes créé par l'IA » | Few type variants. AI output multiplies sizes and weights; cut them. |
| « Supprimer l'ombre décalée si elle n'apporte rien visuellement. Ou créer une nouvelle ombre avec un effet Layer Blur » | Every effect must earn its place; offset shadows rarely do. |
| « attention à habiller une page avec du texte en background » | Text used as background decoration hurts reading and looks generated. |
| « Éviter les éléments décoratifs sans réelle valeur ajoutée » | If removing it loses nothing, remove it. |

## 5. Illustrations and icons

| Quote | Rule |
|---|---|
| « Conserver les icônes fonctionnelles plutôt que de chercher à les rendre illustratives » | Functions get icons. |
| « Éviter les illustrations qui ressemblent à de simples stickers » | Illustrations have volume, intention and fit the brand. |
| « Adapter les couleurs des illustrations pour assurer leur visibilité en mode clair et sombre » | Check every illustration in both themes. |
| « les illustrations du héro sont bizarres sauf pour les 4 points et peut-être enlever les numéros pour mettre ces 4 points » | Spot illustrations beat ordinal numerals (01/02/03). |
| « on pourrait faire en sorte que le bouton sélectionné serait celui avec un picto différent » | Selection can be shown by the icon itself (filled vs outline). |

## 6. The assistant

| Quote | Rule |
|---|---|
| « Conserver l'assistant accessible directement depuis la sidebar. Remplacer la bulle actuelle par une petite icône personnalisée » | The assistant is a first-class place in the nav, not a floating widget. |
| « Donner éventuellement un nom à l'assistant pour renforcer son identité » | A name and an avatar give it a personality (Tali). |
| « on revient aux smiley, on a ajouté un layer "Avatar bot" avec des états » | The avatar has states (idle, thinking, acting, happy). |
| « ajouter la petite bordure entre la nav et l'assistant comme dans G1 point 3 » | Separate regions with a hairline, consistently. |

## 7. Data, scale and lists

| Quote | Rule |
|---|---|
| « avec une recherche sur le nom de l'application » / « Vraiment utiliser de la recherche sur les champs comme le nom etc » | Long lists need search on the fields users remember. |
| « board kanban : peut-être masquer/archiver les apps en rejected » | Let low-value items get out of the way (collapse, archive). |
| « mettre le bg en gris pour faire ressortir les cartes / chemin linéaire » | Contrast of surfaces makes cards read; a process reads as one line. |
| « avec la feature de supprimer/enlever/masquer/collapser un talking point » / « peut-être ajouter un "Voir plus" si ça l'intéresse » | Users triage content; progressive disclosure for the rest. |
| « pour le cercle du score, comme c'est évolutif … faudrait quand même avoir un bout de cercle pour ne pas avoir un cercle vide à 0% » | A visual at zero must still say "this fills up". |

## 8. Copy and explanation

| Quote | Rule |
|---|---|
| « dans la card 1 ("Upload", "Analysis" and "Confirmation") ne décrit pas ce qui va réellement se passer dans la card » | Labels describe what will actually happen, not abstract stages. |
| « la phrase en-dessous du titre et au-dessus du statut bleu est très longue, peut-être le couper en deux » | Long sentences under titles get split: the finding, then the advice. |
| « peut-être un peu plus expliquer le score … notamment comment on le calcule » / « Le score en haut à droite est un peu planqué » | Every score explains itself and is easy to find. |

## 9. Mobile

| Quote | Rule |
|---|---|
| « c'est quand même important d'avoir une partie mobile qui fonctionne… peut-être utiliser un burger ou une nav en bas ou une flèche dropdown pour étendre une colonne » | Mobile is restructured (bottom nav, tabs), not shrunk. |
| « de plus en plus de jeunes n'utilisent que mobile au lieu de pc, donc prévoir au cas-où et être prêt si le jury demande » | Our users are often phone-only: check 390 px on every screen. |

## 10. How she gives feedback

- Short, concrete, located: she names the element and the measurement ("entre email et password", "24px").
- She proposes when she criticises ("peut-être…", "ou…"), and offers alternatives rather than one answer.
- She looks at the page as a user first (is something lost behind the panel? is there a way back?), then as a designer (spacing, colour, shape).
- She checks in both themes and on mobile without being asked.

Write your own critique the same way: element, measurement or observation, why it matters to the user, a proposal.

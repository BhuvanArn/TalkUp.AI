##
## Talkup Project, 2026
## TalkUp.AI
## French lexical lists for verbal analysis (rules backend).
##

from __future__ import annotations

# Mots de remplissage / hésitation
FILLER_WORDS: frozenset[str] = frozenset({
	"euh", "euuh", "heu", "heuu", "hum", "hmm", "hm", "mmh", "mh", "bah",
	"ben", "genre", "enfin", "voila", "voilà", "quoi", "tu vois", "vous voyez",
	"en gros", "comment dire", "disons", "bref", "allez", "bon", "donc",
	"du coup", "bon ben", "ben voilà", "ben voila", "ouais bon",
})

# Tics de langage récurrents en entretien
TIC_EXPRESSIONS: frozenset[str] = frozenset({
	"du coup", "en fait", "en gros", "voilà", "voila", "voilà voilà",
	"c'est à dire", "c'est-à-dire", "tu vois", "vous voyez", "franchement",
	"honnêtement", "honnetement", "clairement", "littéralement", "litteralement",
	"au final", "en vrai", "en réalité", "en realite", "pour être honnête",
	"pour etre honnete", "je dirais", "on va dire", "si je puis dire",
	"et tout", "et tout ça", "et tout ca", "tout ça", "tout ca", "j'avoue",
	"grosso modo", "en quelque sorte", "quelque part", "comme qui dirait",
})

# Registre familier / trop décontracté
INFORMAL_WORDS: frozenset[str] = frozenset({
	"ouais", "ouaip", "meuf", "mec", "truc", "machin", "bidule", "trucmuche",
	"chelou", "relou", "grave", "trop", "kiff", "kiffer", "kiffe", "bosser",
	"boulot", "galère", "galere", "naze", "ouf", "wesh", "mdr", "ptdr", "lol",
	"oklm", "bg", "bof", "nan", "nope", "pote", "potes", "frangin", "frangine",
	"gars", "nana", "bagnole", "fric", "thune", "thunes", "clope", "bouffe",
	"bouffer", "dingue", "stylé", "style", "chanmé", "chanme", "vénère",
	"venere", "saoulant", "soulant", "zarbi", "carrément", "carrement",
})

# Expressions impolies, vulgaires ou puériles (inadaptées en entretien)
IMPOLITE_WORDS: frozenset[str] = frozenset({
	"merde", "putain", "connard", "con", "conne", "débile", "debile",
	"nul", "nulle", "idiot", "idiote", "crétin", "cretin", "imbécile",
	"imbecile", "ta gueule", "ferme ta", "casse-toi", "casse toi",
	"chiant", "chiante", "chier", "emmerde", "emmerder", "bordel", "foutre",
	"salaud", "salope", "abruti", "abrutie", "minable", "tocard",
	"caca", "kaka", "pipi", "prout", "popo", "crotte", "zizi",
})

# Registre trop soutenu / pompeux pour un entretien standard
OVERLY_FORMAL_WORDS: frozenset[str] = frozenset({
	"néanmoins", "neanmoins", "en l'occurrence", "en loccurrence",
	"par conséquent", "par consequent", "en outre", "cependant",
	"nonobstant", "audit", "subséquemment", "subsequemment",
	"préalablement", "prealablement", "dès lors", "des lors",
	"eu égard à", "eu egard a", "en définitive", "en definitive",
})

# Marqueurs de politesse
POLITENESS_MARKERS: frozenset[str] = frozenset({
	"merci", "s'il vous plaît", "s il vous plait", "svp", "je vous remercie",
	"excusez-moi", "excusez moi", "pardon", "avec plaisir", "bonjour",
	"bonsoir", "au revoir", "cordialement", "je vous prie",
})

# Vocabulaire professionnel pertinent en entretien
PROFESSIONAL_WORDS: frozenset[str] = frozenset({
	"expérience", "experience", "compétence", "competence", "projet", "équipe",
	"equipe", "collaboration", "méthodologie", "methodologie", "agile", "scrum",
	"leadership", "communication", "résultat", "resultat", "objectif", "mission",
	"responsabilité", "responsabilite", "autonomie", "initiative", "organisation",
	"planification", "développement", "developpement", "analyse", "solution",
	"client", "stakeholder", "livraison", "qualité", "qualite", "performance",
	"amélioration", "amelioration", "formation", "apprentissage", "adaptabilité",
	"adaptabilite", "motivation", "engagement", "rigueur", "fiabilité", "fiabilite",
})

# Mots-clés poste IT (cohérence contextuelle)
IT_JOB_KEYWORDS: frozenset[str] = frozenset({
	"python", "java", "javascript", "typescript", "react", "angular", "vue",
	"node", "docker", "kubernetes", "aws", "azure", "gcp", "sql", "nosql",
	"api", "rest", "graphql", "git", "ci", "cd", "devops", "backend", "frontend",
	"fullstack", "cloud", "microservice", "architecture", "sécurité", "securite",
	"test", "tests", "tdd", "bdd", "ia", "machine learning", "data",
})

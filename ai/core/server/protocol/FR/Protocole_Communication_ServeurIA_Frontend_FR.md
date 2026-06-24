# 🧠 Protocole de Communication WebSocket — Serveur IA ↔ Frontend
**Version 1.0 — Octobre 2025**

## 1. Introduction
Ce document définit le protocole de communication entre le **Serveur IA** (implémenté en C++ avec Crow)
et le **Frontend** de l'application: Talkup.AI. Il vise à assurer une communication fiable et extensible
entre le client et le serveur, notamment pour la transmission en temps réel de données audio/vidéo
et la délégation de traitements à des microservices Python (ex: Speech-to-Text, Vision, etc.).

---

## 2. Structure générale des messages
Les communications entre le Frontend et le Serveur IA se font via **WebSocket**.
Tous les messages sont au format **JSON** et doivent contenir les champs suivants :

| Champ | Type | Description |
|-------|------|-------------|
| `type` | string | Type du message (ex: `ping`, `stream_chunk`, `error`) |
| `timestamp` | uint_64 | Horodatage UNIX du message |
| `data` | object | Contenu spécifique au message |

---

## 3. Niveau basique — Tests et connexion
Le serveur doit gérer des commandes simples pour tester la disponibilité et l’état de la connexion.

**Messages pris en charge :**
- `ping` → utilisé par le client pour tester la connexion.
- `status` → permet d’obtenir des informations sur l’état du serveur IA.
- `error` → message retourné en cas d’erreur de protocole.

---

## 4. Niveau applicatif — Transmission audio/vidéo
Le Frontend peut envoyer des flux audio et vidéo pour traitement. **Important :** le Serveur IA **ne se contente pas** d’envoyer uniquement une transcription textuelle. Selon le traitement demandé, il peut renvoyer :
- un flux média (audio ou vidéo) traité/annoté (`stream_output`), et/ou
- une référence/id de texte (nom de fichier ou identifiant de transcription) (`transcript_name` ou `text_id`), plutôt que le texte brut lui‑même.

**Types de messages :**
- `stream_start` : début de flux (type : `audio`, `video`, etc.)
- `stream_chunk` : envoi d’un fragment (binaire encodé en Base64 ou frame WebSocket binaire)
- `stream_end` : fin du flux.

**Réponses possibles du Serveur IA :**
- `stream_output` : renvoie un flux média traité (champ `data` contenant le binaire encodé en Base64 ou un identifiant de ressource)
- `transcript_name` / `text_id` : nom ou identifiant de la transcription produite (ex: `"transcript_20251015_001.txt"`)
- `analysis_result` : résultats analytiques (métadonnées, labels, timecodes, etc.)

### Exemple : Frontend → Serveur IA
```json
{
  "key": "exemple_key",
  "type": "stream_chunk",
  "stream_id": "abc123",
  "format": "audio",
  "timestamp": 1739592334,
  "data": "<base64 encoded chunk>"
}
```

### Exemple : Serveur IA → Frontend (flux média traité)
```json
{
  "key": "exemple_key",
  "type": "stream_output",
  "stream_id": "abc123",
  "format": "audio",
  "timestamp": 1739592350,
  "data": "<base64 encoded processed chunk or resource id>"
}
```

Le format de type peut être `audio`, `video`, `image` ou `text` selon le contenu du flux.

### Exemple : Serveur IA → Frontend (nom du texte / identifiant)
```json
{
  "key": "exemple_key",
  "type": "transcript_name",
  "stream_id": "abc123",
  "text_id": "transcript_20251015_001.txt",
  "timestamp": 1739592360
}
```

---

## 4.5 Contexte de simulation — entreprise et offre d'emploi

Avant d'envoyer des `stream_chunk` audio, le Frontend **doit** enregistrer le contexte métier via `simulation_context`. Ce contexte alimente le prompt système du LLM (STS).

**Ordre recommandé :** connexion WS → `simulation_context` → `simulation_context_ack` → `stream_chunk`.

### Exemple : Frontend → Serveur IA

```json
{
  "key": "exemple_key",
  "type": "simulation_context",
  "stream_id": "019bf2a0-....",
  "format": "json",
  "timestamp": 1739592334,
  "data": {
    "language": "French",
    "interviewType": "technical",
    "company": {
      "name": "Acme Digital",
      "description": "ESN specialisee en transformation digitale."
    },
    "jobOffer": {
      "title": "Developpeur Backend Java",
      "description": "Mission SI bancaire microservices.",
      "requirements": "Java 17, Spring Boot, Kafka."
    },
    "additionalInfo": "Notes complementaires (CV resume, objectifs)."
  }
}
```

### Exemple : Serveur IA → Frontend

```json
{
  "key": "exemple_key",
  "type": "simulation_context_ack",
  "stream_id": "019bf2a0-....",
  "format": "text",
  "timestamp": 1739592335,
  "data": "simulation context registered"
}
```

---

## 5. Niveau avancé — Serveur IA ↔ Microservices
Le protocole est conçu pour évoluer vers une architecture modulaire où le Serveur IA délègue certaines tâches à des microservices Python.

**Messages internes :**
- `task_request` : envoi d’une tâche à un microservice
- `task_result` : retour du résultat au Serveur IA

Chaque message est lié à un `session_id` et un `service_type`.

---

## 6. Sécurité et versioning
- Utiliser **WSS (WebSocket sécurisé)**
- Authentification via **token** ou **clé API**
- Un champ `protocol_version` permet de gérer la compatibilité entre versions

---

## 7. Conclusion
Ce protocole fournit une base solide pour la communication en temps réel entre un Frontend et un Serveur IA,
tout en restant extensible vers une architecture microservices. Il est conçu pour être **simple**, **robuste** et **évolutif**.

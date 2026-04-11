##
## Talkup Project, 2026
## TalkUp.AI
## File description:
## This file contains a dataset generation script for fine-tuning
## the Lucie-7B-Instruct-v1.1 model on IT recruiter conversations.
## This script creates a synthetic dataset of multi-turn conversations
## between an IT recruiter and a candidate, covering various roles and experience levels.
##

import json
import random
from pathlib import Path

file_path = "../dataset_multi_turn.jsonl"
base_dir = Path(__file__).resolve().parent
config_dir = base_dir / "config"


def load_json(filename: str):
    """
    Load JSON content from the config directory.
    """
    with open(config_dir / filename, "r", encoding="utf-8") as f:
        return json.load(f)


roles = load_json("roles.json")
levels = load_json("levels.json")
qualities = load_json("qualities.json")
role_data = load_json("role_data.json")

def answer_project(role: str, quality: str) -> str:
    """
    Return a project description based on role and quality.
    """
    if quality == "bon":
        return f"J’ai travaillé sur un projet en tant que {role}, avec des responsabilités techniques importantes."
    elif quality == "moyen":
        return f"J’ai participé à un projet en tant que {role}."
    else:
        return "J’ai fait quelques tâches sans responsabilités majeures."

def answer_bug(quality: str) -> str:
    """
    Return a bug resolution description based on quality.
    """
    if quality == "bon":
        return "Je reproduis le bug, analyse les logs et rollback si nécessaire."
    elif quality == "moyen":
        return "Je regarde les logs pour comprendre."
    else:
        return "Je redémarre le système."

def answer_pressure(quality: str) -> str:
    """
    Return a pressure management description based on quality.
    """
    if quality == "bon":
        return "Je priorise et communique avec l’équipe."
    elif quality == "moyen":
        return "Je reste calme et avance étape par étape."
    else:
        return "Je travaille plus longtemps."

def generate_conversation() -> dict:
    """
    Generate a conversation based on random selections of role, level, and quality.
    The conversation includes system instructions, candidate responses, and recruiter feedback.
    """
    role = random.choice(roles)
    level = random.choice(levels)
    quality = random.choice(qualities)

    data = role_data.get(role, role_data["default"])

    messages = []

    messages.append({
        "role": "system",
        "content": f"Tu es un recruteur IT pour un poste de {role} niveau {level}."
    })

    messages.append({"role": "assistant", "content": "Bonjour, peux-tu te présenter ?"})
    messages.append({"role": "user", "content": f"Je suis {role} avec {level} d'expérience."})

    messages.append({"role": "assistant", "content": "Peux-tu me parler d’un projet récent ?"})
    messages.append({"role": "user", "content": answer_project(role, quality)})

    for key, question in data["questions"]:
        messages.append({"role": "assistant", "content": question})
        messages.append({
            "role": "user",
            "content": data["answers"][key][quality]
        })

    messages.append({"role": "assistant", "content": "Un bug critique apparaît, que fais-tu ?"})
    messages.append({"role": "user", "content": answer_bug(quality)})

    messages.append({"role": "assistant", "content": "Comment gères-tu la pression ?"})
    messages.append({"role": "user", "content": answer_pressure(quality)})

    feedback = {
        "bon": "Très bonnes réponses, structurées et pertinentes.",
        "moyen": "Réponses correctes mais à approfondir.",
        "faible": "Plusieurs lacunes techniques identifiées."
    }

    messages.append({"role": "assistant", "content": feedback[quality]})

    messages.append({
        "role": "assistant",
        "content": "Merci pour cet échange. As-tu des questions ?"
    })
    return {"messages": messages}


dataset = [generate_conversation() for _ in range(5000)]

with open(file_path, "w", encoding="utf-8") as f:
    json.dump(dataset, f, ensure_ascii=False, indent=2)

print(f"Dataset generated and saved to {file_path}")

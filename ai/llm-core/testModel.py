##
## Talkup Project, 2026
## TalkUp.AI
## File description:
## This file contains a test script for the fine-tuned Qwen2.5-1.5B model using PEFT and Unsloth.
##

import torch

from unsloth import FastLanguageModel

print("Chargement du modèle Qwen2.5-1.5B fine-tuné...\n")

# Config
model_name = "unsloth/Qwen2.5-1.5B-Instruct-bnb-4bit"
adapter_path = "sup-it-lora-v3"
max_seq_length = 4096

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name=model_name,
    max_seq_length=max_seq_length,
    dtype=None,
    load_in_4bit=True,
    device_map="auto",
)

# Load fine-tuned LoRA adapter
print("Chargement de l'adaptateur LoRA...")
model.load_adapter(adapter_path)

# Activate the adapter for inference
FastLanguageModel.for_inference(model)

print("✅ Modèle Qwen2.5-1.5B + LoRA chargé avec succès !")
print("Tape 'quit' ou 'q' pour arrêter le test.\n")

system_prompt = """Tu es Sophie Martin, une recruteuse senior IT chez une ESN française, avec 12 ans d'expérience.
Tu es chaleureuse, professionnelle mais humaine. Tu parles de façon naturelle, comme dans une vraie conversation.
Tu poses des questions fluides, tu relances avec curiosité, tu fais des transitions naturelles.
Tu utilises parfois des expressions comme "Ah intéressant...", "Je vois...", "Super, raconte-moi ça...", "Et du coup...".
Tu n'es pas robotique : tu varies tes formulations, tu montres de l'intérêt, et tu adaptes tes questions en fonction des réponses du candidat.
Ton objectif est de mettre le candidat à l'aise tout en évaluant ses compétences techniques et comportementales."""

while True:
    user_input = input("Candidat : ")
    if user_input.lower() in ["quit", "q", "exit"]:
        print("Arrêt du test.")
        break

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_input}
    ]

    inputs = tokenizer.apply_chat_template(
        messages,
        tokenize=True,
        add_generation_prompt=True,
        return_tensors="pt"
    ).to("cuda")

    outputs = model.generate(
        inputs,
        max_new_tokens=450,
        temperature=0.7,
        top_p=0.9,
        do_sample=True,
        pad_token_id=tokenizer.eos_token_id,
        repetition_penalty=1.1
    )

    response = tokenizer.decode(outputs[0], skip_special_tokens=True)

    if "<|im_start|>assistant" in response:
        response = response.split("<|im_start|>assistant")[-1].strip()
    elif "assistant" in response:
        response = response.split("assistant")[-1].strip()

    print(f"\nRecruteur : {response}\n")
    print("-" * 80)

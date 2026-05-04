##
## Talkup Project, 2026
## TalkUp.AI
## File description:
## This file contains a fine-tuning script for the Lucie-7B-Instruct-v1.1 model using PEFT and Unsloth.
##

import torch

from unsloth import FastLanguageModel
from datasets import load_dataset, concatenate_datasets
from trl import SFTTrainer
from transformers import TrainingArguments

max_seq_length = 4096

print("Loading Qwen2.5-1.5B...")
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/Qwen2.5-1.5B-Instruct-bnb-4bit",
    max_seq_length=max_seq_length,
    dtype=None,
    load_in_4bit=True,
    device_map="auto",
)

print("Model loaded. Configuring LoRA...")
model = FastLanguageModel.get_peft_model(
    model,
    r=32,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_alpha=16,
    lora_dropout=0,
    bias="none",
    use_gradient_checkpointing="unsloth",
    random_state=42,
)

dataset_files = [
    "datasets/dataset_multi_turn1.jsonl",
    "datasets/dataset_multi_turn2.jsonl",
    "datasets/dataset_multi_software_eng.jsonl"
]

print(f"Loading {len(dataset_files)} dataset files...")

datasets_list = []
for file in dataset_files:
    try:
        ds = load_dataset("json", data_files=file, split="train")
        print(f"Loaded : {file} ({len(ds)} examples)")
        datasets_list.append(ds)
    except Exception as e:
        print(f"Error with {file} : {e}")

if len(datasets_list) > 1:
    dataset = concatenate_datasets(datasets_list)
elif len(datasets_list) == 1:
    dataset = datasets_list[0]
else:
    raise ValueError("No dataset could be loaded!")

print(f"Final dataset ready : {len(dataset)} examples in total")

def formatting_func(examples: dict) -> list:
    """
    Formats the input examples for training.
    """
    texts = []
    for messages in examples["messages"]:
        if isinstance(messages, dict):
            conversation = [messages]
        else:
            conversation = messages
        text = tokenizer.apply_chat_template(
            conversation,
            tokenize=False,
            add_generation_prompt=False
        )
        texts.append(text)
    return texts

trainer = SFTTrainer(
    model=model,
    train_dataset=dataset,
    formatting_func=formatting_func,
    max_seq_length=max_seq_length,
    packing=False,
    args=TrainingArguments(
        per_device_train_batch_size=1,
        gradient_accumulation_steps=16,
        warmup_steps=10,
        max_steps=500,
        learning_rate=2e-4,
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=10,
        output_dir="./sup-it-lora-v3",
        optim="adamw_8bit",
        save_strategy="steps",
        save_steps=100,
        report_to="none",
    ),
)

print("Beginning fine-tuning on multiple datasets...")
trainer.train()

model.save_pretrained("./sup-it-lora-v3")
tokenizer.save_pretrained("./sup-it-lora-v3")
print("Fine-tuning completed! Model saved in ./sup-it-lora-v3")

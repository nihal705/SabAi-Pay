# ml_service/training/train_ner_model.py
import json
import torch
from transformers import (
    AutoTokenizer,
    AutoModelForTokenClassification,
    Trainer,
    TrainingArguments
)
from datasets import Dataset
import numpy as np
from sklearn.model_selection import train_test_split

class NERTrainer:
    def __init__(self):
        self.model_name = 'distilbert-base-uncased'
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModelForTokenClassification.from_pretrained(
            self.model_name,
            num_labels=10  # O, B-ITEM, I-ITEM, B-QUANTITY, I-QUANTITY, 
                           # B-MERCHANT, I-MERCHANT, B-RESTAURANT, I-RESTAURANT, B-PRICE
        )
        
    def prepare_data(self, filepath='data/augmented_training_data.jsonl'):
        """Prepare NER training data from conversation data"""
        texts = []
        labels_list = []
        
        # Define label mapping
        label_map = {
            'O': 0,
            'B-ITEM': 1, 'I-ITEM': 2,
            'B-QUANTITY': 3, 'I-QUANTITY': 4,
            'B-MERCHANT': 5, 'I-MERCHANT': 6,
            'B-RESTAURANT': 7, 'I-RESTAURANT': 8,
            'B-PRICE': 9
        }
        
        with open(filepath, 'r') as f:
            for line in f:
                data = json.loads(line)
                text = data['text']
                entities = data.get('entities', {})
                
                # Create token labels
                tokens = self.tokenizer.tokenize(text)
                labels = [0] * len(tokens)  # Default O label
                
                # This is simplified - in production you'd need proper alignment
                for item in entities.get('items', []):
                    item_name = item.get('name', '')
                    if item_name in text:
                        # Mark the position (simplified)
                        for i, token in enumerate(tokens):
                            if item_name.lower() in token.lower():
                                labels[i] = label_map['B-ITEM']
                                break
                
                texts.append(text)
                labels_list.append(labels)
        
        return texts, labels_list
    
    def train(self):
        print("🚀 Training NER Model...")
        texts, labels = self.prepare_data()
        
        # Split data
        train_texts, val_texts, train_labels, val_labels = train_test_split(
            texts, labels, test_size=0.1, random_state=42
        )
        
        # Create datasets
        train_dataset = Dataset.from_dict({
            'text': train_texts,
            'labels': train_labels
        })
        val_dataset = Dataset.from_dict({
            'text': val_texts,
            'labels': val_labels
        })
        
        # Tokenize
        def tokenize_function(examples):
            return self.tokenizer(
                examples['text'],
                truncation=True,
                padding='max_length',
                max_length=256,
                return_tensors='pt'
            )
        
        train_dataset = train_dataset.map(tokenize_function, batched=True)
        val_dataset = val_dataset.map(tokenize_function, batched=True)
        
        training_args = TrainingArguments(
            output_dir='./models/ner_model_checkpoints',
            num_train_epochs=5,
            per_device_train_batch_size=16,
            per_device_eval_batch_size=32,
            evaluation_strategy='epoch',
            save_strategy='epoch',
            load_best_model_at_end=True,
        )
        
        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=val_dataset,
        )
        
        trainer.train()
        
        # Save model
        self.model.save_pretrained('../models/ner_model')
        self.tokenizer.save_pretrained('../models/ner_model')
        
        print("✅ NER Model saved to ../models/ner_model")

if __name__ == "__main__":
    trainer = NERTrainer()
    trainer.train()
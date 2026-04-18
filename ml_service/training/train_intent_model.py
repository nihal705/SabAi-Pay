# ml_service/training/train_intent_model.py
import json
import torch
import numpy as np
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    Trainer,
    TrainingArguments,
    EarlyStoppingCallback
)
from datasets import Dataset, DatasetDict
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, classification_report
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class IntentTrainer:
    def __init__(self, model_name='distilbert-base-uncased', num_labels=16):
        self.model_name = model_name
        self.num_labels = num_labels
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(
            model_name,
            num_labels=num_labels
        )
        
        self.intent_map = {
            "order_new": 0,
            "order_add_items": 1,
            "order_remove_items": 2,
            "order_view_cart": 3,
            "order_checkout": 4,
            "general_greeting": 5,
            "general_question": 6,
            "general_comparison": 7,
            "hybrid_situation_to_order": 8,
            "hybrid_interrupt_order": 9,
            "schedule_new": 10,
            "schedule_modify": 11,
            "payment_immediate": 12,
            "payment_auto_pay": 13,
            "tracking_status": 14,
            "cancel_order": 15
        }
    
    def load_data(self, filepath='data/training_data.jsonl'):
        texts = []
        labels = []
        
        with open(filepath, 'r') as f:
            for line in f:
                data = json.loads(line)
                texts.append(data['text'])
                labels.append(self.intent_map[data['intent']])
        
        return texts, labels
    
    def tokenize_function(self, examples):
        return self.tokenizer(
            examples['text'],
            truncation=True,
            padding='max_length',
            max_length=256
        )
    
    def compute_metrics(self, eval_pred):
        predictions, labels = eval_pred
        predictions = np.argmax(predictions, axis=1)
        accuracy = accuracy_score(labels, predictions)
        f1 = f1_score(labels, predictions, average='weighted')
        
        return {
            'accuracy': accuracy,
            'f1': f1
        }
    
    def train(self, train_texts, val_texts, train_labels, val_labels):
        # Create datasets
        train_dataset = Dataset.from_dict({
            'text': train_texts,
            'label': train_labels
        })
        val_dataset = Dataset.from_dict({
            'text': val_texts,
            'label': val_labels
        })
        
        # Tokenize
        train_dataset = train_dataset.map(self.tokenize_function, batched=True)
        val_dataset = val_dataset.map(self.tokenize_function, batched=True)
        
        # Set format
        train_dataset.set_format('torch', columns=['input_ids', 'attention_mask', 'label'])
        val_dataset.set_format('torch', columns=['input_ids', 'attention_mask', 'label'])
        
        # Training arguments
        training_args = TrainingArguments(
            output_dir='./models/intent_model_checkpoints',
            num_train_epochs=10,
            per_device_train_batch_size=32,
            per_device_eval_batch_size=64,
            warmup_steps=500,
            weight_decay=0.01,
            logging_dir='./logs',
            logging_steps=100,
            evaluation_strategy='epoch',
            save_strategy='epoch',
            load_best_model_at_end=True,
            metric_for_best_model='accuracy',
            greater_is_better=True,
            save_total_limit=3,
            fp16=torch.cuda.is_available(),
            gradient_accumulation_steps=2,
            learning_rate=2e-5
        )
        
        # Trainer
        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=val_dataset,
            compute_metrics=self.compute_metrics,
            callbacks=[EarlyStoppingCallback(early_stopping_patience=3)]
        )
        
        # Train
        logger.info("🚀 Starting training...")
        trainer.train()
        
        # Save model
        self.model.save_pretrained('./models/intent_model')
        self.tokenizer.save_pretrained('./models/intent_model')
        logger.info("✅ Model saved to ./models/intent_model")
        
        # Evaluate on validation set
        predictions = trainer.predict(val_dataset)
        pred_labels = np.argmax(predictions.predictions, axis=1)
        
        # Print classification report
        target_names = list(self.intent_map.keys())
        report = classification_report(val_labels, pred_labels, target_names=target_names)
        logger.info(f"\nClassification Report:\n{report}")
        
        return trainer

if __name__ == "__main__":
    trainer = IntentTrainer()
    
    # Load data
    logger.info("Loading training data...")
    texts, labels = trainer.load_data('data/training_data.jsonl')
    
    # Split data
    train_texts, val_texts, train_labels, val_labels = train_test_split(
        texts, labels, test_size=0.1, random_state=42, stratify=labels
    )
    
    logger.info(f"Training samples: {len(train_texts)}")
    logger.info(f"Validation samples: {len(val_texts)}")
    
    # Train
    trainer.train(train_texts, val_texts, train_labels, val_labels)
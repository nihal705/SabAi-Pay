# ml_service/training/train_response_model.py
from transformers import (
    AutoTokenizer,
    AutoModelForSeq2SeqLM,
    Seq2SeqTrainingArguments,
    Seq2SeqTrainer,
    DataCollatorForSeq2Seq
)
from datasets import Dataset
import json

class ResponseTrainer:
    def __init__(self):
        self.model_name = 'google/flan-t5-small'  # Use small for faster training
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(self.model_name)
        
    def prepare_data(self, filepath='data/augmented_training_data.jsonl'):
        """Prepare prompt-response pairs for training"""
        examples = []
        
        with open(filepath, 'r') as f:
            for line in f:
                data = json.loads(line)
                intent = data['intent']
                text = data['text']
                
                # Create prompt
                prompt = f"Intent: {intent}\nUser: {text}\nAssistant:"
                
                # Create expected response (simplified - would need actual responses)
                response = self._generate_expected_response(intent, data)
                
                examples.append({
                    'prompt': prompt,
                    'response': response
                })
        
        return examples
    
    def _generate_expected_response(self, intent, data):
        """Generate expected response based on intent"""
        responses = {
            'order_new': "What would you like to order? Please specify items with quantities.",
            'order_add_items': "I've added the items to your cart. Would you like anything else?",
            'order_remove_items': "I've removed the items from your cart.",
            'order_view_cart': "Here's your cart summary.",
            'order_checkout': "Proceed to checkout?",
            'schedule_new': "When would you like to schedule this order?",
            'tracking_status': "Your order is being processed.",
            'cancel_order': "Please confirm you want to cancel this order.",
            'general_greeting': "Hello! How can I help you today?",
            'general_question': "How can I help you?",
            'general_comparison': "I can help compare. Which platforms would you like to compare?",
            'payment_immediate': "Please select a payment method.",
            'payment_auto_pay': "Set up auto-pay for recurring payments.",
            'hybrid_situation_to_order': "Based on your situation, here are some suggestions."
        }
        return responses.get(intent, "How can I help you?")
    
    def train(self):
        print("🚀 Training Response Generator...")
        
        examples = self.prepare_data()
        
        # Create dataset
        dataset = Dataset.from_list(examples)
        
        # Tokenize
        def preprocess_function(examples):
            inputs = self.tokenizer(
                examples['prompt'],
                truncation=True,
                padding='max_length',
                max_length=512
            )
            targets = self.tokenizer(
                examples['response'],
                truncation=True,
                padding='max_length',
                max_length=128
            )
            inputs['labels'] = targets['input_ids']
            return inputs
        
        tokenized_dataset = dataset.map(preprocess_function, batched=True)
        
        # Split train/val
        split_dataset = tokenized_dataset.train_test_split(test_size=0.1)
        
        training_args = Seq2SeqTrainingArguments(
            output_dir='./models/response_model_checkpoints',
            num_train_epochs=3,
            per_device_train_batch_size=8,
            per_device_eval_batch_size=8,
            evaluation_strategy='epoch',
            save_strategy='epoch',
            load_best_model_at_end=True,
            predict_with_generate=True,
        )
        
        data_collator = DataCollatorForSeq2Seq(self.tokenizer, model=self.model)
        
        trainer = Seq2SeqTrainer(
            model=self.model,
            args=training_args,
            train_dataset=split_dataset['train'],
            eval_dataset=split_dataset['test'],
            data_collator=data_collator,
            tokenizer=self.tokenizer,
        )
        
        trainer.train()
        
        # Save model
        self.model.save_pretrained('../models/response_model')
        self.tokenizer.save_pretrained('../models/response_model')
        
        print("✅ Response Model saved to ../models/response_model")

if __name__ == "__main__":
    trainer = ResponseTrainer()
    trainer.train()
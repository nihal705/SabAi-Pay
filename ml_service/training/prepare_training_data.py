# ml_service/training/prepare_training_data.py
import json
import random
import numpy as np
from typing import List, Dict, Any
from datetime import datetime

class TrainingDataGenerator:
    def __init__(self):
        self.intents = [
            "order_new", "order_add_items", "order_remove_items", "order_view_cart",
            "order_checkout", "general_greeting", "general_question", "general_comparison",
            "hybrid_situation_to_order", "hybrid_interrupt_order", "schedule_new",
            "schedule_modify", "payment_immediate", "payment_auto_pay", "tracking_status",
            "cancel_order"
        ]
        
        self.entities = {
            "items": ["chicken biryani", "paneer butter masala", "garlic naan", "gulab jamun",
                      "butter chicken", "dal makhani", "veg biryani", "cold coffee",
                      "toothpaste", "face wash", "shampoo", "soap", "milk", "bread", "eggs"],
            "quantities": ["1", "2", "3", "4", "5", "half kg", "1kg", "2kg"],
            "restaurants": ["paradise", "meghana foods", "kanti sweets", "empire", "toit", "mtr"],
            "merchants": ["swiggy", "zomato", "zepto", "blinkit", "amazon", "flipkart"],
            "prices": ["100", "200", "300", "500", "1000"],
            "times": ["now", "tonight", "tomorrow", "at 9 PM", "in 30 minutes"],
            "payment_methods": ["upi", "reserve pay", "gems", "card", "cod"]
        }
    
    def generate_training_examples(self, count=100000):
        """Generate 100,000 training examples"""
        examples = []
        
        # Generate examples for each intent
        for intent in self.intents:
            examples.extend(self._generate_for_intent(intent, count // len(self.intents)))
        
        # Add edge cases and variations
        examples.extend(self._generate_edge_cases(5000))
        examples.extend(self._generate_multi_intent(3000))
        examples.extend(self._generate_typo_variations(2000))
        
        # Shuffle
        random.shuffle(examples)
        
        return examples
    
    def _generate_for_intent(self, intent: str, count: int) -> List[Dict]:
        examples = []
        
        templates = self._get_templates_for_intent(intent)
        
        for _ in range(count):
            template = random.choice(templates)
            entities = self._generate_entities_for_intent(intent)
            
            # Fill template with random entities
            text = template
            for entity_type, values in entities.items():
                if f"{{{entity_type}}}" in text:
                    value = random.choice(values) if values else ""
                    text = text.replace(f"{{{entity_type}}}", value)
            
            examples.append({
                "text": text,
                "intent": intent,
                "entities": entities,
                "timestamp": datetime.now().isoformat()
            })
        
        return examples
    
    def _get_templates_for_intent(self, intent: str) -> List[str]:
        templates = {
            "order_new": [
                "I want to order {items} from {merchants}",
                "Order {items} for me",
                "Get me {items}",
                "Please order {items}",
                "Can you order {items}?",
                "I'd like to order {items}",
                "Order {quantity} {items} from {restaurants}",
                "Send {quantity} {items} from {merchants}"
            ],
            "order_add_items": [
                "Add {items} to my cart",
                "Also add {items}",
                "Add {quantity} more {items}",
                "Include {items} as well",
                "Put {items} in my cart",
                "I also want {items}"
            ],
            "order_remove_items": [
                "Remove {items} from cart",
                "Take out {items}",
                "Delete {items}",
                "I don't want {items} anymore",
                "Cancel {items} from my order"
            ],
            "order_view_cart": [
                "Show me my cart",
                "What's in my cart?",
                "View cart",
                "Cart summary",
                "List my items"
            ],
            "order_checkout": [
                "Proceed to checkout",
                "Checkout now",
                "Place my order",
                "Confirm order",
                "Pay now"
            ],
            "general_greeting": [
                "Hello",
                "Hi there",
                "Hey",
                "Good morning",
                "Good evening",
                "Namaste"
            ],
            "general_question": [
                "How does {merchants} work?",
                "What is SabAI Pay?",
                "Tell me about {items}",
                "Explain Reserve Pay",
                "How to earn gems?"
            ],
            "general_comparison": [
                "Compare {merchants} and {merchants} for {items}",
                "Which is better, {merchants} or {merchants}?",
                "Compare prices of {items} on both platforms",
                "Which has faster delivery?"
            ],
            "hybrid_situation_to_order": [
                "I'm moving to Bangalore and need {items} for my PG",
                "I have a fever, what medicines should I order?",
                "Hosting a party, suggest {items} to order",
                "Setting up a new kitchen, need {items}",
                "Preparing for exams, need study supplies"
            ],
            "hybrid_interrupt_order": [
                "What's the weather like?",
                "Tell me a joke",
                "What time is it?",
                "Can you help me with something else?",
                "Wait, I need to check something"
            ],
            "schedule_new": [
                "Schedule this order for {times}",
                "Order at {times}",
                "Schedule delivery for {times}",
                "Set up auto-pay for this order",
                "Repeat this order monthly"
            ],
            "schedule_modify": [
                "Change scheduled time to {times}",
                "Update my auto-pay settings",
                "Pause my scheduled order",
                "Resume auto-pay"
            ],
            "payment_immediate": [
                "Pay with {payment_methods}",
                "Use {payment_methods}",
                "Complete payment",
                "Pay now"
            ],
            "payment_auto_pay": [
                "Set up auto-pay with {payment_methods}",
                "Enable auto-pay for bills",
                "Schedule automatic payments",
                "Use reserve pay for auto-pay"
            ],
            "tracking_status": [
                "Where is my order?",
                "Track order {order_ids}",
                "Order status",
                "Delivery tracking",
                "When will my order arrive?"
            ],
            "cancel_order": [
                "Cancel my order",
                "Cancel order {order_ids}",
                "I want to cancel",
                "Stop my order"
            ]
        }
        return templates.get(intent, ["{items}"])
    
    def _generate_entities_for_intent(self, intent: str) -> Dict:
        entities = {}
        
        if "items" in self.entities:
            entities["items"] = [random.choice(self.entities["items"])]
        if "quantities" in self.entities:
            entities["quantity"] = [random.choice(self.entities["quantities"])]
        if "restaurants" in self.entities:
            entities["restaurants"] = [random.choice(self.entities["restaurants"])]
        if "merchants" in self.entities:
            entities["merchants"] = [random.choice(self.entities["merchants"])]
        if "times" in self.entities:
            entities["times"] = [random.choice(self.entities["times"])]
        if "payment_methods" in self.entities:
            entities["payment_methods"] = [random.choice(self.entities["payment_methods"])]
        
        return entities
    
    def _generate_edge_cases(self, count: int) -> List[Dict]:
        """Generate edge cases and difficult examples"""
        edge_cases = []
        
        edge_templates = [
            "I want to order but I don't know what",
            "Can you help me decide what to eat?",
            "I'm confused between {items} and {items}",
            "What's the cheapest option?",
            "Show me the most popular items",
            "I need food urgently",
            "Order something under {prices} rupees",
            "Get me the highest rated restaurant",
            "I want vegetarian options only",
            "Any discounts available?"
        ]
        
        for _ in range(count):
            template = random.choice(edge_templates)
            text = template
            if "{items}" in text:
                text = text.replace("{items}", random.choice(self.entities["items"]), 1)
                text = text.replace("{items}", random.choice(self.entities["items"]), 1)
            if "{prices}" in text:
                text = text.replace("{prices}", random.choice(self.entities["prices"]))
            
            edge_cases.append({
                "text": text,
                "intent": "general_question",
                "entities": {},
                "is_edge_case": True
            })
        
        return edge_cases
    
    def _generate_multi_intent(self, count: int) -> List[Dict]:
        """Generate examples with multiple intents"""
        multi_intent_examples = []
        
        templates = [
            "Add {items} to cart and then show me checkout",
            "Remove {items} and add {items} instead",
            "Schedule this order for {times} but pay with {payment_methods}",
            "Order {items} from {merchants} and compare prices",
            "Track my order and also tell me about new offers"
        ]
        
        for _ in range(count):
            template = random.choice(templates)
            text = template
            text = text.replace("{items}", random.choice(self.entities["items"]))
            text = text.replace("{items}", random.choice(self.entities["items"]))
            text = text.replace("{times}", random.choice(self.entities["times"]))
            text = text.replace("{payment_methods}", random.choice(self.entities["payment_methods"]))
            text = text.replace("{merchants}", random.choice(self.entities["merchants"]))
            
            multi_intent_examples.append({
                "text": text,
                "intent": "order_add_items",  # Primary intent
                "secondary_intents": ["order_checkout", "schedule_new", "general_comparison"],
                "entities": {},
                "is_multi_intent": True
            })
        
        return multi_intent_examples
    
    def _generate_typo_variations(self, count: int) -> List[Dict]:
        """Generate examples with common typos"""
        typo_map = {
            'biryani': ['biriyani', 'briyani', 'biriyani'],
            'paneer': ['panner', 'panir', 'paneer'],
            'chicken': ['chiken', 'chickn', 'chkn'],
            'swiggy': ['swigy', 'swiggi', 'swiggyy'],
            'zomato': ['zomatoo', 'zomatoo', 'zomato'],
            'paradise': ['paardise', 'paradisee', 'paridise']
        }
        
        typo_examples = []
        
        base_texts = [
            "I want to order {items} from {merchants}",
            "Order {quantity} {items}",
            "Show me menu from {restaurants}"
        ]
        
        for _ in range(count):
            template = random.choice(base_texts)
            text = template
            
            # Insert typos
            for correct, typos in typo_map.items():
                if correct in text.lower():
                    text = text.lower().replace(correct, random.choice(typos))
                    break
            
            typo_examples.append({
                "text": text,
                "intent": "order_new",
                "entities": {},
                "has_typos": True,
                "corrected_text": template  # Store original for training
            })
        
        return typo_examples

# Generate and save data
if __name__ == "__main__":
    generator = TrainingDataGenerator()
    
    print("🚀 Generating 100,000 training examples...")
    examples = generator.generate_training_examples(100000)
    
    # Save as JSONL
    with open('data/training_data.jsonl', 'w') as f:
        for ex in examples:
            f.write(json.dumps(ex) + '\n')
    
    print(f"✅ Generated {len(examples)} training examples")
    print(f"   - Saved to data/training_data.jsonl")
    
    # Also save as CSV for easy viewing
    import pandas as pd
    df = pd.DataFrame(examples)
    df.to_csv('data/training_data.csv', index=False)
    print(f"   - Also saved as CSV for review")
# ml_service/utils/preprocess.py
import re
import json
from typing import Dict, List, Tuple

class TextPreprocessor:
    def __init__(self):
        self.stop_words = {'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'to', 'for', 
                          'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 
                          'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having',
                          'do', 'does', 'did', 'doing', 'would', 'could', 'should',
                          'this', 'that', 'these', 'those', 'from', 'with', 'without'}
        
    def clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Convert to lowercase
        text = text.lower()
        
        # Remove extra spaces
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^a-z0-9\s\.\,\!\?]', '', text)
        
        # Trim
        text = text.strip()
        
        return text
    
    def tokenize(self, text: str) -> List[str]:
        """Simple tokenization"""
        text = self.clean_text(text)
        tokens = text.split()
        return tokens
    
    def remove_stopwords(self, tokens: List[str]) -> List[str]:
        """Remove stop words"""
        return [t for t in tokens if t not in self.stop_words]
    
    def extract_numbers(self, text: str) -> List[int]:
        """Extract numbers from text"""
        numbers = re.findall(r'\d+', text)
        return [int(n) for n in numbers]
    
    def normalize_entity(self, entity: str) -> str:
        """Normalize entity names"""
        # Common entity mappings
        mappings = {
            'chicken biryani': 'chicken_biryani',
            'paneer butter masala': 'paneer_butter_masala',
            'garlic naan': 'garlic_naan',
            'gulab jamun': 'gulab_jamun',
            'swiggy': 'swiggy',
            'zomato': 'zomato',
            'zepto': 'zepto',
            'blinkit': 'blinkit'
        }
        
        entity_lower = entity.lower()
        for key, value in mappings.items():
            if key in entity_lower or entity_lower in key:
                return value
        
        return entity_lower.replace(' ', '_')
    
    def detect_quantity(self, text: str) -> int:
        """Detect quantity from text"""
        numbers = self.extract_numbers(text)
        if numbers:
            return numbers[0]
        
        # Check for words
        quantity_words = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
        }
        
        text_lower = text.lower()
        for word, num in quantity_words.items():
            if word in text_lower:
                return num
        
        return 1  # Default quantity
    
    def preprocess_for_training(self, raw_data: List[Dict]) -> List[Dict]:
        """Preprocess raw conversation data for training"""
        processed = []
        
        for item in raw_data:
            processed_item = {
                'text': self.clean_text(item.get('text', '')),
                'intent': item.get('intent', 'general_question'),
                'entities': {}
            }
            
            # Process entities
            entities = item.get('entities', {})
            for entity_type, entity_list in entities.items():
                processed_entities = []
                for entity in entity_list:
                    if isinstance(entity, dict):
                        name = entity.get('name', '')
                        processed_entities.append({
                            'name': self.normalize_entity(name),
                            'value': entity.get('value', name),
                            'type': entity_type
                        })
                    elif isinstance(entity, str):
                        processed_entities.append({
                            'name': self.normalize_entity(entity),
                            'value': entity,
                            'type': entity_type
                        })
                processed_item['entities'][entity_type] = processed_entities
            
            # Extract quantities
            processed_item['quantities'] = self.extract_numbers(processed_item['text'])
            
            processed.append(processed_item)
        
        return processed

preprocessor = TextPreprocessor()
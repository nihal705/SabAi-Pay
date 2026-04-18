# ml_service/training/augment_data.py
import random
import json
import re
from typing import List, Dict

class DataAugmenter:
    def __init__(self):
        self.synonyms = {
            'order': ['buy', 'purchase', 'get', 'want', 'need'],
            'chicken': ['chicken', 'murgh', 'chk'],
            'biryani': ['biryani', 'biriyani', 'briyani'],
            'paneer': ['paneer', 'panner', 'panir'],
            'add': ['add', 'include', 'put', 'also get'],
            'remove': ['remove', 'delete', 'take out', 'cancel'],
            'cart': ['cart', 'bag', 'basket', 'order'],
            'checkout': ['checkout', 'pay', 'complete', 'finish']
        }
        
    def augment_text(self, text: str) -> List[str]:
        """Generate augmented versions of a text"""
        augmented = [text]
        
        # Replace words with synonyms
        for original, synonyms in self.synonyms.items():
            if original in text.lower():
                for syn in synonyms:
                    new_text = text.lower().replace(original, syn)
                    if new_text not in augmented:
                        augmented.append(new_text)
        
        # Add typos (random character swaps)
        if len(augmented) < 10:
            words = text.split()
            for i in range(len(words)):
                if len(words[i]) > 3:
                    for _ in range(2):
                        chars = list(words[i])
                        if len(chars) > 1:
                            idx = random.randint(0, len(chars)-2)
                            chars[idx], chars[idx+1] = chars[idx+1], chars[idx]
                            new_word = ''.join(chars)
                            new_text = ' '.join(words[:i] + [new_word] + words[i+1:])
                            if new_text not in augmented:
                                augmented.append(new_text)
        
        return augmented[:10]
    
    def augment_dataset(self, input_file: str, output_file: str):
        """Augment entire dataset"""
        with open(input_file, 'r') as f:
            examples = [json.loads(line) for line in f]
        
        augmented_examples = []
        for ex in examples:
            # Add original
            augmented_examples.append(ex)
            
            # Generate augmented versions
            variations = self.augment_text(ex['text'])
            for var in variations[:3]:  # Limit to 3 variations per example
                if var != ex['text']:
                    new_ex = ex.copy()
                    new_ex['text'] = var
                    new_ex['is_augmented'] = True
                    augmented_examples.append(new_ex)
        
        random.shuffle(augmented_examples)
        
        with open(output_file, 'w') as f:
            for ex in augmented_examples:
                f.write(json.dumps(ex) + '\n')
        
        print(f"✅ Augmented {len(examples)} to {len(augmented_examples)} examples")
        return len(augmented_examples)

if __name__ == "__main__":
    augmenter = DataAugmenter()
    augmenter.augment_dataset('data/training_data.jsonl', 'data/augmented_training_data.jsonl')
# ml_service/utils/metrics.py
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from typing import Dict, List

class MetricsCalculator:
    @staticmethod
    def calculate_intent_metrics(y_true: List[int], y_pred: List[int]) -> Dict:
        """Calculate metrics for intent classification"""
        return {
            'accuracy': accuracy_score(y_true, y_pred),
            'precision': precision_score(y_true, y_pred, average='weighted', zero_division=0),
            'recall': recall_score(y_true, y_pred, average='weighted', zero_division=0),
            'f1': f1_score(y_true, y_pred, average='weighted', zero_division=0)
        }
    
    @staticmethod
    def calculate_ner_metrics(y_true: List[int], y_pred: List[int]) -> Dict:
        """Calculate metrics for NER"""
        # For NER, we use token-level metrics
        return {
            'token_accuracy': accuracy_score(y_true, y_pred),
            'token_f1': f1_score(y_true, y_pred, average='weighted', zero_division=0)
        }
    
    @staticmethod
    def calculate_confidence_interval(scores: List[float], confidence: float = 0.95) -> tuple:
        """Calculate confidence interval for scores"""
        n = len(scores)
        mean = np.mean(scores)
        se = np.std(scores, ddof=1) / np.sqrt(n)
        h = se * 1.96  # 95% confidence
        return mean - h, mean + h

metrics = MetricsCalculator()
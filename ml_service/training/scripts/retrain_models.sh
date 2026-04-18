# scripts/retrain_models.sh
#!/bin/bash

echo "🔄 Starting model retraining..."

# Backup current models
mkdir -p backups/$(date +%Y%m%d)
cp -r ml_service/models/* backups/$(date +%Y%m%d)/

# Collect new training data from production
node backend/scripts/collectTrainingData.js

# Retrain models
cd ml_service/training
python prepare_training_data.py --include-production
python train_intent_model.py --epochs 5
python train_ner_model.py --epochs 5

# Validate new models
python validate_models.py

# If validation passes, reload models in production
curl -X POST http://localhost:5001/reload-models

echo "✅ Model retraining complete!"
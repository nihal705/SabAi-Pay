# ml_service/app.py - FIXED VERSION with proper entity parsing

from flask import Flask, request, jsonify
from flask_cors import CORS
import re
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'mode': 'rule-based', 'timestamp': datetime.now().isoformat()})

@app.route('/classify', methods=['POST'])
def classify():
    data = request.get_json()
    text = data.get('text', '').lower()
    
    if any(word in text for word in ['order', 'buy', 'get me', 'i want']):
        if 'add' in text or 'also' in text:
            intent = 'order_add_items'
        elif 'remove' in text or 'delete' in text:
            intent = 'order_remove_items'
        elif 'cart' in text:
            intent = 'order_view_cart'
        elif 'checkout' in text or 'pay now' in text:
            intent = 'order_checkout'
        else:
            intent = 'order_new'
    elif 'schedule' in text or 'auto-pay' in text:
        intent = 'schedule_new'
    elif 'track' in text or 'status' in text:
        intent = 'tracking_status'
    elif 'cancel' in text:
        intent = 'cancel_order'
    elif 'compare' in text or 'better' in text:
        intent = 'general_comparison'
    elif 'hello' in text or 'hi' in text:
        intent = 'general_greeting'
    else:
        intent = 'general_question'
    
    return jsonify({'intent': intent, 'confidence': 0.85, 'timestamp': datetime.now().isoformat()})

@app.route('/extract-entities', methods=['POST'])
def extract_entities():
    data = request.get_json()
    text = data.get('text', '').lower()
    
    entities = {"items": [], "quantities": [], "merchants": [], "restaurants": []}
    
    merchants = ['swiggy', 'zomato', 'zepto', 'blinkit', 'amazon', 'flipkart', 'netmeds', 'pharmeasy']
    text_without_merchant = text
    for merchant in merchants:
        if merchant in text:
            entities['merchants'].append({"name": merchant})
            text_without_merchant = text_without_merchant.replace(merchant, '')
    
    pattern = r'(\d+)\s+([a-z\s]+?)(?=,|$|and|or|\.|from)'
    matches = re.findall(pattern, text_without_merchant)
    
    for qty, item in matches:
        item_clean = item.strip()
        if len(item_clean) > 2 and item_clean not in ['and', 'or', 'the', 'from']:
            entities['items'].append({"name": item_clean})
            entities['quantities'].append({"value": qty})
    
    return jsonify({"entities": entities})

@app.route('/generate-response', methods=['POST'])
def generate_response():
    try:
        data = request.get_json()
        print(f"Received data: {json.dumps(data, indent=2)}")  # Debug print
        
        intent = data.get('intent', 'general_question')
        entities_raw = data.get('entities', {})
        context = data.get('context', {})
        
        # Debug print entities
        print(f"Entities raw: {entities_raw}")
        
        # Extract items and merchants - handle different formats
        items = []
        merchants = []
        
        # Case 1: entities is a dict with items/merchants keys
        if isinstance(entities_raw, dict):
            # Handle items
            if 'items' in entities_raw:
                items_data = entities_raw['items']
                if isinstance(items_data, list):
                    for item in items_data:
                        if isinstance(item, dict):
                            items.append(item.get('name', str(item)))
                        else:
                            items.append(str(item))
                elif isinstance(items_data, dict):
                    items.append(items_data.get('name', str(items_data)))
            
            # Handle merchants
            if 'merchants' in entities_raw:
                merchants_data = entities_raw['merchants']
                if isinstance(merchants_data, list):
                    for merchant in merchants_data:
                        if isinstance(merchant, dict):
                            merchants.append(merchant.get('name', str(merchant)))
                        else:
                            merchants.append(str(merchant))
                elif isinstance(merchants_data, dict):
                    merchants.append(merchants_data.get('name', str(merchants_data)))
        
        # Case 2: entities is a list
        elif isinstance(entities_raw, list):
            for entity in entities_raw:
                if isinstance(entity, dict):
                    if 'name' in entity:
                        items.append(entity['name'])
                    if 'merchant' in entity:
                        merchants.append(entity['merchant'])
        
        # Debug print extracted data
        print(f"Extracted items: {items}")
        print(f"Extracted merchants: {merchants}")
        
        item_list = ', '.join(items) if items else ''
        merchant_text = f" from {merchants[0]}" if merchants else ''
        
        # Generate response based on intent
        if intent == 'order_new':
            if items:
                return jsonify({
                    'response': f"🛍️ I see you want to order {item_list}{merchant_text}. I've added these to your cart. Would you like to proceed to checkout or add more items?"
                })
            else:
                return jsonify({
                    'response': '🛍️ What would you like to order? Please specify items with quantities.\n\nExample: "2 Chicken Biryani, 1 Paneer Tikka from Swiggy"'
                })
        
        elif intent == 'order_add_items':
            if items:
                return jsonify({
                    'response': f'✅ Added {item_list} to your cart! Anything else?'
                })
            else:
                return jsonify({
                    'response': 'What items would you like to add to your cart?'
                })
        
        elif intent == 'order_remove_items':
            if items:
                return jsonify({
                    'response': f'🗑️ Removed {item_list} from your cart.'
                })
            else:
                return jsonify({
                    'response': 'What items would you like to remove from your cart?'
                })
        
        elif intent == 'order_view_cart':
            cart_length = context.get('cart_length', 0)
            total = context.get('total', 0)
            if cart_length == 0:
                return jsonify({'response': '🛒 Your cart is empty. Add some items to get started!'})
            return jsonify({'response': f'🛒 Your cart has {cart_length} items. Total: ₹{total}\n\nType "checkout" to proceed.'})
        
        elif intent == 'order_checkout':
            total = context.get('total', 0)
            return jsonify({
                'response': f'💳 Your cart total is ₹{total}. Please select a payment method:\n• UPI\n• Reserve Pay\n• SabAI Gems'
            })
        
        elif intent == 'schedule_new':
            if items:
                return jsonify({
                    'response': f'📅 When would you like to schedule your order for {item_list}{merchant_text}? (e.g., "tomorrow at 7 PM")'
                })
            else:
                return jsonify({
                    'response': '📅 When would you like to schedule this order? (e.g., "tomorrow at 7 PM")'
                })
        
        elif intent == 'tracking_status':
            return jsonify({
                'response': '📍 Your order is being processed. You\'ll receive updates shortly.'
            })
        
        elif intent == 'cancel_order':
            return jsonify({
                'response': '⚠️ Please confirm you want to cancel this order by typing "CONFIRM CANCEL".'
            })
        
        elif intent == 'general_comparison':
            if merchants and items:
                merchants_text = ' vs '.join(merchants)
                return jsonify({
                    'response': f'🔍 Comparing {merchants_text} for {item_list}. What would you like to compare?\n• Price\n• Delivery time\n• Offers'
                })
            elif merchants:
                merchants_text = ' vs '.join(merchants)
                return jsonify({
                    'response': f'🔍 I can help compare {merchants_text}. What items would you like to compare?'
                })
            else:
                return jsonify({
                    'response': '🔍 Which platforms would you like to compare? (e.g., "Compare Swiggy and Zomato for chicken biryani")'
                })
        
        elif intent == 'general_greeting':
            return jsonify({
                'response': '👋 Hello! I\'m SabAI, your AI payment assistant. How can I help you today?'
            })
        
        elif intent == 'payment_immediate':
            total = context.get('total', 0)
            return jsonify({
                'response': f'💳 Please select a payment method for ₹{total}:\n• UPI\n• Reserve Pay\n• SabAI Gems'
            })
        
        elif intent == 'payment_auto_pay':
            return jsonify({
                'response': '🔄 To set up Auto-Pay, please specify:\n• Amount\n• Schedule (monthly/one-time)\n• Bank account'
            })
        
        elif intent == 'hybrid_situation_to_order':
            return jsonify({
                'response': '🧠 I understand your situation. Would you like me to show you recommended items based on your needs?'
            })
        
        else:
            return jsonify({
                'response': 'How can I help you today? You can:\n\n• Order food from Swiggy/Zomato\n• Order groceries from Zepto/Blinkit\n• Track your orders\n• Schedule payments\n• Compare prices\n\nWhat would you like to do?'
            })
            
    except Exception as e:
        print(f"Error in generate-response: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'response': 'How can I help you today? You can order food, groceries, or track your orders!'})

if __name__ == '__main__':
    print('=' * 50)
    print('🚀 SabAI ML Service v4.1 (Fixed)')
    print('=' * 50)
    print('📍 Health: http://localhost:5001/health')
    print('📍 Classify: http://localhost:5001/classify')
    print('📍 Entities: http://localhost:5001/extract-entities')
    print('📍 Response: http://localhost:5001/generate-response')
    print('=' * 50)
    app.run(host='0.0.0.0', port=5001, debug=True, use_reloader=False)
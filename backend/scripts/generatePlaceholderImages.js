// backend/scripts/generatePlaceholderImages.js
// Run this to generate placeholder images with correct names

const fs = require('fs').promises;
const path = require('path');
const { createCanvas } = require('canvas');

// Define all required images
const requiredImages = {
  // Merchant logos
  merchants: [
    'swiggy.png', 'zomato.png', 'zepto.png', 'blinkit.png', 'amazon.png',
    'flipkart.png', 'myntra.png', 'ajio.png', 'netmeds.png', 'pharmeasy.png',
    'uber.png', 'ola.png', 'netflix.png', 'spotify.png', 'bookmyshow.png',
    'indianoil.png', 'udemy.png', 'dominos.png', 'pizzahut.png', 'kfc.png',
    'mcdonalds.png', 'burgerking.png', 'starbucks.png', 'croma.png',
    'reliance.png', 'tatacliq.png', 'nykaa.png', 'meesho.png', 'bigbasket.png',
    'dmart.png', 'sabai-pay.png', 'default.png'
  ],
  
  // Item images
  items: [
    'chicken-biryani.png', 'mutton-biryani.png', 'veg-biryani.png',
    'butter-chicken.png', 'chicken-curry.png', 'chicken-tikka.png',
    'paneer-butter-masala.png', 'paneer-tikka.png', 'shahi-paneer.png',
    'garlic-naan.png', 'butter-naan.png', 'roti.png',
    'jeera-rice.png', 'steamed-rice.png',
    'gulab-jamun.png', 'rasmalai.png', 'kheer.png', 'ice-cream.png',
    'soft-drink.png', 'coke.png', 'pepsi.png', 'masala-chai.png',
    'cold-coffee.png', 'lassi.png', 'default.png'
  ]
};

async function generatePlaceholderImage(filePath, text, color) {
  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 200, 200);
  
  // Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Wrap text if too long
  const words = text.split('-');
  if (words.length > 1) {
    ctx.fillText(words[0], 100, 90);
    ctx.fillText(words.slice(1).join('-'), 100, 120);
  } else {
    ctx.fillText(text, 100, 100);
  }
  
  // Save
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(filePath, buffer);
  console.log(`✅ Created: ${filePath}`);
}

async function generateAllPlaceholders() {
  const itemsPath = path.join(__dirname, '../../frontend/public/images/items');
  const merchantsPath = path.join(__dirname, '../../frontend/public/images/merchants');
  const banksPath = path.join(__dirname, '../../frontend/public/images/banks');
  
  // Create directories
  await fs.mkdir(itemsPath, { recursive: true });
  await fs.mkdir(merchantsPath, { recursive: true });
  await fs.mkdir(banksPath, { recursive: true });
  
  // Generate merchant logos
  console.log('📦 Generating merchant logos...');
  for (const file of requiredImages.merchants) {
    const name = file.replace('.png', '');
    const color = name === 'swiggy' ? '#fc8019' :
                  name === 'zomato' ? '#cb202d' :
                  name === 'zepto' ? '#1f2937' :
                  name === 'amazon' ? '#ff9900' :
                  name === 'flipkart' ? '#2874f0' :
                  name === 'myntra' ? '#e45c5c' :
                  '#4f46e5';
    await generatePlaceholderImage(path.join(merchantsPath, file), name, color);
  }
  
  // Generate item images
  console.log('📦 Generating item images...');
  for (const file of requiredImages.items) {
    const name = file.replace('.png', '');
    const color = name.includes('biryani') ? '#f59e0b' :
                  name.includes('chicken') ? '#ef4444' :
                  name.includes('paneer') ? '#10b981' :
                  name.includes('naan') ? '#d97706' :
                  '#4f46e5';
    await generatePlaceholderImage(path.join(itemsPath, file), name, color);
  }
  
  console.log('🎉 All placeholder images generated!');
  console.log(`📁 Items: ${itemsPath}`);
  console.log(`📁 Merchants: ${merchantsPath}`);
  console.log(`📁 Banks: ${banksPath}`);
}

generateAllPlaceholders().catch(console.error);
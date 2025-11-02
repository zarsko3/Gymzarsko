/**
 * Icon Generator Script for PWA
 * 
 * This script generates all required icon sizes from the source SVG
 * 
 * REQUIREMENTS:
 * npm install sharp --save-dev
 * 
 * USAGE:
 * node scripts/generate-icons.js
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const sizes = [
  16, 32, 72, 96, 128, 144, 152, 167, 180, 192, 384, 512
]

const inputSvg = path.join(__dirname, '../public/icon.svg')
const outputDir = path.join(__dirname, '../public')

async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n')

  if (!fs.existsSync(inputSvg)) {
    console.error('❌ Error: icon.svg not found in public directory')
    process.exit(1)
  }

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`)
    
    try {
      await sharp(inputSvg)
        .resize(size, size)
        .png()
        .toFile(outputPath)
      
      console.log(`✅ Generated: icon-${size}x${size}.png`)
    } catch (error) {
      console.error(`❌ Error generating ${size}x${size}:`, error.message)
    }
  }

  console.log('\n✨ All icons generated successfully!')
  console.log('\n📝 Next steps:')
  console.log('   1. Review generated icons in /public directory')
  console.log('   2. Optionally generate splash screens (see docs)')
  console.log('   3. Deploy your PWA!')
}

generateIcons().catch(console.error)


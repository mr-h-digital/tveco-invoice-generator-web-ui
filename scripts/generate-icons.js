const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const logoPath = path.join(__dirname, '../src/assets/tveco-logo.png');
const resDir = path.join(__dirname, '../android/app/src/main/res');

const sizes = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

async function generateIcons() {
  console.log('Generating Android icons from TVECO logo...');
  
  for (const { dir, size } of sizes) {
    const dirPath = path.join(resDir, dir);
    
    // Ensure directory exists
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✓ Created ${dir}`);
    }

    // Generate ic_launcher.png
    await sharp(logoPath)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(dirPath, 'ic_launcher.png'));
    
    // Generate ic_launcher_foreground.png (for adaptive icons)
    await sharp(logoPath)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(dirPath, 'ic_launcher_foreground.png'));
    
    // Generate ic_launcher_round.png
    await sharp(logoPath)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(dirPath, 'ic_launcher_round.png'));

    console.log(`✓ Generated icons for ${dir} (${size}x${size}px)`);
  }

  console.log('✓ All Android icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});

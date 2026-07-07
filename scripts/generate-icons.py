#!/usr/bin/env python3
from PIL import Image
import os
import sys

logo_path = '../src/assets/tveco-logo.png'
res_dir = '../android/app/src/main/res'

sizes = [
    ('mipmap-mdpi', 48),
    ('mipmap-hdpi', 72),
    ('mipmap-xdpi', 96),
    ('mipmap-xxhdpi', 144),
    ('mipmap-xxxhdpi', 192),
]

def generate_icons():
    print('Generating Android icons from TVECO logo...')
    
    # Open the original logo
    try:
        img = Image.open(logo_path)
        print(f'✓ Loaded logo: {logo_path} ({img.size[0]}x{img.size[1]}px)')
    except Exception as e:
        print(f'✗ Error loading logo: {e}')
        sys.exit(1)
    
    for dir_name, size in sizes:
        dir_path = os.path.join(res_dir, dir_name)
        
        # Create directory if it doesn't exist
        os.makedirs(dir_path, exist_ok=True)
        
        # Resize image
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        
        # Save icon files
        for icon_name in ['ic_launcher.png', 'ic_launcher_foreground.png', 'ic_launcher_round.png']:
            icon_path = os.path.join(dir_path, icon_name)
            resized.save(icon_path, 'PNG')
        
        print(f'✓ Generated icons for {dir_name} ({size}x{size}px)')
    
    print('✓ All Android icons generated successfully!')

if __name__ == '__main__':
    generate_icons()

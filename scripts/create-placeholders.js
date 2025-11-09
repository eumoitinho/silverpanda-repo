#!/usr/bin/env node

/**
 * Script to create placeholder SVG images for the Peggy Gou website clone
 * Run with: node scripts/create-placeholders.js
 */

const fs = require('fs');
const path = require('path');

// Create placeholder SVG function
function createPlaceholderSVG(width, height, text, backgroundColor = '#1a1a1a', textColor = 'rgba(255,255,255,0.3)') {
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${backgroundColor}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="${textColor}" 
        text-anchor="middle" dy=".3em" font-weight="300" letter-spacing="2px">${text}</text>
</svg>`;
}

// Image configurations
const images = {
    music: [
        { name: 'find-the-way.jpg', text: 'Find The Way' },
        { name: 'i-hear-you.jpg', text: 'I Hear You' },
        { name: '1plus1.jpg', text: '1+1=11' },
        { name: 'i-believe-in-love.jpg', text: 'I Believe In Love' },
        { name: 'nanana.jpg', text: 'Nanana' },
        { name: 'i-go.jpg', text: 'I Go' },
        { name: 'nabi.jpg', text: 'Nabi' },
        { name: 'it-makes-you-forget.png', text: 'It Makes You Forget' },
        { name: 'dj-kicks.jpg', text: 'DJ-Kicks' }
    ],
    videos: [
        { name: 'i-go.jpg', text: 'I Go' },
        { name: 'starry-night.jpg', text: 'Starry Night' }
    ],
    press: [
        { name: 'billboard.jpg', text: 'Billboard' },
        { name: 'lofficiel.jpg', text: 'L\'Officiel' },
        { name: 'vogue.jpg', text: 'Vogue' },
        { name: 'pop.jpg', text: 'POP' },
        { name: 'flaunt.jpg', text: 'Flaunt' },
        { name: 'vanity-fair.jpg', text: 'Vanity Fair' }
    ],
    info: [
        { name: 'peggy-gou.jpg', text: 'Peggy Gou' }
    ]
};

// Create directories and files
function createPlaceholders() {
    const baseDir = path.join(__dirname, '..');
    
    Object.keys(images).forEach(category => {
        const categoryDir = path.join(baseDir, 'assets', category);
        
        // Ensure directory exists
        if (!fs.existsSync(categoryDir)) {
            fs.mkdirSync(categoryDir, { recursive: true });
        }
        
        images[category].forEach(image => {
            const filePath = path.join(categoryDir, image.name);
            
            // Only create if doesn't exist
            if (!fs.existsSync(filePath)) {
                // Determine dimensions based on category
                let width = 1000;
                let height = 1000;
                
                if (category === 'videos') {
                    width = 1920;
                    height = 1080;
                } else if (category === 'press') {
                    width = 800;
                    height = 1067; // Standard magazine ratio
                } else if (category === 'info') {
                    width = 800;
                    height = 1067;
                }
                
                const svg = createPlaceholderSVG(width, height, image.text);
                const svgPath = filePath.replace(/\.(jpg|png)$/, '.svg');
                
                fs.writeFileSync(svgPath, svg);
                console.log(`Created: ${svgPath}`);
            } else {
                console.log(`Exists: ${filePath}`);
            }
        });
    });
    
    console.log('\nPlaceholder images created!');
    console.log('Note: These are SVG placeholders. Replace with actual images when available.');
}

// Run the script
createPlaceholders();


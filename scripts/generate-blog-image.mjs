import sharp from 'sharp';

const W = 1200;
const H = 630;
const GOLD = '#C9A96E';
const TEAL = 'rgba(45, 168, 130, 0.25)';
const PURPLE = 'rgba(139, 92, 246, 0.18)';
const BLUE = 'rgba(59, 130, 246, 0.14)';
const PINK = 'rgba(244, 114, 182, 0.10)';

const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g1" cx="22%" cy="28%" r="55%">
      <stop offset="0%" stop-color="rgba(201,169,110,0.35)"/>
      <stop offset="100%" stop-color="rgba(10,10,18,0)"/>
    </radialGradient>
    <radialGradient id="g2" cx="78%" cy="65%" r="50%">
      <stop offset="0%" stop-color="${TEAL}"/>
      <stop offset="100%" stop-color="rgba(10,10,18,0)"/>
    </radialGradient>
    <radialGradient id="g3" cx="50%" cy="15%" r="40%">
      <stop offset="0%" stop-color="${PURPLE}"/>
      <stop offset="100%" stop-color="rgba(10,10,18,0)"/>
    </radialGradient>
    <radialGradient id="g4" cx="85%" cy="30%" r="35%">
      <stop offset="0%" stop-color="${BLUE}"/>
      <stop offset="100%" stop-color="rgba(10,10,18,0)"/>
    </radialGradient>
    <radialGradient id="g5" cx="35%" cy="78%" r="30%">
      <stop offset="0%" stop-color="${PINK}"/>
      <stop offset="100%" stop-color="rgba(10,10,18,0)"/>
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="softglow">
      <feGaussianBlur stdDeviation="6"/>
    </filter>
  </defs>

  <!-- Base -->
  <rect width="${W}" height="${H}" fill="#0A0A12"/>
  <rect width="${W}" height="${H}" fill="url(#g1)"/>
  <rect width="${W}" height="${H}" fill="url(#g2)"/>
  <rect width="${W}" height="${H}" fill="url(#g3)"/>
  <rect width="${W}" height="${H}" fill="url(#g4)"/>
  <rect width="${W}" height="${H}" fill="url(#g5)"/>

  <!-- Dot grid -->
  <g fill="rgba(201,169,110,0.20)">
    ${Array.from({length: 80}, (_, i) => {
      const x = (i * 37 + 13) % 1160 + 20;
      const y = (i * 53 + 29) % 600 + 15;
      return `<circle cx="${x}" cy="${y}" r="${i % 3 === 0 ? 1.5 : 1}"/>`;
    }).join('\n    ')}
  </g>

  <!-- Sound wave arcs (center) -->
  <g transform="translate(${W/2}, ${H/2 - 20})" fill="none" stroke="rgba(201,169,110,0.25)" stroke-width="1.5" stroke-linecap="round" filter="url(#softglow)">
    <path d="M-280,0 Q-140,-90 0,0 Q140,90 280,0"/>
    <path d="M-230,0 Q-115,-70 0,0 Q115,70 230,0"/>
    <path d="M-180,0 Q-90,-50 0,0 Q90,50 180,0"/>
    <path d="M-130,0 Q-65,-30 0,0 Q65,30 130,0"/>
  </g>

  <!-- Musical note left -->
  <g transform="translate(280, 200) rotate(-15)" fill="none" stroke="rgba(201,169,110,0.35)" stroke-width="2" filter="url(#glow)">
    <ellipse cx="0" cy="30" rx="20" ry="15"/>
    <line x1="16" y1="22" x2="16" y2="-55"/>
    <path d="M16,-55 Q30,-50 30,-35" fill="none" stroke-width="2"/>
  </g>

  <!-- Musical note right -->
  <g transform="translate(850, 380) rotate(10)" fill="none" stroke="rgba(45,168,130,0.30)" stroke-width="2" filter="url(#glow)">
    <ellipse cx="0" cy="25" rx="16" ry="12"/>
    <line x1="13" y1="18" x2="13" y2="-45"/>
    <path d="M13,-45 Q24,-42 24,-30" fill="none" stroke-width="2"/>
  </g>

  <!-- Musical note small -->
  <g transform="translate(350, 450) rotate(-20)" fill="none" stroke="rgba(139,92,246,0.25)" stroke-width="1.5" filter="url(#glow)">
    <ellipse cx="0" cy="20" rx="14" ry="10"/>
    <line x1="11" y1="15" x2="11" y2="-35"/>
    <path d="M11,-35 Q20,-33 20,-25" fill="none" stroke-width="1.5"/>
  </g>

  <!-- Brain-like geometric pattern center -->
  <g transform="translate(${W/2}, ${H/2 - 20})" fill="none" stroke="rgba(201,169,110,0.10)" stroke-width="0.8">
    <path d="M-90,-45 Q-45,-90 0,-45 Q45,-90 90,-45 Q70,0 90,45 Q45,90 0,45 Q-45,90 -90,45 Q-70,0 -90,-45Z"/>
    <path d="M-60,-25 Q-30,-55 0,-25 Q30,-55 60,-25 Q45,0 60,25 Q30,55 0,25 Q-30,55 -60,25 Q-45,0 -60,-25Z"/>
    <path d="M-30,-12 Q-15,-28 0,-12 Q15,-28 30,-12 Q20,0 30,12 Q15,28 0,12 Q-15,28 -30,12 Q-20,0 -30,-12Z"/>
  </g>

  <!-- Small floating dots with glow -->
  <g filter="url(#softglow)" fill="rgba(201,169,110,0.15)">
    <circle cx="150" cy="120" r="3"/>
    <circle cx="1050" cy="150" r="4"/>
    <circle cx="700" cy="500" r="3"/>
    <circle cx="500" cy="100" r="2.5"/>
    <circle cx="950" cy="520" r="3.5"/>
  </g>
</svg>`;

async function main() {
  // Create the image: SVG overlay on dark background
  const svgBuffer = Buffer.from(svg);
  
  await sharp(svgBuffer)
    .webp({ quality: 90, alphaQuality: 90 })
    .toFile('public/images/blog/vliyanie-pesen-na-podsoznanie.webp');

  // Also create a smaller thumbnail version
  await sharp(svgBuffer)
    .resize(600, 315)
    .webp({ quality: 85 })
    .toFile('public/images/blog/vliyanie-pesen-na-podsoznanie-thumb.webp');

  console.log('✅ WebP images created successfully');
  console.log('  - public/images/blog/vliyanie-pesen-na-podsoznanie.webp (1200x630)');
  console.log('  - public/images/blog/vliyanie-pesen-na-podsoznanie-thumb.webp (600x315)');
}

main().catch(console.error);

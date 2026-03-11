import fs from 'fs'

let content = fs.readFileSync('app/products/page.tsx', 'utf8')

const newIcons = `const ROOT_ICONS: Record<string, string> = {
  'Adulte': '🔞',
  'Alimentation, boissons et tabac': '🍎',
  'Animaux et articles pour animaux de compagnie': '🐾',
  'Appareils photo, caméras et instruments d\\'optique': '📷',
  'Appareils électroniques': '📱',
  'Arts et loisirs': '🎨',
  'Articles de sport': '⚽',
  'Bagages et maroquinerie': '🧳',
  'Bébés et tout-petits': '👶',
  'Commerce et industrie': '🏭',
  'Entreprise et industrie': '🏭',
  'Équipements sportifs': '⚽',
  'Fournitures de bureau': '📎',
  'Jeux et jouets': '🎮',
  'Logiciels': '💻',
  'Maison et jardin': '🏠',
  'Meubles': '🛋️',
  'Médias': '🎬',
  'Quincaillerie': '🔧',
  'Santé et beauté': '✨',
  'Véhicules et accessoires': '🚗',
  'Vêtements et accessoires': '👕',
  'Armes': '🔫',
  'Autres': '❓'
}`

content = content.replace(/const ROOT_ICONS: Record<string, string> = \{[\s\S]*?\n\}/, newIcons)

fs.writeFileSync('app/products/page.tsx', content)
console.log('Icons perfectly replaced!')

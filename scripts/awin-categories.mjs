// Rangement des offres Awin dans les rayons du site.
//
// Les catalogues Awin n'utilisent pas le classement de Google : ils donnent une
// catégorie Awin (souvent vide, en anglais) et la catégorie libre du marchand
// (en français, parfois en espagnol). Ces règles traduisent ces libellés vers
// une catégorie de la table `google_categories` du site.
//
// La première règle qui correspond l'emporte : les plus précises sont donc en
// tête. Un libellé qu'aucune règle ne reconnaît laisse l'offre sans rayon ; le
// rapport de l'import (AWIN_SHOW_CATEGORIES=1) liste ces libellés.

const V = 'Vêtements et accessoires'
const E = 'Appareils électroniques'
const EA = `${E} > Accessoires électroniques`
const EC = `${EA} > Composants d'ordinateur`

/** [expression testée sur le libellé en minuscules, identifiant, chemin] */
export const CATEGORY_RULES = [
  // --- Chaussures et vêtements -------------------------------------------------
  [/entretien des chaussures/, 1933, `${V} > Accessoires pour chaussures`],
  [/chaussettes|calcetines|\bsocks\b/, 209, `${V} > Vêtements > Sous-vêtements et chaussettes > Chaussettes`],
  [/baskets|zapatillas|sabots|sandales|sandalias|bottes|\bbotas\b|tongs|chaussures|footwear|sneakers|trainers/, 187, `${V} > Chaussures`],
  [/maillots? de bain|bañadores|swimwear/, 211, `${V} > Vêtements > Vêtements de bain`],
  [/\bshorts?\b|bermudas/, 207, `${V} > Vêtements > Shorts`],
  [/pantalons?|pantalones|\bjeans\b|trousers/, 204, `${V} > Vêtements > Pantalons`],
  [/vestes?|chaquetas|manteaux|abrigos|jackets|coats/, 5598, `${V} > Vêtements > Vêtements de plein air > Manteaux et vestes`],
  [/t-shirts?|camisetas|chemises|camisas|\bpolos?\b|sweats?|sudaderas|\bpulls?\b|jers[ée]is|hoodies|knitwear/, 212, `${V} > Vêtements > Hauts`],
  [/\bjupes?\b|faldas/, 1581, `${V} > Vêtements > Jupes`],
  [/\brobes?\b|vestidos/, 2271, `${V} > Vêtements > Robes`],
  [/casquettes?|gorras|bonnets?|gorros|chapeaux|\bhats\b/, 173, `${V} > Accessoires d'habillement > Chapeaux`],
  [/lunettes|gafas|sunglasses/, 178, `${V} > Accessoires d'habillement > Lunettes de soleil`],
  [/ceintures?|cinturones|\bbelts\b/, 169, `${V} > Accessoires d'habillement > Ceintures`],
  [/sacs? à dos|mochilas|backpacks/, 100, 'Bagages et maroquinerie > Sacs à dos'],
  [/laptop bags/, 279, `${EA} > Accessoires pour ordinateurs`],
  [/\bsacs?\b|bolsos|portefeuilles?|carteras|wallets|handbags/, 6551, `${V} > Sacs à main, portefeuilles et étuis`],
  [/general clothing/, 1604, `${V} > Vêtements`],
  [/clothing accessories/, 167, `${V} > Accessoires d'habillement`],

  // --- Informatique ------------------------------------------------------------
  [/accessoires ordinateurs portables/, 279, `${EA} > Accessoires pour ordinateurs`],
  [/ordinateurs? portables?|laptops/, 328, `${E} > Ordinateurs > Ordinateurs portables`],
  [/bo[îi]tier externe|stockage|storage media|disques? durs?|\bssd\b/, 2414, `${EC} > Périphériques de stockage`],
  [/bo[îi]tier pc/, 293, `${EC} > Boîtiers et baies d'ordinateur`],
  [/alimentation pc|power supplies/, 291, `${EC} > Alimentations pour ordinateurs`],
  [/mémoire ram|\bram\b/, 288, `${EA} > Mémoire`],
  [/souris|\bmice\b/, 304, `${EC} > Périphériques de saisie > Souris et trackballs`],
  [/claviers?|keyboards/, 303, `${EC} > Périphériques de saisie > Claviers`],
  [/[ée]crans?|monitors/, 305, `${E} > Vidéo > Écrans d'ordinateur`],
  [/watercooling|ventilateur|refroidissement|\bfans\b|carte mère|motherboards|carte graphique|graphics cards|sound cards|processeur|computer components|input devices/, 285, EC],
  [/cartouche|\btoner|printer consumables/, 502990, `${E} > Impression, copie, numérisation et télécopie > Accessoires pour imprimantes, copieurs et télécopieurs`],
  [/imprimante|scanneur|printers/, 500106, `${E} > Impression, copie, numérisation et télécopie > Imprimantes, copieurs et télécopieurs`],
  [/hub usb|hubs & switches/, 2455, `${E} > Réseaux > Hubs et commutateurs`],
  [/câble réseau|wi-?fi|wireless|réseau|networking|routers?/, 342, `${E} > Réseaux`],
  [/adaptateurs?/, 258, `${EA} > Adaptateurs`],
  [/c[âa]bles?/, 259, `${EA} > Câbles pour appareils électroniques`],
  [/chargeurs?/, 505295, `${EA} > Alimentation > Adaptateurs de courant et chargeurs`],
  [/\bpiles?\b|batteries/, 276, `${EA} > Alimentation > Piles`],
  [/casques?|headsets|headphones/, 505771, `${E} > Audio > Composants audio > Casques Audio & Écouteurs`],
  [/microphones?/, 234, `${E} > Audio > Composants audio > Microphones`],
  [/enceintes?|haut-parleurs?|speakers/, 249, `${E} > Audio > Composants audio > Enceintes et haut-parleurs`],
  [/audio/, 223, `${E} > Audio`],
  [/webcams?/, 312, "Appareils photo, caméras et instruments d'optique > Appareils photo et caméras > Webcams"],
  [/mobile phone accessories|accessoires? (pour )?t[ée]l[ée]phones?/, 264, `${E} > Communications > Téléphonie > Accessoires pour téléphones mobiles`],
  [/t[ée]l[ée]viseurs?|televisions/, 404, `${E} > Vidéo > Téléviseurs`],
  [/console accessories|accessoires? (pour )?consoles?/, 1270, `${E} > Accessoires pour consoles de jeu vidéo`],
  [/video games|jeux vidéo/, 1279, 'Logiciels > Jeux vidéo'],
  [/software|logiciels?/, 2092, 'Logiciels'],
  [/home entertainment/, 386, `${E} > Vidéo`],
  [/\bcameras?\b|appareils? photo/, 141, "Appareils photo, caméras et instruments d'optique"],
  [/\bordinateurs?\b|\bcomputers\b/, 278, `${E} > Ordinateurs`],

  // --- Jeux, modélisme, livres ---------------------------------------------------
  [/jeux de cartes|card games/, 1247, 'Jeux et jouets > Jeux > Jeux de cartes'],
  [/peintures?|modélisme|modelisme/, 5999, 'Arts et loisirs > Loisirs et arts créatifs > Modélisme'],
  [/warhammer|action figures|figurines?/, 1255, 'Jeux et jouets > Jouets > Poupées, coffrets et figurines'],
  [/jeux de r[ôo]le|jeux pour famille|jeux spécialistes|jeu de plateaux?|jeux de société|games, puzzles/, 1246, 'Jeux et jouets > Jeux > Jeux de plateau'],
  [/\btoys\b|jouets?/, 1253, 'Jeux et jouets > Jouets'],
  [/librairie|\bbooks\b|\blivres?\b/, 784, 'Médias > Livres'],

  // --- Maison ---------------------------------------------------------------------
  [/fauteuils?|\bchairs\b/, 443, 'Meubles > Fauteuils'],
  [/lighting|luminaires?|[ée]clairage/, 594, 'Maison et jardin > Luminaires'],
  [/home accessories|décorations?/, 696, 'Maison et jardin > Décorations'],
  [/furniture|meubles?/, 436, 'Meubles'],

  // --- Compléments (libellés moins fréquents) ---------------------------------------
  [/cuisine et dinette/, 1253, 'Jeux et jouets > Jouets'],
  [/poupées?/, 1257, 'Jeux et jouets > Jouets > Poupées, coffrets et figurines > Poupées'],
  [/star wars|marvel/, 1255, 'Jeux et jouets > Jouets > Poupées, coffrets et figurines'],
  [/décors|pinceaux|a[ée]rographes?|arts plastiques/, 5999, 'Arts et loisirs > Loisirs et arts créatifs > Modélisme'],
  [/\bjeux?\b|gamemat/, 3793, 'Jeux et jouets > Jeux'],
  [/onduleurs?|multiprises?/, 3160, `${EA} > Alimentation > Multiprises & parasurtenseurs`],
  [/alimentation/, 275, `${EA} > Alimentation`],
  [/lecteurs? de cartes/, 505801, `${EC} > Périphériques de saisie > Lecteurs de cartes électroniques`],
  [/serveur nas/, 2414, `${EC} > Périphériques de stockage`],
  [/fibre optique|injecteurs? poe/, 342, `${E} > Réseaux`],
  [/smartphones?|coque|protection téléphone/, 264, `${E} > Communications > Téléphonie > Accessoires pour téléphones mobiles`],
  [/caméra ip/, 364, "Maison et jardin > Sécurité à domicile et au bureau > Systèmes de surveillance et d'enregistrement"],
  [/consoles?/, 1270, `${E} > Accessoires pour consoles de jeu vidéo`],
  [/tablettes?|réalité virtuelle/, 222, E],
  [/maintenance du pc|personnalisation du setup|streaming|confort des joueurs|connectique|carte contrôleur|rack amovible|support optique|support et station|périphériques de saisie/, 279, `${EA} > Accessoires pour ordinateurs`],
  [/préparation culinaire|ustensiles|cuisson|vaisselle|[ée]lectroménager/, 536, 'Maison et jardin'],
  [/[ée]criture|stylos|cahiers|fournitures|protection des documents|classement|support imprimable|etui cd/, 922, 'Fournitures de bureau'],
  [/outillage/, 632, 'Quincaillerie'],
  [/déguisements?/, 184, `${V} > Déguisements et accessoires`],
  [/gilets?/, 1831, `${V} > Vêtements > Vêtements de plein air > Gilets et vestes sans manches`],
  [/(?<![a-zà-ÿ])gants?(?![a-zà-ÿ])/, 170, `${V} > Accessoires d'habillement > Gants et moufles`],

  // --- Libellés génériques, en dernier ---------------------------------------------
  [/^accessoires$|^accesorios$| \| accessoires$| \| accesorios$/, 167, `${V} > Accessoires d'habillement`],
]

/**
 * Catégorie du site pour une offre, à partir de son libellé d'origine
 * (« catégorie Awin | catégorie du marchand »). Renvoie null si aucune règle
 * ne correspond.
 */
export function mapCategory(sourceCategory) {
  const label = String(sourceCategory ?? '').trim().toLowerCase()
  if (!label) return null
  // La catégorie du marchand est plus précise que celle d'Awin : on la teste d'abord.
  const parts = label.split(' | ')
  const candidates = parts.length > 1 ? [parts[parts.length - 1], label] : [label]
  for (const candidate of candidates) {
    for (const [pattern, id, path] of CATEGORY_RULES) {
      if (pattern.test(candidate)) return { id, path }
    }
  }
  return null
}

export function formatPrice(value: number | null, currency: string | null) {
  if (value == null) return null
  const cur = currency || 'EUR'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: cur }).format(value)
}

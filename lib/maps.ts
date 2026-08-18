/**
 * Resolve a URL do Google Maps pra um botão "Como chegar": usa a URL
 * cadastrada manualmente pelo admin se existir (nunca sobrescrita
 * automaticamente), senão gera uma busca a partir do endereço.
 */
export function resolveMapsUrl(googleMapsUrl: string | null, address: string | null): string | null {
  if (googleMapsUrl) return googleMapsUrl
  if (address) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  return null
}

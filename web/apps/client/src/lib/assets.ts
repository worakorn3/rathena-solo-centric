export function getItemIconUrl(nameId: number): string {
  if (!nameId || nameId <= 0) return "";
  return `https://static.divine-pride.net/images/items/item/${nameId}.png`;
}

export function getCardImgUrl(cardId: number): string {
  if (!cardId || cardId <= 0) return "";
  return `https://static.divine-pride.net/images/items/cards/${cardId}.png`;
}

export function getMobSpriteUrl(mobId: number): string {
  if (!mobId || mobId <= 0) return "";
  return `https://static.divine-pride.net/images/mobs/png/${mobId}.png`;
}

export function formatZeny(amount: number): string {
  return new Intl.NumberFormat("en-US").format(Math.floor(amount || 0));
}

export function formatExp(amount: number): string {
  return new Intl.NumberFormat("en-US").format(Math.floor(amount || 0));
}

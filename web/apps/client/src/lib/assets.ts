export function getItemIconUrl(nameId: number): string {
  if (!nameId || nameId <= 0) return "";
  return `/api/assets/item/${nameId}`;
}

export function getCardImgUrl(cardId: number): string {
  if (!cardId || cardId <= 0) return "";
  return `/api/assets/item/${cardId}`;
}

export function getMobSpriteUrl(mobId: number): string {
  if (!mobId || mobId <= 0) return "";
  return `/api/assets/mob/${mobId}`;
}

export function formatZeny(amount: number): string {
  return new Intl.NumberFormat("en-US").format(Math.floor(amount || 0));
}

export function formatExp(amount: number): string {
  return new Intl.NumberFormat("en-US").format(Math.floor(amount || 0));
}

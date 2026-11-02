/**
 * Display-only spell MP amount. A spell's level is its default MP amount;
 * a non-negative manual mp_cost/mpCost override can be set per spell.
 * Description sends never spend MP. Dice/Use actions spend MP by spell level on the server.
 */
export function spellMpAmount(spell = {}, levelNumber = 0) {
  const item = spell && typeof spell === 'object' ? spell : {};
  const explicit = [item.mp_cost, item.mpCost, item.mp_amount, item.mpAmount]
    .find(value => value !== undefined && value !== null && String(value).trim() !== '');
  const source = explicit === undefined ? levelNumber : explicit;
  const parsed = Number(source);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : Math.max(0, Math.trunc(Number(levelNumber) || 0));
}
export function spellMpText(spell = {}, levelNumber = 0) {
  return spellMpAmount(spell, levelNumber) + ' MP';
}

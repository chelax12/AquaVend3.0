export const getCoinStatus = (count: number): { level: 'OPTIMAL' | 'NOTIFY' | 'REFILL_NEEDED' | 'REFILL_IMMEDIATELY' | 'EMPTY'; text: string } => {
  if (count <= 0) {
    return { level: 'EMPTY', text: 'NO CHANGE AVAILABLE' };
  }
  if (count <= 20) {
    return { level: 'REFILL_IMMEDIATELY', text: 'REFILL IMMEDIATELY' };
  }
  if (count <= 50) {
    return { level: 'REFILL_NEEDED', text: 'REFILL NEEDED' };
  }
  if (count <= 100) {
    return { level: 'NOTIFY', text: 'NOTIFY' };
  }
  return { level: 'OPTIMAL', text: 'OPTIMAL' };
};

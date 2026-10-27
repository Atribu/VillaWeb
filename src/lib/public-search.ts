export function validSearchStay(checkIn: string, checkOut: string, today: string) {
  if (!checkIn && !checkOut) return true;
  const valid = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T12:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  return valid(checkIn) && valid(checkOut) && checkIn >= today && checkOut > checkIn;
}

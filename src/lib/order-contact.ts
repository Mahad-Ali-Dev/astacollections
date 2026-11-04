const digitsOf = (s: string) => s.replace(/\D/g, "");

/**
 * Whether what a buyer typed on the tracking form is the email or phone on the
 * order. Email is optional at checkout, so phone has to work too. Phones compare
 * on the last 10 digits, so 0300... and +92 300... are the same number.
 */
export function orderContactMatches(
  order: { customerEmail: string; customerPhone: string },
  contact: string
): boolean {
  const value = contact.trim().toLowerCase();
  if (value.includes("@")) return value === order.customerEmail.toLowerCase();

  const given = digitsOf(value);
  const stored = digitsOf(order.customerPhone);
  if (given.length < 10 || stored.length < 10) return false;
  return given.slice(-10) === stored.slice(-10);
}

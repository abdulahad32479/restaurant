export const formatCurrency = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return 'PKR 0.00';
  const num = typeof value === 'string' ? Number(value) : Number(value);
  if (isNaN(num)) return 'PKR 0.00';
  return `PKR ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

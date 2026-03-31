export const formatCurrency = (value: string | number): string => {
  const num = typeof value === 'string' ? Number(value) : value;
  if (isNaN(num)) return 'PKR 0.00';
  return `PKR ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

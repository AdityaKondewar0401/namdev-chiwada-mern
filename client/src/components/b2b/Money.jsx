import { formatCurrency } from '../../utils/b2bFormat';

export default function Money({ value, className }) {
  return <span className={className}>{formatCurrency(value)}</span>;
}

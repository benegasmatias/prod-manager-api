import { formatCurrency } from '@/src/lib/utils'

interface MoneyProps {
    amount: number
    className?: string
}

export function Money({ amount, className }: MoneyProps) {
    return <span className={className}>{formatCurrency(amount)}</span>
}

import { Card, CardContent } from '@/src/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    description?: string
    trend?: {
        value: number
        label: string
        isPositive: boolean
    }
}

export function StatCard({ title, value, icon: Icon, description, trend }: StatCardProps) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
                    <Icon className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="mt-2">
                    <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
                    {(description || trend) && (
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            {trend && (
                                <span className={trend.isPositive ? 'text-emerald-500' : 'text-red-500'}>
                                    {trend.isPositive ? '+' : '-'}{trend.value}%
                                </span>
                            )}
                            {trend && ' '}{description}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

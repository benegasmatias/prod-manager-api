import { formatDate } from '@/src/lib/utils'
import { Calendar } from 'lucide-react'

interface DateTagProps {
    date: Date
    className?: string
}

export function DateTag({ date, className }: DateTagProps) {
    return (
        <div className={`flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 ${className}`}>
            <Calendar className="h-4 w-4" />
            <span>{formatDate(date)}</span>
        </div>
    )
}

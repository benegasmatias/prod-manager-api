import { Badge } from '@/src/components/ui/badge'
import { Priority } from '@/src/types'

interface BadgeUrgenciaProps {
    urgencia: Priority
}

export function BadgeUrgencia({ urgencia }: BadgeUrgenciaProps) {
    const variants: Record<Priority, "destructive" | "warning" | "success"> = {
        VENCIDO: "destructive",
        PRÓXIMO: "warning",
        "EN TIEMPO": "success",
    }

    return (
        <Badge variant={variants[urgencia]} className="font-bold">
            {urgencia}
        </Badge>
    )
}

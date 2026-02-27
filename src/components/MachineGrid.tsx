import { Machine } from '@/src/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Cpu, Play, Settings, AlertTriangle } from 'lucide-react'

interface MachineGridProps {
    machines: Machine[]
}

export function MachineGrid({ machines }: MachineGridProps) {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {machines.map((machine) => {
                const statusColors = {
                    Libre: "success",
                    Ocupada: "warning",
                    Mantenimiento: "destructive"
                } as const

                return (
                    <Card key={machine.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {machine.name}
                            </CardTitle>
                            <Cpu className="h-4 w-4 text-zinc-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-zinc-500 uppercase font-bold">{machine.type}</span>
                                <Badge variant={statusColors[machine.status]}>{machine.status}</Badge>
                            </div>

                            <div className="mt-6 space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    {machine.status === 'Ocupada' ? (
                                        <>
                                            <Play className="h-3 w-3 text-emerald-500 fill-emerald-500" />
                                            <span>Trabajando en: <span className="font-bold">{machine.currentJobId}</span></span>
                                        </>
                                    ) : machine.status === 'Mantenimiento' ? (
                                        <>
                                            <AlertTriangle className="h-3 w-3 text-red-500" />
                                            <span>Fuera de servicio</span>
                                        </>
                                    ) : (
                                        <span className="text-zinc-400 italic">Esperando trabajo...</span>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <p className="text-xs text-zinc-500 font-medium">Próximos en cola ({machine.queue.length}):</p>
                                    {machine.queue.length > 0 ? (
                                        <div className="flex gap-2">
                                            {machine.queue.map(jobId => (
                                                <Badge key={jobId} variant="outline" className="text-[10px]">{jobId}</Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-zinc-400 italic">Cola vacía</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 flex gap-2">
                                <button className="flex-1 rounded border py-1.5 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900">
                                    Ver Detalles
                                </button>
                                <button className="flex-1 rounded border py-1.5 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900">
                                    Cambiar Estado
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}

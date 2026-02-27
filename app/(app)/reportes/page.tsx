import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { StatCard } from '@/src/components/StatCard'
import { TrendingUp, BarChart, PieChart, Calendar } from 'lucide-react'
import { Button } from '@/src/components/ui/button'

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Análisis detallado de rendimiento y finanzas.</p>
                </div>
                <Button className="gap-2">
                    <Calendar className="h-4 w-4" /> Exportar Reporte
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Eficiencia de Planta" value="84%" icon={BarChart} trend={{ value: 2, label: 'vs mes pasado', isPositive: true }} />
                <StatCard title="Promedio Margen" value="32.5%" icon={TrendingUp} trend={{ value: 1.2, label: 'vs mes pasado', isPositive: true }} />
                <StatCard title="Tiempo Promedio" value="4.2 días" icon={PieChart} trend={{ value: 0.5, label: 'vs mes pasado', isPositive: false }} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Ventas Mensuales</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center border-t">
                        <div className="flex flex-col items-center gap-2 text-zinc-400">
                            <BarChart className="h-10 w-10 opacity-20" />
                            <p className="text-sm italic">Gráfico de barras: Ventas por mes [Mock]</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Distribución por Producto</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center border-t">
                        <div className="flex flex-col items-center gap-2 text-zinc-400">
                            <PieChart className="h-10 w-10 opacity-20" />
                            <p className="text-sm italic">Gráfico de torta: % por tipo de producto [Mock]</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Rendimiento por Máquina</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[
                            { name: 'Offset Heildelberg', val: 92 },
                            { name: 'Guillotina Polar', val: 78 },
                            { name: 'Troqueladora', val: 45 }
                        ].map(m => (
                            <div key={m.name} className="space-y-1.5">
                                <div className="flex justify-between text-sm">
                                    <span>{m.name}</span>
                                    <span className="font-bold">{m.val}%</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                                    <div className="h-full rounded-full bg-zinc-900 dark:bg-zinc-50" style={{ width: `${m.val}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

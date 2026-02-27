'use client'

import { MachineGrid } from '@/src/components/MachineGrid'
import { MOCK_MACHINES_BY_NEGOCIO } from '@/src/lib/mock-data'
import { Button } from '@/src/components/ui/button'
import { Plus } from 'lucide-react'
import { useNegocio } from '@/src/context/NegocioContext'

export default function MachinesPage() {
    const { negocioActivoId, negocioActivo } = useNegocio()
    const machines = MOCK_MACHINES_BY_NEGOCIO[negocioActivoId] || []

    if (negocioActivo?.rubro !== 'IMPRESION_3D') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 px-4">
                <div className="bg-zinc-100 p-6 rounded-full dark:bg-zinc-800">
                    <Plus className="h-10 w-10 text-zinc-300 rotate-45" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">Módulo no disponible</h2>
                    <p className="text-sm text-zinc-500 max-w-xs mx-auto">
                        El rubro <span className="font-bold text-zinc-900 dark:text-zinc-100">{negocioActivo?.rubro}</span> no utiliza gestión de máquinas pesadas en esta configuración.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Máquinas</h1>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">Estado y monitoreo de maquinaria en tiempo real.</p>
                </div>
                <Button className="gap-2 w-full sm:w-auto shadow-sm">
                    <Plus className="h-4 w-4" /> Nueva Máquina
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-full sm:w-[240px] rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950 shadow-sm focus-within:ring-2 focus-within:ring-zinc-900/10 transition-all">
                    <select className="bg-transparent text-sm font-bold focus:outline-none w-full cursor-pointer appearance-none">
                        <option>Todos los estados</option>
                        <option>Libre</option>
                        <option>Ocupada</option>
                        <option>Mantenimiento</option>
                    </select>
                </div>
            </div>

            <MachineGrid machines={machines} />
        </div>
    )
}

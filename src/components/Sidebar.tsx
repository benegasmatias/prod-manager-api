'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/src/lib/utils'
import { useNegocio } from '@/src/context/NegocioContext'
import {
    LayoutDashboard,
    ShoppingCart,
    Users,
    Wrench,
    Cpu,
    BarChart3,
    Settings,
    Package
} from 'lucide-react'

const MENU_ITEMS_BASE = [
    { label: 'Panel', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Pedidos', href: '/pedidos', icon: ShoppingCart },
    { label: 'Clientes', href: '/clientes', icon: Users },
    { label: 'Producción', href: '/produccion', icon: Cpu },
    { label: 'Máquinas', href: '/maquinas', icon: Wrench },
    { label: 'Reportes', href: '/reportes', icon: BarChart3 },
    { label: 'Ajustes', href: '/ajustes', icon: Settings },
]

interface NavigationProps {
    onItemClick?: () => void
}

export function SidebarContent({ onItemClick }: NavigationProps) {
    const pathname = usePathname()
    const { config, negocioActivo } = useNegocio()

    if (!negocioActivo) return null

    const menuItems = MENU_ITEMS_BASE
        .filter(item => config.sidebarItems.includes(item.href))
        .map(item => {
            if (item.href === '/produccion' && negocioActivo.rubro === 'METALURGICA') {
                return { ...item, label: 'Seguimiento' }
            }
            if (item.href === '/produccion') {
                return { ...item, label: config.labels.produccion || item.label }
            }
            return item
        })

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
            <div className="mb-8 flex items-center gap-2 px-2">
                <div className="rounded-lg bg-zinc-900 p-1.5 dark:bg-zinc-50">
                    <Package className="h-5 w-5 text-white dark:text-zinc-900" />
                </div>
                <div>
                    <span className="text-xl font-bold tracking-tight block leading-none">ProdManager</span>
                    <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{negocioActivo.nombre}</span>
                </div>
            </div>

            <nav className="space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onItemClick}
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}

export function Sidebar() {
    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-[260px] border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <SidebarContent />
        </aside>
    )
}

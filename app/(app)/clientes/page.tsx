'use client'

import { MOCK_CLIENTS_BY_NEGOCIO } from '@/src/lib/mock-data'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/src/components/ui/table'
import { Button } from '@/src/components/ui/button'
import { Plus, Search, ExternalLink, Phone, Mail, User } from 'lucide-react'
import Link from 'next/link'
import { useNegocio } from '@/src/context/NegocioContext'

export default function ClientsPage() {
    const { negocioActivoId } = useNegocio()
    const clients = MOCK_CLIENTS_BY_NEGOCIO[negocioActivoId] || []

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Clientes</h1>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">Base de datos de clientes.</p>
                </div>
                <Button className="gap-2 w-full sm:w-auto">
                    <Plus className="h-4 w-4" /> Nuevo Cliente
                </Button>
            </div>

            <div className="flex max-w-full sm:max-w-sm items-center gap-2">
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                    <input
                        type="search"
                        placeholder="Buscar cliente..."
                        className="h-9 w-full rounded-md border border-zinc-200 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950"
                    />
                </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Pedidos</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.length > 0 ? clients.map((client) => (
                            <TableRow key={client.id}>
                                <TableCell className="font-medium">{client.name}</TableCell>
                                <TableCell className="text-zinc-500">{client.email}</TableCell>
                                <TableCell className="text-zinc-500">{client.phone}</TableCell>
                                <TableCell>
                                    <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-xs font-bold">
                                        {client.totalOrders}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <Link href={`/clientes/${client.id}`}>
                                        <Button variant="ghost" size="icon" className="hover:text-primary">
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                                    No hay clientes registrados en este negocio.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Grid */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {clients.map((client) => (
                    <div key={client.id} className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                    <User className="h-5 w-5 text-zinc-500" />
                                </div>
                                <div>
                                    <p className="font-bold text-zinc-900 dark:text-zinc-100">{client.name}</p>
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">{client.totalOrders} PEDIDOS</p>
                                </div>
                            </div>
                            <Link href={`/clientes/${client.id}`}>
                                <Button variant="outline" size="icon" className="h-8 w-8">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 gap-2 pt-2 border-t border-zinc-50 dark:border-zinc-900">
                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <Mail className="h-3 w-3" />
                                {client.email}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <Phone className="h-3 w-3" />
                                {client.phone}
                            </div>
                        </div>
                    </div>
                ))}
                {clients.length === 0 && (
                    <div className="py-12 text-center text-zinc-500 border border-dashed rounded-lg">
                        No hay clientes registrados.
                    </div>
                )}
            </div>
        </div>
    )
}

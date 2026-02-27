import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/src/components/ui/table'
import { Badge } from '@/src/components/ui/badge'
import { BadgeUrgencia } from '@/src/components/BadgeUrgencia'
import { Money } from '@/src/components/Money'
import { DateTag } from '@/src/components/DateTag'
import { Order } from '@/src/types'
import Link from 'next/link'
import { Eye, ChevronRight } from 'lucide-react'
import { Button } from '@/src/components/ui/button'

interface OrdersTableProps {
    orders: Order[]
}

export function OrdersTable({ orders }: OrdersTableProps) {
    return (
        <div className="space-y-4">
            {/* Vista de Escritorio - Tabla */}
            <div className="hidden md:block rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nº Pedido</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Urgencia</TableHead>
                            <TableHead>Fecha Entrega</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                <TableCell>{order.clientName}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{order.status}</Badge>
                                </TableCell>
                                <TableCell>
                                    <BadgeUrgencia urgencia={order.priority} />
                                </TableCell>
                                <TableCell>
                                    <DateTag date={order.deliveryDate} />
                                </TableCell>
                                <TableCell className="text-right">
                                    <Money amount={order.totalPrice} className="font-semibold" />
                                </TableCell>
                                <TableCell>
                                    <Link href={`/pedidos/${order.id}`}>
                                        <Button variant="ghost" size="icon">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Vista Mobile - Lista de Cards */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {orders.map((order) => (
                    <Link key={order.id} href={`/pedidos/${order.id}`}>
                        <div className="rounded-lg border border-zinc-200 bg-white p-4 active:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:active:bg-zinc-900 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-tight mb-0.5">{order.orderNumber}</div>
                                    <div className="font-bold text-zinc-900 dark:text-zinc-100">{order.clientName}</div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-zinc-400 mt-1" />
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                <Badge variant="secondary" className="text-[10px] h-5">{order.status}</Badge>
                                <BadgeUrgencia urgencia={order.priority} />
                            </div>

                            <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
                                <div className="text-xs text-zinc-500">
                                    Entrega: <span className="font-medium text-zinc-700 dark:text-zinc-300">{new Intl.DateTimeFormat('es-AR').format(order.deliveryDate)}</span>
                                </div>
                                <Money amount={order.totalPrice} className="font-bold text-zinc-950 dark:text-zinc-50" />
                            </div>
                        </div>
                    </Link>
                ))}
                {orders.length === 0 && (
                    <div className="py-12 text-center text-zinc-500 border border-dashed rounded-lg">
                        No hay pedidos coincidentes.
                    </div>
                )}
            </div>
        </div>
    )
}

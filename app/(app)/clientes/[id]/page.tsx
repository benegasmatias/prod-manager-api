'use client'

import { useParams } from 'next/navigation'
import { MOCK_CLIENTS, MOCK_ORDERS } from '@/src/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'
import { OrdersTable } from '@/src/components/OrdersTable'

export default function ClientDetailPage() {
    const { id } = useParams()
    const client = MOCK_CLIENTS.find(c => c.id === id)
    const clientOrders = MOCK_ORDERS.filter(o => o.clientId === id)

    if (!client) return <div>Cliente no encontrado</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/clientes">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Datos de Contacto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 text-sm">
                            <Mail className="h-4 w-4 text-zinc-400" />
                            <span>{client.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Phone className="h-4 w-4 text-zinc-400" />
                            <span>{client.phone}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <MapPin className="h-4 w-4 text-zinc-400" />
                            <span>{client.address}</span>
                        </div>
                        <Button className="w-full mt-4">Editar Cliente</Button>
                    </CardContent>
                </Card>

                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial de Pedidos</CardTitle>
                            <CardDescription>Lista de todos los pedidos realizados por este cliente.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <OrdersTable orders={clientOrders} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

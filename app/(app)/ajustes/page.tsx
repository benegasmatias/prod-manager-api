import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Ajustes</h1>
                <p className="text-zinc-500 dark:text-zinc-400">Configuración general de ProdManager.</p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Perfil de Empresa</CardTitle>
                        <CardDescription>Información legal y de contacto.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Nombre de Fantasía</label>
                            <input className="flex h-10 w-full max-w-md rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950" defaultValue="ProdManager SA" />
                        </div>
                        <Button>Guardar Cambios</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Notificaciones</CardTitle>
                        <CardDescription>Alertas de vencimiento y producción.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked />
                            <span className="text-sm">Recibir avisos de pedidos vencidos por email</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

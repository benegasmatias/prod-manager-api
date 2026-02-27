import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/auth/actions'
import {
    LayoutDashboard,
    LogOut,
    User,
    Settings,
    Package,
    BarChart3
} from 'lucide-react'

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch user profile from public.users
    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    return (
        <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Sidebar */}
            <aside className="w-64 border-r border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-8 flex items-center gap-2 px-2">
                    <div className="rounded-lg bg-zinc-950 p-1.5 dark:bg-zinc-50">
                        <Package className="h-5 w-5 text-white dark:text-zinc-950" />
                    </div>
                    <span className="text-xl font-bold dark:text-white">ProdManager</span>
                </div>

                <nav className="space-y-1">
                    <a
                        href="#"
                        className="flex items-center gap-3 rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 dark:bg-zinc-800 dark:text-white"
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                    </a>
                    <a
                        href="#"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-white"
                    >
                        <BarChart3 className="h-4 w-4" />
                        Estadísticas
                    </a>
                    <a
                        href="#"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-white"
                    >
                        <Settings className="h-4 w-4" />
                        Configuración
                    </a>
                </nav>

                <div className="mt-auto pt-8">
                    <form action={logout}>
                        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10">
                            <LogOut className="h-4 w-4" />
                            Cerrar Sesión
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Dashboard</h2>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Bienvenido, {profile?.email || user.email}
                        </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800">
                        <User className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                    </div>
                </header>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Card 1 */}
                    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Productos</h3>
                        <p className="mt-2 text-3xl font-bold dark:text-white">128</p>
                    </div>
                    {/* Card 2 */}
                    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Ventas (Mes)</h3>
                        <p className="mt-2 text-3xl font-bold dark:text-white">$4,250</p>
                    </div>
                    {/* Card 3 */}
                    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Rol de Usuario</h3>
                        <span className="mt-2 inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                            {profile?.role || 'user'}
                        </span>
                    </div>
                </div>

                <div className="mt-8 rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="border-b border-zinc-200 p-6 dark:border-zinc-800">
                        <h3 className="text-lg font-bold dark:text-white">Actividad Reciente</h3>
                    </div>
                    <div className="p-12 text-center">
                        <p className="text-zinc-500 dark:text-zinc-400">No hay actividad reciente para mostrar.</p>
                    </div>
                </div>
            </main>
        </div>
    )
}

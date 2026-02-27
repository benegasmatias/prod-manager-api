'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
    theme: Theme
    resolvedTheme: 'light' | 'dark'
    setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('system')
    const [mounted, setMounted] = useState(false)

    // Cargar desde localStorage con la key solicitada
    useEffect(() => {
        const saved = localStorage.getItem('pm_theme') as Theme
        if (saved) {
            setThemeState(saved)
        }
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted) return

        const root = window.document.documentElement
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

        const applyTheme = (t: Theme) => {
            // Limpiar clases previas
            root.classList.remove('light', 'dark')

            let actual: 'light' | 'dark'

            if (t === 'system') {
                actual = mediaQuery.matches ? 'dark' : 'light'
            } else {
                actual = t
            }

            // Aplicar clase correspondiente
            root.classList.add(actual)

            // Sincronizar color-scheme para componentes nativos del navegador
            root.style.colorScheme = actual

            // Log de depuración (será visible en consola del navegador)
            console.log(`[Theme] Aplicado: ${t} (${actual})`)
        }

        applyTheme(theme)
        localStorage.setItem('pm_theme', theme)

        const handleChange = () => {
            if (theme === 'system') applyTheme('system')
        }

        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [theme, mounted])

    const resolvedTheme: 'light' | 'dark' =
        theme === 'system'
            ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : (theme as 'light' | 'dark')

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme: setThemeState }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) throw new Error('useTheme must be used within ThemeProvider')
    return context
}

'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Negocio, Rubro, NegocioConfig, getNegocioConfig } from '@/src/domain/negocio'

interface NegocioContextType {
    negocios: Negocio[]
    negocioActivoId: string
    negocioActivo: Negocio | undefined
    config: NegocioConfig
    setActivo: (id: string) => void
    addNegocio: (nombre: string, rubro: Rubro) => void
    updateNegocio: (id: string, nombre: string, rubro: Rubro) => void
    removeNegocio: (id: string) => void
}

const DEFAULT_NEGOCIOS: Negocio[] = [
    { id: 'n1', nombre: 'Taller 3D Principal', rubro: 'IMPRESION_3D', createdAt: new Date().toISOString() },
    { id: 'n2', nombre: 'Servicios Metalúrgicos', rubro: 'METALURGICA', createdAt: new Date().toISOString() },
]

const NegocioContext = createContext<NegocioContextType | undefined>(undefined)

export function NegocioProvider({ children }: { children: React.ReactNode }) {
    const [negocios, setNegocios] = useState<Negocio[]>([])
    const [negocioActivoId, setNegocioActivoId] = useState<string>('')
    const [isInitialized, setIsInitialized] = useState(false)

    useEffect(() => {
        const savedNegocios = localStorage.getItem('prodmanager_negocios')
        const savedActivo = localStorage.getItem('prodmanager_negocio_activo')

        const initialNegocios = savedNegocios ? JSON.parse(savedNegocios) : DEFAULT_NEGOCIOS
        const initialActivo = savedActivo || initialNegocios[0]?.id || ''

        setNegocios(initialNegocios)
        setNegocioActivoId(initialActivo)
        setIsInitialized(true)
    }, [])

    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('prodmanager_negocios', JSON.stringify(negocios))
            localStorage.setItem('prodmanager_negocio_activo', negocioActivoId)
        }
    }, [negocios, negocioActivoId, isInitialized])

    const setActivo = (id: string) => setNegocioActivoId(id)

    const addNegocio = (nombre: string, rubro: Rubro) => {
        const newNegocio: Negocio = {
            id: 'n-' + Math.random().toString(36).substring(2, 9),
            nombre,
            rubro,
            createdAt: new Date().toISOString()
        }
        setNegocios([...negocios, newNegocio])
        setNegocioActivoId(newNegocio.id)
    }

    const updateNegocio = (id: string, nombre: string, rubro: Rubro) => {
        setNegocios(negocios.map(n => n.id === id ? { ...n, nombre, rubro } : n))
    }

    const removeNegocio = (id: string) => {
        if (negocios.length <= 1) return
        const rest = negocios.filter(n => n.id !== id)
        setNegocios(rest)
        if (negocioActivoId === id) {
            setNegocioActivoId(rest[0].id)
        }
    }

    const negocioActivo = negocios.find(n => n.id === negocioActivoId) || negocios[0]
    const config = getNegocioConfig(negocioActivo?.rubro || 'GENERICO')

    return (
        <NegocioContext.Provider value={{
            negocios,
            negocioActivoId,
            negocioActivo,
            config,
            setActivo,
            addNegocio,
            updateNegocio,
            removeNegocio
        }}>
            {children}
        </NegocioContext.Provider>
    )
}

export function useNegocio() {
    const context = useContext(NegocioContext)
    if (context === undefined) {
        throw new Error('useNegocio must be used within a NegocioProvider')
    }
    return context
}

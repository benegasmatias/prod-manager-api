import { Client, Order, Machine, OrderItem } from '@/src/types'
import { addDays, subDays } from 'date-fns'

// Estructura aislada por negocio
export const MOCK_CLIENTS_BY_NEGOCIO: Record<string, Client[]> = {
    'n1': [
        { id: 'c1', name: 'Matias Benegas (3D)', email: 'matias@3d.com', phone: '2641234567', address: 'San Juan', totalOrders: 5 },
    ],
    'n2': [
        { id: 'c2', name: 'Metalúrgica San Juan', email: 'vendas@metalsj.com', phone: '1145678901', address: 'Chimbas', totalOrders: 2 },
    ]
}

const calculateOrderStats = (items: OrderItem[]) => {
    const totalCost = items.reduce((acc, item) => acc + (item.unitCost * item.quantity), 0)
    const totalPrice = items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0)
    const profit = totalPrice - totalCost
    const margin = totalPrice > 0 ? (profit / totalPrice) * 100 : 0
    return { totalCost, totalPrice, profit, margin }
}

export const MOCK_ORDERS_BY_NEGOCIO: Record<string, Order[]> = {
    'n1': [
        {
            id: 'o1',
            orderNumber: '3D-001',
            clientId: 'c1',
            clientName: 'Matias Benegas (3D)',
            status: 'En Producción',
            createdAt: subDays(new Date(), 2),
            deliveryDate: subDays(new Date(), 1),
            priority: 'VENCIDO',
            items: [
                {
                    id: 'i1',
                    productName: 'Engranaje Reductor',
                    quantity: 10,
                    quantityProduced: 4,
                    unitCost: 1500,
                    unitPrice: 4500,
                    url_stl: 'https://drive.google.com/engranaje.stl',
                    peso_gramos: 120,
                    duracion_estimada_minutos: 180
                },
            ],
            ...calculateOrderStats([
                { id: 'i1', productName: 'Engranaje Reductor', quantity: 10, quantityProduced: 4, unitCost: 1500, unitPrice: 4500 },
            ]),
        }
    ],
    'n2': [
        {
            id: 'o2',
            orderNumber: 'MET-001',
            clientId: 'c2',
            clientName: 'Metalúrgica San Juan',
            status: 'Pendiente',
            createdAt: subDays(new Date(), 1),
            deliveryDate: addDays(new Date(), 5),
            priority: 'EN TIEMPO',
            items: [
                {
                    id: 'i2',
                    productName: 'Reja de Seguridad',
                    quantity: 1,
                    quantityProduced: 0,
                    unitCost: 12000,
                    unitPrice: 35000,
                    medidas: '200x100 cm',
                    material: 'Hierro 1/2',
                    terminacion: 'Negro Mate'
                },
            ],
            ...calculateOrderStats([
                { id: 'i2', productName: 'Reja de Seguridad', quantity: 1, quantityProduced: 0, unitCost: 12000, unitPrice: 35000 },
            ]),
        }
    ]
}

export const MOCK_MACHINES_BY_NEGOCIO: Record<string, Machine[]> = {
    'n1': [
        { id: 'm1', name: 'Creality Ender 3', type: 'FDM', status: 'Ocupada', currentJobId: 'o1', queue: [] },
        { id: 'm2', name: 'Prusa MK4', type: 'FDM', status: 'Libre', queue: [] },
    ],
    'n2': []
}

// Retrocompatibilidad para no romper todas las pantallas de golpe
export const MOCK_CLIENTS = MOCK_CLIENTS_BY_NEGOCIO['n1']
export const MOCK_ORDERS = MOCK_ORDERS_BY_NEGOCIO['n1']
export const MOCK_MACHINES = MOCK_MACHINES_BY_NEGOCIO['n1']

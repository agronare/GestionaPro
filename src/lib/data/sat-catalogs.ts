
export const objectImpOptions = [
    { value: '01', label: 'No objeto de impuesto.' },
    { value: '02', label: 'Sí objeto de impuesto.' },
    { value: '03', label: 'Sí objeto del impuesto y no obligado al desglose.' },
    { value: '04', label: 'Sí objeto del impuesto y no causa impuesto (tasa 0%).' }
];

export const ivaRateOptions = [
    { value: 0.16, label: '16% (General)' },
    { value: 0.08, label: '8% (Fronterizo)' },
    { value: 0, label: '0% (Exento / Tasa 0)' }
];

export const iepsRateOptions = [
    { value: 0, label: 'No aplica' },
    { value: 0.265, label: '26.5% (Pesticidas Cat 1 y 2)' },
    { value: 0.09, label: '9% (Pesticidas Cat 3)' },
    { value: 0.07, label: '7% (Pesticidas Cat 4)' },
];

// Catálogo de productos y servicios del SAT (simplificado)
const satProductServiceMap: { [key: string]: string } = {
    'FERTILIZANTE': '21011500', // Fertilizantes
    'HERBICIDA': '10191500', // Herbicidas
    'INSECTICIDA': '10191500', // Insecticidas y acaricidas
    'SEMILLA': '10161600', // Semillas para siembra
    'MAQUINARIA': '21101700', // Maquinaria agrícola
};

/**
 * Obtiene la clave de producto o servicio del SAT basada en la categoría.
 * @param category - La categoría del producto.
 * @returns La clave del SAT correspondiente o una genérica.
 */
export function getSatClaveProdServ(category: string): string {
    const upperCaseCategory = category.toUpperCase();
    for (const key in satProductServiceMap) {
        if (upperCaseCategory.includes(key)) {
            return satProductServiceMap[key];
        }
    }
    return '01010101'; // Clave genérica "No existe en el catálogo"
}

/**
 * Obtiene la clave de unidad del SAT.
 * Por ahora, se asume 'Pieza' como unidad estándar.
 * @returns La clave de unidad del SAT.
 */
export function getSatClaveUnidad(): string {
    return 'H87'; // Clave para "Pieza"
}

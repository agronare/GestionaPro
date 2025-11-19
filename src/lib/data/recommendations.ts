import { Client, ProductWithInventory } from '@/lib/types';

type Recommendation = {
    product: ProductWithInventory;
    reason: string;
}

export function getRecommendations(client: Client, products: ProductWithInventory[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (!client.isAgricultural || !client.mainCrop) return [];

    // Simple rule-based recommendations
    if (client.mainCrop.toLowerCase() === 'maíz') {
        const nitrogenFertilizer = products.find(p => p.name.toLowerCase().includes('urea') || p.name.toLowerCase().includes('nitrato'));
        if (nitrogenFertilizer) {
            recommendations.push({ product: nitrogenFertilizer, reason: `Para su cultivo de ${client.mainCrop}` });
        }
    }
    
    if (client.mainCrop.toLowerCase() === 'aguacate') {
         const potassiumFertilizer = products.find(p => p.name.toLowerCase().includes('potasio'));
         if (potassiumFertilizer) {
            recommendations.push({ product: potassiumFertilizer, reason: `Para llenado de fruto en ${client.mainCrop}` });
        }
    }

    const genericAdherent = products.find(p => p.category.toLowerCase().includes('adherente'));
    if (genericAdherent && recommendations.length > 0) {
         recommendations.push({ product: genericAdherent, reason: 'Mejora la eficacia de la aplicación' });
    }

    return recommendations.slice(0, 3); // Return max 3 recommendations
}

'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';


// Initialize Firebase Admin SDK
if (!getApps().length) {
    // In a deployed environment, service account credentials will be automatically
    // available. In a local development environment, you need to download a
    // service account key file and set the GOOGLE_APPLICATION_CREDENTIALS
    // environment variable.
    initializeApp();
}

const firestore = getAdminFirestore();

const getProductInfo = ai.defineTool(
    {
        name: 'getProductInfo',
        description: 'Obtiene información detallada sobre un producto específico por su nombre.',
        inputSchema: z.object({
            productName: z.string().describe('El nombre del producto a buscar.'),
        }),
        outputSchema: z.object({
            found: z.boolean(),
            name: z.string().optional(),
            price: z.number().optional(),
            sku: z.string().optional(),
            stock: z.number().optional(),
            activeIngredient: z.string().optional(),
        }),
    },
    async ({ productName }) => {
        try {
            const productsRef = collection(firestore, 'products');
            
            const allProductsSnapshot = await getDocs(productsRef);

            // --- Enhanced Search Logic ---
            const normalizeString = (str: string) => {
                return str
                    .toLowerCase()
                    .replace(/fert\.|sco\.|gran\.|gr\.|kg\./g, '') // Remove common abbreviations
                    .replace(/[.]/g, ' ') // Replace dots with spaces
                    .replace(/\s+/g, ' ') // Collapse multiple spaces
                    .trim();
            };

            const searchKeywords = normalizeString(productName).split(' ');

            const foundProduct = allProductsSnapshot.docs.find(doc => {
                const dbProductName = normalizeString(doc.data().name);
                // Check if all search keywords are present in the product name
                return searchKeywords.every(keyword => dbProductName.includes(keyword));
            });
            // --- End of Enhanced Search Logic ---

            if (!foundProduct) {
                return { found: false };
            }

            const productData = foundProduct.data();

            // Now get inventory info for the found product
            const inventoryRef = collection(firestore, 'inventory');
            const stockQuery = query(inventoryRef, where('sku', '==', productData.sku));
            const stockSnapshot = await getDocs(stockQuery);
            
            const stock = stockSnapshot.docs.reduce((acc, doc) => acc + (doc.data().quantity || 0), 0);
            
            // Get price from the product itself, which should be the sale price
            const price = productData.salePrice || 0;

            return {
                found: true,
                name: productData.name,
                price: price,
                sku: productData.sku,
                stock: stock,
                activeIngredient: productData.activeIngredient,
            };

        } catch (error) {
            console.error("Error fetching product info:", error);
            if (error instanceof Error) {
                return { found: false, name: `Error: ${error.message}` };
            }
            return { found: false, name: 'An unknown error occurred' };
        }
    }
);

const businessAssistantFlow = ai.defineFlow(
    {
        name: 'businessAssistantFlow',
        inputSchema: z.string(),
        outputSchema: z.string(),
    },
    async (prompt) => {
        const llmResponse = await ai.generate({
            prompt,
            model: 'googleai/gemini-2.5-flash',
            tools: [getProductInfo],
            system: `Eres el Asistente Oficial de AGRONARE, un copiloto empresarial inteligente diseñado para ayudar en todas las operaciones administrativas, logísticas, financieras, comerciales y técnicas del sistema AGRONARE.

Tu función principal es ayudar al usuario resolviendo tareas dentro de los módulos ERP, CRM, Logística, Finanzas, RPA, BI, LIMS, Blockchain y Seguridad. Procesas lenguaje natural, detectas la intención del usuario y ejecutas acciones consultando datos reales mediante los endpoints internos del sistema.

===============================================================================
📌 PRINCIPIOS GENERALES
===============================================================================
1. Debes responder SIEMPRE de forma profesional, clara y breve.
2. Antes de responder, identifica la intención (intent) del usuario.
3. Usa los módulos internos para obtener datos cuando se requiera:
   - ERP / Productos, Inventario, Compras, Ventas
   - CRM / Clientes, Créditos, Cotizaciones
   - Logística / Vehículos, Rutas, Itinerarios, Entregas, Recolecciones
   - Finanzas / Abonos, Movimientos, Estados Financieros
   - RPA / Bots, Automatizaciones, Logs
   - BI / Reportes, Estadísticas, Predicciones
   - Blockchain / Hash, Trazabilidad
   - LIMS / Análisis de suelos, planes de fertilización
4. Si el usuario hace una pregunta ambigua, pide una aclaración corta.
5. Si no hay información suficiente en la base de datos, responde con alternativas útiles.

===============================================================================
📌 FORMA DE RESPONDER
===============================================================================
Todas tus respuestas deben ser:
- Directas
- Cortas
- Orientadas a acción
- Escritas en español
- Sin tecnicismos innecesarios (a menos que el usuario lo pida)

SIEMPRE que el usuario solicite una acción del sistema, responde en JSON con esta estructura:

{
  "intent": "nombre_intent",
  "parameters": { ... }
}

Esto permite que el frontend llame al backend automáticamente.

Si el usuario solo quiere información o una explicación, responde como texto normal.

===============================================================================
📌 INTENTS DISPONIBLES (v1)
===============================================================================

===================
🔷 ERP / Productos
===================
buscar_producto
buscar_producto_por_palabras
generar_sku
crear_producto
editar_producto
ver_inventario_general
ver_inventario_sucursal
buscar_precio
recomendacion_compra

===================
🔶 CRM / Clientes
===================
buscar_cliente
cliente_credito
crear_cotizacion
ver_cotizaciones
oportunidades_resumen

========================
🟩 LOGÍSTICA / Rutas
========================
crear_itinerario
optimizar_ruta
vehiculo_disponible
viajes_pendientes
recolecciones_pendientes
estado_entregas

========================
🟥 FINANZAS
========================
registrar_abono
movimientos_recientes
flujo_efectivo_predictivo
ventas_resumen
estado_financiero_mensual

=====================
🟦 RPA / Automatización
=====================
crear_bot
ver_logs_bot
automatizacion_sugerida

========================
🟫 LIMS / Suelos
========================
recomendar_fertilizacion
analisis_suelo_resumen

========================
🟨 BLOCKCHAIN
========================
registrar_hash
ver_trazabilidad

===============================================================================
📌 BUSQUEDA INTELIGENTE (especial para productos)
===============================================================================
Cuando el usuario busque productos, ingredientes, fertilizantes o insumos:

1. Divide la frase en palabras clave.
2. Limpia palabras comunes (“FERT”, “SCO”, “KG”, “50KG”, etc.).
3. Asegura que TODAS las palabras clave estén presentes en el nombre del producto.
4. Permite coincidencias parciales.
5. Permite errores ortográficos leves.
6. Debe funcionar aunque el usuario escriba:
   - en mayúsculas
   - en minúsculas
   - con faltas de ortografía
   - con sinónimos o abreviaturas
   - nombres incompletos

Ejemplo:
Usuario: “sulfato potasio granulado 50”
→ Debes encontrar:
“FERT. SULFATO DE POTASIO GRANULADO SCO. 50KG.”

===============================================================================
📌 TONO DEL ASISTENTE
===============================================================================
- Amigable pero profesional.
- Breve.
- Útil.
- Enfocado en la solución.
- Propositivo (“¿Deseas que lo genere ahora?”, “¿Quieres ver el inventario?”)

===============================================================================
📌 EJEMPLOS DE INTERPRETACIÓN DE INTENTS
===============================================================================
Usuario: “buscar sulfato de potasio”
→
{
  "intent": "buscar_producto_por_palabras",
  "parameters": { "query": "sulfato de potasio" }
}

Usuario: “cuánto inventario hay del triple 17 en Zamora?”
→
{
  "intent": "ver_inventario_sucursal",
  "parameters": { "producto": "triple 17", "sucursal": "Zamora" }
}

Usuario: “genera un SKU para este producto: Fert. Microelementos Liquido Premium”
→
{
  "intent": "generar_sku",
  "parameters": { "nombre": "Fert. Microelementos Liquido Premium" }
}

Usuario: “crea una ruta para ir a Zamora, Paracho y regresar a Copándaro”
→
{
  "intent": "crear_itinerario",
  "parameters": {
    "origen": "Copándaro",
    "paradas": ["Zamora", "Paracho"],
    "destino": "Copándaro"
  }
}

===============================================================================
📌 REGLAS FINALES
===============================================================================
- Nunca inventes datos que deben venir del sistema.
- Si no encuentras algo, ofrece alternativas o búsquedas parecidas.
- Si el usuario no da suficiente información, pídesela.
- Todas las respuestas deben ser breves.
- Si el usuario lo pide, actúa como analista, asesor o experto agropecuario.
`,
        });

        return llmResponse.text;
    }
);

export async function askBusinessAssistant(question: string): Promise<string> {
  return businessAssistantFlow(question);
}

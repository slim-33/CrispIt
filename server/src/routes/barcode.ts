import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/barcode/:code — lookup product via Open Food Facts
router.get('/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${code}.json`
    );

    if (!response.ok) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const data: any = await response.json();

    if (data.status === 0) {
      return res.status(404).json({ error: 'Product not found in Open Food Facts database' });
    }

    const product = data.product;

    // Extract carbon footprint from Agribalyse lifecycle data
    const agribalyse = product.ecoscore_data?.agribalyse;
    let carbon_footprint = null;
    if (agribalyse) {
      const totalCo2 = agribalyse.co2_total ?? agribalyse.ef_total ?? null;
      carbon_footprint = {
        co2_total: totalCo2 != null ? +totalCo2.toFixed(2) : null,
        co2_agriculture: agribalyse.co2_agriculture != null ? +agribalyse.co2_agriculture.toFixed(2) : null,
        co2_processing: agribalyse.co2_processing != null ? +agribalyse.co2_processing.toFixed(2) : null,
        co2_packaging: agribalyse.co2_packaging != null ? +agribalyse.co2_packaging.toFixed(2) : null,
        co2_transportation: agribalyse.co2_transportation != null ? +agribalyse.co2_transportation.toFixed(2) : null,
        co2_distribution: agribalyse.co2_distribution != null ? +agribalyse.co2_distribution.toFixed(2) : null,
        co2_consumption: agribalyse.co2_consumption != null ? +agribalyse.co2_consumption.toFixed(2) : null,
      };
    }

    res.json({
      name: product.product_name || 'Unknown Product',
      brand: product.brands || 'Unknown Brand',
      eco_score: product.ecoscore_grade || 'unknown',
      eco_score_value: product.ecoscore_score ?? null,
      nutri_score: product.nutrition_grades || 'unknown',
      ingredients: product.ingredients_text || 'Not available',
      origin: product.origins || product.manufacturing_places || 'Unknown',
      packaging: product.packaging || 'Not specified',
      image_url: product.image_url || null,
      categories: product.categories || 'Not categorized',
      carbon_footprint,
    });
  } catch (error) {
    console.error('Barcode lookup error:', error);
    res.status(500).json({ error: 'Failed to lookup barcode' });
  }
});

export default router;

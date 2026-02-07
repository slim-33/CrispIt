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

    res.json({
      name: product.product_name || 'Unknown Product',
      brand: product.brands || 'Unknown Brand',
      eco_score: product.ecoscore_grade || 'unknown',
      nutri_score: product.nutrition_grades || 'unknown',
      ingredients: product.ingredients_text || 'Not available',
      origin: product.origins || product.manufacturing_places || 'Unknown',
      packaging: product.packaging || 'Not specified',
      image_url: product.image_url || null,
      categories: product.categories || 'Not categorized',
    });
  } catch (error) {
    console.error('Barcode lookup error:', error);
    res.status(500).json({ error: 'Failed to lookup barcode' });
  }
});

export default router;

// lib/globalProductsApi.ts
import axios from 'axios';
import { COMMON_PRODUCTS } from './commonProducts';

export interface GlobalProductInfo {
  barcode: string;
  description: string;
  brand?: string;
  categoryHint?: string;
  imageUrl?: string;
}

export async function fetchProductInfo(barcode: string): Promise<GlobalProductInfo | null> {
  // 1. Consultamos la API gratuita de Open Food Facts primero para obtener la foto real
  try {
    const res = await axios.get(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
      timeout: 3000 // 3 seconds timeout so it doesn't freeze the POS
    });
    
    if (res.data && res.data.status === 1 && res.data.product) {
      const p = res.data.product;
      // Prefer Spanish name, fallback to generic product name
      const name = p.product_name_es || p.product_name || p.generic_name;
      
      if (name) {
        return {
          barcode,
          description: name,
          brand: p.brands
        };
      }
    }
  } catch (error) {
    console.error('Error fetching from Open Food Facts:', error);
  }

  // 2. Intentar con UPCitemdb (productos generales, electrónicos, ferretería, chinos)
  try {
    const res = await axios.get(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`, {
      timeout: 3000
    });
    
    if (res.data && res.data.code === 'OK' && res.data.items && res.data.items.length > 0) {
      const p = res.data.items[0];
      return {
        barcode,
        description: p.title,
        brand: p.brand
      };
    }
  } catch (error) {
    console.error('Error fetching from UPCitemdb:', error);
  }

  // 3. Si las APIs fallan o no tienen el producto, usamos nuestra base local súper rápida como respaldo
  if (COMMON_PRODUCTS[barcode]) {
    return {
      barcode,
      description: COMMON_PRODUCTS[barcode]
    };
  }

  return null;
}

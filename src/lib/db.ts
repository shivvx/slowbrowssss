import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Product,
  ProductAlias,
  Customer,
  Order,
  OrderItem,
  InventoryMovement,
  AgentRun,
  AgentEvent,
  PendingConversation,
  LowStockAlert
} from './types';

// =========================================================================
// Initial Seed Data (Mirrors supabase/seed.sql for zero-config / offline)
// =========================================================================

const INITIAL_PRODUCTS: Product[] = [
  // Staples
  { id: 'a0000001-0000-0000-0000-000000000001', sku: 'ST-ASH-05K', name: 'Aashirvaad Shudh Chakki Atta 5kg', brand: 'Aashirvaad', category: 'Staples', variant: 'Chakki Fresh', pack_size: '5kg', price_paise: 28900, stock_quantity: 8, reorder_level: 3, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'a0000001-0000-0000-0000-000000000002', sku: 'ST-ASH-10K', name: 'Aashirvaad Shudh Chakki Atta 10kg', brand: 'Aashirvaad', category: 'Staples', variant: 'Chakki Fresh', pack_size: '10kg', price_paise: 54000, stock_quantity: 5, reorder_level: 2, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'a0000001-0000-0000-0000-000000000003', sku: 'ST-FRT-05K', name: 'Fortune Chakki Fresh Atta 5kg', brand: 'Fortune', category: 'Staples', variant: 'Chakki Fresh', pack_size: '5kg', price_paise: 26500, stock_quantity: 6, reorder_level: 2, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'a0000001-0000-0000-0000-000000000004', sku: 'ST-TTS-01K', name: 'Tata Sampann Unpolished Toor Dal 1kg', brand: 'Tata Sampann', category: 'Staples', variant: 'Toor Dal', pack_size: '1kg', price_paise: 17500, stock_quantity: 12, reorder_level: 4, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'a0000001-0000-0000-0000-000000000005', sku: 'ST-TTM-01K', name: 'Tata Sampann Moong Dal 1kg', brand: 'Tata Sampann', category: 'Staples', variant: 'Moong Dal', pack_size: '1kg', price_paise: 14500, stock_quantity: 10, reorder_level: 3, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'a0000001-0000-0000-0000-000000000006', sku: 'ST-IGR-01K', name: 'India Gate Basmati Rice Rozzana 1kg', brand: 'India Gate', category: 'Staples', variant: 'Basmati Rice', pack_size: '1kg', price_paise: 11500, stock_quantity: 15, reorder_level: 5, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'a0000001-0000-0000-0000-000000000007', sku: 'ST-DWT-01K', name: 'Daawat Rozana Super Basmati Rice 1kg', brand: 'Daawat', category: 'Staples', variant: 'Basmati Rice', pack_size: '1kg', price_paise: 9500, stock_quantity: 14, reorder_level: 4, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'a0000001-0000-0000-0000-000000000008', sku: 'ST-TTS-SALT', name: 'Tata Salt Vacuum Evaporated 1kg', brand: 'Tata', category: 'Staples', variant: 'Salt', pack_size: '1kg', price_paise: 2800, stock_quantity: 25, reorder_level: 8, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'a0000001-0000-0000-0000-000000000009', sku: 'ST-MDH-SUG1', name: 'Madhur Pure & Hygienic Sugar 1kg', brand: 'Madhur', category: 'Staples', variant: 'Sugar', pack_size: '1kg', price_paise: 5200, stock_quantity: 20, reorder_level: 5, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'a0000001-0000-0000-0000-000000000010', sku: 'ST-GEN-SUG1', name: 'Loose Premium Sugar 1kg', brand: 'Generic', category: 'Staples', variant: 'Sugar', pack_size: '1kg', price_paise: 4400, stock_quantity: 30, reorder_level: 10, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'a0000001-0000-0000-0000-000000000011', sku: 'SP-CAT-PEP', name: 'Catch Black Pepper Powder 100g', brand: 'Catch', category: 'Spices', variant: 'Black Pepper', pack_size: '100g', price_paise: 9800, stock_quantity: 10, reorder_level: 3, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'a0000001-0000-0000-0000-000000000012', sku: 'SP-EVR-HLD', name: 'Everest Turmeric Powder 200g', brand: 'Everest', category: 'Spices', variant: 'Haldi', pack_size: '200g', price_paise: 6200, stock_quantity: 15, reorder_level: 4, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'a0000001-0000-0000-0000-000000000013', sku: 'SP-MDH-MRC', name: 'MDH Deggi Mirch Powder 100g', brand: 'MDH', category: 'Spices', variant: 'Mirchi', pack_size: '100g', price_paise: 8800, stock_quantity: 12, reorder_level: 4, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Edible Oils (Fortune Oil 1L stock is 0 for substitution demo!)
  { id: 'b0000001-0000-0000-0000-000000000001', sku: 'OL-FRT-SUN1', name: 'Fortune Sunlite Refined Sunflower Oil 1L', brand: 'Fortune', category: 'Edible Oils', variant: 'Sunflower', pack_size: '1L', price_paise: 15200, stock_quantity: 0, reorder_level: 5, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'b0000001-0000-0000-0000-000000000002', sku: 'OL-DHR-MST1', name: 'Dhara Kachi Ghani Mustard Oil 1L', brand: 'Dhara', category: 'Edible Oils', variant: 'Mustard', pack_size: '1L', price_paise: 14800, stock_quantity: 12, reorder_level: 4, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'b0000001-0000-0000-0000-000000000003', sku: 'OL-SAF-GLD1', name: 'Saffola Gold Pro Healthy Edible Oil 1L', brand: 'Saffola', category: 'Edible Oils', variant: 'Blended', pack_size: '1L', price_paise: 17100, stock_quantity: 8, reorder_level: 3, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'b0000001-0000-0000-0000-000000000004', sku: 'OL-FRT-MST1', name: 'Fortune Kachi Ghani Mustard Oil 1L', brand: 'Fortune', category: 'Edible Oils', variant: 'Mustard', pack_size: '1L', price_paise: 15500, stock_quantity: 7, reorder_level: 3, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'b0000001-0000-0000-0000-000000000005', sku: 'OL-FRT-SUN5', name: 'Fortune Sunlite Refined Sunflower Oil 500ml', brand: 'Fortune', category: 'Edible Oils', variant: 'Sunflower', pack_size: '500ml', price_paise: 8200, stock_quantity: 10, reorder_level: 3, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Dairy, Bakery & Eggs
  { id: 'c0000001-0000-0000-0000-000000000001', sku: 'DY-AML-TZ5', name: 'Amul Taaza Toned Milk 500ml', brand: 'Amul', category: 'Dairy', variant: 'Toned Milk', pack_size: '500ml', price_paise: 2700, stock_quantity: 20, reorder_level: 8, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'c0000001-0000-0000-0000-000000000002', sku: 'DY-AML-GL5', name: 'Amul Gold Full Cream Milk 500ml', brand: 'Amul', category: 'Dairy', variant: 'Full Cream', pack_size: '500ml', price_paise: 3300, stock_quantity: 18, reorder_level: 6, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'c0000001-0000-0000-0000-000000000003', sku: 'DY-MD-TN5', name: 'Mother Dairy Toned Milk 500ml', brand: 'Mother Dairy', category: 'Dairy', variant: 'Toned Milk', pack_size: '500ml', price_paise: 2700, stock_quantity: 15, reorder_level: 5, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'c0000001-0000-0000-0000-000000000004', sku: 'DY-AML-BTR1', name: 'Amul Butter Pasteurized 100g', brand: 'Amul', category: 'Dairy', variant: 'Butter', pack_size: '100g', price_paise: 5600, stock_quantity: 12, reorder_level: 4, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'c0000001-0000-0000-0000-000000000005', sku: 'DY-GEN-EGG6', name: 'Fresh Farm White Eggs 6 Pack', brand: 'Generic', category: 'Dairy & Eggs', variant: 'Eggs', pack_size: '6 pack', price_paise: 4500, stock_quantity: 14, reorder_level: 5, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'c0000001-0000-0000-0000-000000000006', sku: 'DY-GEN-EG12', name: 'Fresh Farm White Eggs 12 Pack Tray', brand: 'Generic', category: 'Dairy & Eggs', variant: 'Eggs', pack_size: '12 pack', price_paise: 8500, stock_quantity: 10, reorder_level: 3, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'c0000001-0000-0000-0000-000000000007', sku: 'BK-HVG-WHT', name: 'Harvest Gold White Bread 400g', brand: 'Harvest Gold', category: 'Bakery', variant: 'White Bread', pack_size: '400g', price_paise: 4000, stock_quantity: 15, reorder_level: 5, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'c0000001-0000-0000-0000-000000000008', sku: 'BK-BRT-WHT', name: 'Britannia 100% Whole Wheat Bread 400g', brand: 'Britannia', category: 'Bakery', variant: 'Brown Bread', pack_size: '400g', price_paise: 5000, stock_quantity: 8, reorder_level: 3, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Snacks & Maggi
  { id: 'd0000001-0000-0000-0000-000000000001', sku: 'SN-MAG-MS70', name: 'Maggi 2-Minute Instant Noodles Masala 70g', brand: 'Maggi', category: 'Snacks & Packaged Food', variant: 'Masala', pack_size: '70g', price_paise: 1400, stock_quantity: 25, reorder_level: 10, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'd0000001-0000-0000-0000-000000000002', sku: 'SN-MAG-MS4P', name: 'Maggi 2-Minute Noodles Masala 4-Pack 280g', brand: 'Maggi', category: 'Snacks & Packaged Food', variant: 'Masala', pack_size: '280g', price_paise: 5400, stock_quantity: 12, reorder_level: 4, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'd0000001-0000-0000-0000-000000000003', sku: 'SN-PRL-G10', name: 'Parle-G Glucose Biscuits ₹10 Pack 250g', brand: 'Parle', category: 'Snacks & Packaged Food', variant: 'Glucose', pack_size: '250g', price_paise: 1000, stock_quantity: 4, reorder_level: 10, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, // Low stock!
  { id: 'd0000001-0000-0000-0000-000000000004', sku: 'SN-BRT-GD12', name: 'Britannia Good Day Butter Cookies 120g', brand: 'Britannia', category: 'Snacks & Packaged Food', variant: 'Butter', pack_size: '120g', price_paise: 2500, stock_quantity: 16, reorder_level: 5, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'd0000001-0000-0000-0000-000000000005', sku: 'SN-HLD-BHU2', name: 'Haldiram Nagpur Bhujia Sev 200g', brand: 'Haldiram', category: 'Snacks & Packaged Food', variant: 'Namkeen', pack_size: '200g', price_paise: 5500, stock_quantity: 14, reorder_level: 4, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'd0000001-0000-0000-0000-000000000006', sku: 'SN-LAY-MAG5', name: 'Lays India Magic Masala Chips 50g', brand: 'Lays', category: 'Snacks & Packaged Food', variant: 'Chips', pack_size: '50g', price_paise: 2000, stock_quantity: 20, reorder_level: 6, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Household
  { id: 'e0000001-0000-0000-0000-000000000001', sku: 'HC-SRF-EW1K', name: 'Surf Excel Easy Wash Detergent Powder 1kg', brand: 'Surf Excel', category: 'Household & Cleaning', variant: 'Detergent', pack_size: '1kg', price_paise: 14000, stock_quantity: 10, reorder_level: 3, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'e0000001-0000-0000-0000-000000000002', sku: 'HC-VIM-BAR1', name: 'Vim Dishwash Bar 135g', brand: 'Vim', category: 'Household & Cleaning', variant: 'Dishwash Bar', pack_size: '135g', price_paise: 1000, stock_quantity: 30, reorder_level: 10, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'e0000001-0000-0000-0000-000000000003', sku: 'HC-VIM-GEL2', name: 'Vim Dishwash Gel Lemon 250ml', brand: 'Vim', category: 'Household & Cleaning', variant: 'Gel', pack_size: '250ml', price_paise: 6000, stock_quantity: 8, reorder_level: 3, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'e0000001-0000-0000-0000-000000000004', sku: 'HC-HRP-OR50', name: 'Harpic Power Plus Toilet Cleaner Original 500ml', brand: 'Harpic', category: 'Household & Cleaning', variant: 'Cleaner', pack_size: '500ml', price_paise: 9900, stock_quantity: 9, reorder_level: 3, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Personal Care
  { id: 'f0000001-0000-0000-0000-000000000001', sku: 'PC-CLG-ST10', name: 'Colgate Strong Teeth Dental Toothpaste 100g', brand: 'Colgate', category: 'Personal Care', variant: 'Toothpaste', pack_size: '100g', price_paise: 6500, stock_quantity: 15, reorder_level: 5, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'f0000001-0000-0000-0000-000000000002', sku: 'PC-DTL-SP75', name: 'Dettol Original Bathing Soap 75g', brand: 'Dettol', category: 'Personal Care', variant: 'Soap', pack_size: '75g', price_paise: 4000, stock_quantity: 18, reorder_level: 6, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'f0000001-0000-0000-0000-000000000003', sku: 'PC-LUX-ROS1', name: 'Lux Rose Glowing Skin Beauty Soap 100g', brand: 'Lux', category: 'Personal Care', variant: 'Soap', pack_size: '100g', price_paise: 3800, stock_quantity: 14, reorder_level: 4, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'f0000001-0000-0000-0000-000000000004', sku: 'PC-CLN-PLS1', name: 'Clinic Plus Strong & Long Health Shampoo 175ml', brand: 'Clinic Plus', category: 'Personal Care', variant: 'Shampoo', pack_size: '175ml', price_paise: 12000, stock_quantity: 10, reorder_level: 3, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

const INITIAL_ALIASES: ProductAlias[] = [
  // Aashirvaad 5kg
  { id: 'al-01', product_id: 'a0000001-0000-0000-0000-000000000001', alias: 'aashirvaad atta 5kg', normalized_alias: 'aashirvaad atta 5kg' },
  { id: 'al-02', product_id: 'a0000001-0000-0000-0000-000000000001', alias: 'ashirwad aata 5kg', normalized_alias: 'ashirwad aata 5kg' },
  { id: 'al-03', product_id: 'a0000001-0000-0000-0000-000000000001', alias: 'aashirvaad 5 kilo', normalized_alias: 'aashirvaad 5 kilo' },
  { id: 'al-04', product_id: 'a0000001-0000-0000-0000-000000000001', alias: 'ashirwad 5kg', normalized_alias: 'ashirwad 5kg' },
  { id: 'al-05', product_id: 'a0000001-0000-0000-0000-000000000001', alias: 'atta 5 kilo', normalized_alias: 'atta 5 kilo' },
  { id: 'al-06', product_id: 'a0000001-0000-0000-0000-000000000001', alias: 'aashirvaad atta', normalized_alias: 'aashirvaad atta' },
  { id: 'al-07', product_id: 'a0000001-0000-0000-0000-000000000001', alias: 'atta 5kg', normalized_alias: 'atta 5kg' },

  // Aashirvaad 10kg
  { id: 'al-11', product_id: 'a0000001-0000-0000-0000-000000000002', alias: 'aashirvaad atta 10kg', normalized_alias: 'aashirvaad atta 10kg' },
  { id: 'al-12', product_id: 'a0000001-0000-0000-0000-000000000002', alias: 'ashirwad aata 10kg', normalized_alias: 'ashirwad aata 10kg' },
  { id: 'al-13', product_id: 'a0000001-0000-0000-0000-000000000002', alias: 'aashirvaad 10 kilo', normalized_alias: 'aashirvaad 10 kilo' },

  // Fortune 5kg
  { id: 'al-21', product_id: 'a0000001-0000-0000-0000-000000000003', alias: 'fortune atta 5kg', normalized_alias: 'fortune atta 5kg' },

  // Dals & Rice
  { id: 'al-31', product_id: 'a0000001-0000-0000-0000-000000000004', alias: 'toor dal', normalized_alias: 'toor dal' },
  { id: 'al-32', product_id: 'a0000001-0000-0000-0000-000000000004', alias: 'arhar dal', normalized_alias: 'arhar dal' },
  { id: 'al-33', product_id: 'a0000001-0000-0000-0000-000000000005', alias: 'moong dal', normalized_alias: 'moong dal' },
  { id: 'al-34', product_id: 'a0000001-0000-0000-0000-000000000006', alias: 'basmati chawal', normalized_alias: 'basmati chawal' },
  { id: 'al-35', product_id: 'a0000001-0000-0000-0000-000000000006', alias: 'india gate rice', normalized_alias: 'india gate rice' },
  { id: 'al-36', product_id: 'a0000001-0000-0000-0000-000000000007', alias: 'daawat rice', normalized_alias: 'daawat rice' },

  // Salt & Sugar
  { id: 'al-41', product_id: 'a0000001-0000-0000-0000-000000000008', alias: 'tata namak', normalized_alias: 'tata namak' },
  { id: 'al-42', product_id: 'a0000001-0000-0000-0000-000000000008', alias: 'namak', normalized_alias: 'namak' },
  { id: 'al-43', product_id: 'a0000001-0000-0000-0000-000000000009', alias: 'madhur chini', normalized_alias: 'madhur chini' },
  { id: 'al-44', product_id: 'a0000001-0000-0000-0000-000000000010', alias: 'chini', normalized_alias: 'chini' },
  { id: 'al-45', product_id: 'a0000001-0000-0000-0000-000000000010', alias: 'sugar', normalized_alias: 'sugar' },

  // Edible Oils
  { id: 'al-51', product_id: 'b0000001-0000-0000-0000-000000000001', alias: 'fortune oil', normalized_alias: 'fortune oil' },
  { id: 'al-52', product_id: 'b0000001-0000-0000-0000-000000000001', alias: 'fortune tel', normalized_alias: 'fortune tel' },
  { id: 'al-53', product_id: 'b0000001-0000-0000-0000-000000000001', alias: 'fortune sunflower oil', normalized_alias: 'fortune sunflower oil' },
  { id: 'al-54', product_id: 'b0000001-0000-0000-0000-000000000001', alias: 'fortune 1l', normalized_alias: 'fortune 1l' },
  { id: 'al-55', product_id: 'b0000001-0000-0000-0000-000000000001', alias: 'fortune oil 1 litre', normalized_alias: 'fortune oil 1 litre' },
  { id: 'al-56', product_id: 'b0000001-0000-0000-0000-000000000002', alias: 'dhara oil', normalized_alias: 'dhara oil' },
  { id: 'al-57', product_id: 'b0000001-0000-0000-0000-000000000002', alias: 'dhara tel', normalized_alias: 'dhara tel' },
  { id: 'al-58', product_id: 'b0000001-0000-0000-0000-000000000002', alias: 'sarson tel', normalized_alias: 'sarson tel' },
  { id: 'al-58a', product_id: 'b0000001-0000-0000-0000-000000000002', alias: 'sarson oil', normalized_alias: 'sarson oil' },
  { id: 'al-58b', product_id: 'b0000001-0000-0000-0000-000000000002', alias: 'mustard oil', normalized_alias: 'mustard oil' },
  { id: 'al-58c', product_id: 'b0000001-0000-0000-0000-000000000002', alias: 'sarson tel 1l', normalized_alias: 'sarson tel 1l' },
  { id: 'al-58d', product_id: 'b0000001-0000-0000-0000-000000000002', alias: 'sarson oil 1l', normalized_alias: 'sarson oil 1l' },
  { id: 'al-58e', product_id: 'b0000001-0000-0000-0000-000000000002', alias: 'kachi ghani', normalized_alias: 'kachi ghani' },
  { id: 'al-59', product_id: 'b0000001-0000-0000-0000-000000000002', alias: 'sarson ka tel', normalized_alias: 'sarson ka tel' },
  { id: 'al-60', product_id: 'b0000001-0000-0000-0000-000000000003', alias: 'saffola oil', normalized_alias: 'saffola oil' },
  { id: 'al-61', product_id: 'b0000001-0000-0000-0000-000000000003', alias: 'saffola gold', normalized_alias: 'saffola gold' },
  { id: 'al-62', product_id: 'b0000001-0000-0000-0000-000000000005', alias: 'fortune 500ml', normalized_alias: 'fortune 500ml' },

  // Dairy & Eggs
  { id: 'al-71', product_id: 'c0000001-0000-0000-0000-000000000001', alias: 'amul doodh', normalized_alias: 'amul doodh' },
  { id: 'al-72', product_id: 'c0000001-0000-0000-0000-000000000001', alias: 'amul milk', normalized_alias: 'amul milk' },
  { id: 'al-73', product_id: 'c0000001-0000-0000-0000-000000000001', alias: 'doodh', normalized_alias: 'doodh' },
  { id: 'al-74', product_id: 'c0000001-0000-0000-0000-000000000001', alias: 'milk', normalized_alias: 'milk' },
  { id: 'al-75', product_id: 'c0000001-0000-0000-0000-000000000002', alias: 'amul gold', normalized_alias: 'amul gold' },
  { id: 'al-76', product_id: 'c0000001-0000-0000-0000-000000000003', alias: 'mother dairy doodh', normalized_alias: 'mother dairy doodh' },
  { id: 'al-77', product_id: 'c0000001-0000-0000-0000-000000000004', alias: 'amul butter', normalized_alias: 'amul butter' },
  { id: 'al-78', product_id: 'c0000001-0000-0000-0000-000000000004', alias: 'butter', normalized_alias: 'butter' },
  { id: 'al-79', product_id: 'c0000001-0000-0000-0000-000000000004', alias: 'makhan', normalized_alias: 'makhan' },
  { id: 'al-80', product_id: 'c0000001-0000-0000-0000-000000000005', alias: 'ande 6', normalized_alias: 'ande 6' },
  { id: 'al-81', product_id: 'c0000001-0000-0000-0000-000000000005', alias: '6 ande', normalized_alias: '6 ande' },
  { id: 'al-82', product_id: 'c0000001-0000-0000-0000-000000000006', alias: 'ande 12', normalized_alias: 'ande 12' },
  { id: 'al-83', product_id: 'c0000001-0000-0000-0000-000000000006', alias: '12 ande', normalized_alias: '12 ande' },
  { id: 'al-84', product_id: 'c0000001-0000-0000-0000-000000000006', alias: 'egg tray', normalized_alias: 'egg tray' },
  { id: 'al-84a', product_id: 'c0000001-0000-0000-0000-000000000006', alias: '12 pack eggs tray', normalized_alias: '12 pack eggs tray' },
  { id: 'al-84b', product_id: 'c0000001-0000-0000-0000-000000000006', alias: '12 pack eggs', normalized_alias: '12 pack eggs' },
  { id: 'al-84c', product_id: 'c0000001-0000-0000-0000-000000000006', alias: 'eggs tray', normalized_alias: 'eggs tray' },
  { id: 'al-85', product_id: 'c0000001-0000-0000-0000-000000000006', alias: 'ande', normalized_alias: 'ande' },
  { id: 'al-86', product_id: 'c0000001-0000-0000-0000-000000000006', alias: 'eggs', normalized_alias: 'eggs' },
  { id: 'al-87', product_id: 'c0000001-0000-0000-0000-000000000007', alias: 'bread', normalized_alias: 'bread' },
  { id: 'al-88', product_id: 'c0000001-0000-0000-0000-000000000007', alias: 'white bread', normalized_alias: 'white bread' },
  { id: 'al-89', product_id: 'c0000001-0000-0000-0000-000000000008', alias: 'brown bread', normalized_alias: 'brown bread' },

  // Maggi & Snacks
  { id: 'al-91', product_id: 'd0000001-0000-0000-0000-000000000001', alias: 'maggi', normalized_alias: 'maggi' },
  { id: 'al-92', product_id: 'd0000001-0000-0000-0000-000000000001', alias: 'maggie', normalized_alias: 'maggie' },
  { id: 'al-93', product_id: 'd0000001-0000-0000-0000-000000000001', alias: 'maggi noodles', normalized_alias: 'maggi noodles' },
  { id: 'al-94', product_id: 'd0000001-0000-0000-0000-000000000001', alias: 'noodles', normalized_alias: 'noodles' },
  { id: 'al-95', product_id: 'd0000001-0000-0000-0000-000000000002', alias: 'maggi 4 pack', normalized_alias: 'maggi 4 pack' },
  { id: 'al-96', product_id: 'd0000001-0000-0000-0000-000000000002', alias: 'maggi 4 pack noodles', normalized_alias: 'maggi 4 pack noodles' },
  { id: 'al-97', product_id: 'd0000001-0000-0000-0000-000000000002', alias: '4 pack maggi', normalized_alias: '4 pack maggi' },
  { id: 'al-08', product_id: 'a0000001-0000-0000-0000-000000000001', alias: 'ashirwad ata', normalized_alias: 'ashirwad ata' },
  { id: 'al-09', product_id: 'a0000001-0000-0000-0000-000000000001', alias: 'ashirwad ata 5kg', normalized_alias: 'ashirwad ata 5kg' },
  { id: 'al-10', product_id: 'a0000001-0000-0000-0000-000000000001', alias: 'ata', normalized_alias: 'ata' },
  { id: 'al-95', product_id: 'd0000001-0000-0000-0000-000000000002', alias: 'maggi 4 pack', normalized_alias: 'maggi 4 pack' },
  { id: 'al-96', product_id: 'd0000001-0000-0000-0000-000000000003', alias: 'parle g', normalized_alias: 'parle g' },
  { id: 'al-97', product_id: 'd0000001-0000-0000-0000-000000000003', alias: 'parle-g', normalized_alias: 'parle-g' },
  { id: 'al-98', product_id: 'd0000001-0000-0000-0000-000000000003', alias: '10 wala parle g', normalized_alias: '10 wala parle g' },
  { id: 'al-99', product_id: 'd0000001-0000-0000-0000-000000000004', alias: 'good day', normalized_alias: 'good day' },
  { id: 'al-100', product_id: 'd0000001-0000-0000-0000-000000000005', alias: 'bhujia', normalized_alias: 'bhujia' },
  { id: 'al-101', product_id: 'd0000001-0000-0000-0000-000000000006', alias: 'lays', normalized_alias: 'lays' },

  // Household & Personal Care
  { id: 'al-111', product_id: 'e0000001-0000-0000-0000-000000000001', alias: 'surf excel', normalized_alias: 'surf excel' },
  { id: 'al-112', product_id: 'e0000001-0000-0000-0000-000000000001', alias: 'surf', normalized_alias: 'surf' },
  { id: 'al-113', product_id: 'e0000001-0000-0000-0000-000000000002', alias: 'vim bar', normalized_alias: 'vim bar' },
  { id: 'al-114', product_id: 'e0000001-0000-0000-0000-000000000002', alias: 'bartan ka sabun', normalized_alias: 'bartan ka sabun' },
  { id: 'al-115', product_id: 'f0000001-0000-0000-0000-000000000001', alias: 'colgate', normalized_alias: 'colgate' },
  { id: 'al-116', product_id: 'f0000001-0000-0000-0000-000000000002', alias: 'dettol soap', normalized_alias: 'dettol soap' },
  { id: 'al-117', product_id: 'f0000001-0000-0000-0000-000000000002', alias: 'dettol sabun', normalized_alias: 'dettol sabun' },
  { id: 'al-118', product_id: 'f0000001-0000-0000-0000-000000000003', alias: 'lux soap', normalized_alias: 'lux soap' }
];

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'c1000000-0000-0000-0000-000000000001', phone: '+919876543210', name: 'Shivam Sharma', address: 'Flat 402, Green Valley Apts, Sector 62', language: 'hinglish', substitution_preference: 'ASK', created_at: new Date().toISOString() },
  { id: 'c1000000-0000-0000-0000-000000000002', phone: '+919123456789', name: 'Pooja Verma', address: 'House 12, Gali 4, Shanti Nagar', language: 'hinglish', substitution_preference: 'ASK', created_at: new Date().toISOString() },
  { id: 'c1000000-0000-0000-0000-000000000003', phone: '+919988776655', name: 'Rohan Mehta', address: 'B-104, Sunrise Residency', language: 'hinglish', substitution_preference: 'AUTO_ACCEPT', created_at: new Date().toISOString() }
];

const INITIAL_ORDERS: Order[] = [
  { id: 'e1000000-0000-0000-0000-000000000001', customer_id: 'c1000000-0000-0000-0000-000000000001', source: 'whatsapp', status: 'DELIVERED', subtotal_paise: 17900, total_paise: 17900, raw_message: '2 amul doodh, 1 bread aur 12 ande bhej do', external_message_id: 'msg_prev_usual_1001', created_at: new Date(Date.now() - 172800000).toISOString() }
];

const INITIAL_ORDER_ITEMS: OrderItem[] = [
  { id: 'oi-01', order_id: 'e1000000-0000-0000-0000-000000000001', product_id: 'c0000001-0000-0000-0000-000000000001', quantity: 2, unit_price_paise: 2700, line_total_paise: 5400, substituted_for_product_id: null },
  { id: 'oi-02', order_id: 'e1000000-0000-0000-0000-000000000001', product_id: 'c0000001-0000-0000-0000-000000000007', quantity: 1, unit_price_paise: 4000, line_total_paise: 4000, substituted_for_product_id: null },
  { id: 'oi-03', order_id: 'e1000000-0000-0000-0000-000000000001', product_id: 'c0000001-0000-0000-0000-000000000006', quantity: 1, unit_price_paise: 8500, line_total_paise: 8500, substituted_for_product_id: null }
];

// In-Memory Database Store (Persists during server lifecycle, resets on demand)
class InMemoryStore {
  products: Product[] = [];
  aliases: ProductAlias[] = [];
  customers: Customer[] = [];
  orders: Order[] = [];
  orderItems: OrderItem[] = [];
  movements: InventoryMovement[] = [];
  agentRuns: AgentRun[] = [];
  agentEvents: AgentEvent[] = [];
  pendingConversations: Map<string, PendingConversation> = new Map();

  constructor() {
    this.reset();
  }

  reset() {
    this.products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
    this.aliases = JSON.parse(JSON.stringify(INITIAL_ALIASES));
    this.customers = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));
    this.orders = JSON.parse(JSON.stringify(INITIAL_ORDERS));
    this.orderItems = JSON.parse(JSON.stringify(INITIAL_ORDER_ITEMS));
    this.movements = [];
    this.agentRuns = [];
    this.agentEvents = [];
    this.pendingConversations = new Map();
  }
}

// Global in-memory singleton across hot-reloads
const globalStore = (globalThis as unknown as { __kiranaStore?: InMemoryStore });
if (!globalStore.__kiranaStore) {
  globalStore.__kiranaStore = new InMemoryStore();
}
const memStore = globalStore.__kiranaStore;

// Supabase client instance (if configured)
let supabaseClient: SupabaseClient | null = null;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  } catch (e) {
    console.warn('Failed to initialize Supabase client:', e);
  }
}

export const isUsingSupabase = (): boolean => !!supabaseClient;

// =========================================================================
// Normalization Helper
// =========================================================================
export function normalizeQuery(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// =========================================================================
// Products & Search
// =========================================================================

export async function getAllProducts(): Promise<Product[]> {
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from('products')
      .select('*')
      .order('category', { ascending: true });
    if (!error && data) return data as Product[];
  }
  return [...memStore.products];
}

export async function getProductById(id: string): Promise<Product | null> {
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    if (!error && data) return data as Product;
  }
  return memStore.products.find(p => p.id === id) || null;
}

export async function searchProductCandidates(queryText: string): Promise<Product[]> {
  const norm = normalizeQuery(queryText);
  if (!norm) return [];

  // 1. Direct Exact Alias Match: If customer phrase exactly matches an alias, it's a direct hit!
  const exactAlias = memStore.aliases.find(a => a.normalized_alias === norm);
  if (exactAlias) {
    const p = memStore.products.find(prod => prod.id === exactAlias.product_id);
    if (p && p.active) return [p];
  }

  // 2. Partial Alias Match
  const matchingAlias = memStore.aliases.find(a => 
    norm.includes(a.normalized_alias) || a.normalized_alias.includes(norm)
  );

  const candidates: Product[] = [];
  if (matchingAlias) {
    const p = memStore.products.find(prod => prod.id === matchingAlias.product_id);
    if (p && p.active) candidates.push(p);
  }

  // 3. Name & Brand matching (require ALL tokens if multi-word, or at least 2 tokens)
  const tokens = norm.split(' ').filter(t => t.length > 1);
  for (const prod of memStore.products) {
    if (!prod.active || candidates.some(c => c.id === prod.id)) continue;
    const prodNorm = normalizeQuery(`${prod.name} ${prod.brand || ''} ${prod.category} ${prod.variant || ''} ${prod.pack_size || ''}`);
    
    // For multi-word queries, require all tokens to match
    const matchesAll = tokens.length > 1
      ? tokens.every(t => prodNorm.includes(t))
      : tokens.some(t => prodNorm.includes(t));

    if (matchesAll) {
      candidates.push(prod);
    }
  }

  return candidates.slice(0, 5);
}

export async function findSubstitutionCandidates(
  category: string,
  excludeProductId: string,
  targetPackSize?: string | null
): Promise<Product[]> {
  const excluded = memStore.products.find(p => p.id === excludeProductId);
  const candidates = memStore.products.filter(p => 
    p.active &&
    p.id !== excludeProductId &&
    p.category.toLowerCase() === category.toLowerCase() &&
    p.stock_quantity > 0
  );

  if (candidates.length === 0) {
    // Fallback to any in-stock product with similar category keywords
    return memStore.products.filter(p => p.active && p.id !== excludeProductId && p.stock_quantity > 0).slice(0, 3);
  }

  // Deterministic Ranking:
  // Same brand: +40
  // Same/similar pack size: +30
  // Price diff <= 10%: +20
  const ranked = candidates.map(candidate => {
    let score = 0;
    if (excluded && excluded.brand && candidate.brand && excluded.brand.toLowerCase() === candidate.brand.toLowerCase()) {
      score += 40;
    }
    if (targetPackSize && candidate.pack_size && candidate.pack_size.toLowerCase() === targetPackSize.toLowerCase()) {
      score += 30;
    } else if (excluded && excluded.pack_size && candidate.pack_size && excluded.pack_size.toLowerCase() === candidate.pack_size.toLowerCase()) {
      score += 30;
    }
    if (excluded && excluded.price_paise > 0) {
      const priceDiff = Math.abs(candidate.price_paise - excluded.price_paise) / excluded.price_paise;
      if (priceDiff <= 0.10) {
        score += 20;
      } else if (priceDiff <= 0.25) {
        score += 10;
      }
    }
    return { candidate, score };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked.map(r => r.candidate).slice(0, 3);
}

export async function updateProductStock(productId: string, newStock: number): Promise<boolean> {
  if (supabaseClient) {
    const { error } = await supabaseClient
      .from('products')
      .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
      .eq('id', productId);
    if (!error) return true;
  }
  const prod = memStore.products.find(p => p.id === productId);
  if (prod) {
    const before = prod.stock_quantity;
    prod.stock_quantity = Math.max(0, newStock);
    prod.updated_at = new Date().toISOString();
    
    // Record manual adjustment
    memStore.movements.unshift({
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      product_id: prod.id,
      order_id: null,
      type: 'MANUAL_ADJUSTMENT',
      quantity_change: prod.stock_quantity - before,
      stock_before: before,
      stock_after: prod.stock_quantity,
      created_at: new Date().toISOString()
    });
    return true;
  }
  return false;
}

// =========================================================================
// Customers
// =========================================================================

export async function getOrCreateCustomer(phone: string, name?: string, address?: string): Promise<Customer> {
  const digitsOnly = phone.replace(/[^\d]/g, '');
  const cleanPhone = digitsOnly.length >= 10 ? `+91${digitsOnly.slice(-10)}` : phone.trim();
  let cust = memStore.customers.find(c => c.phone.replace(/[^\d]/g, '').slice(-10) === digitsOnly.slice(-10));
  if (!cust) {
    cust = {
      id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      phone: cleanPhone,
      name: name || 'Customer',
      address: address || null,
      language: 'hinglish',
      substitution_preference: 'ASK',
      created_at: new Date().toISOString()
    };
    memStore.customers.push(cust);
  } else {
    if (name && !cust.name) cust.name = name;
    if (address && !cust.address) cust.address = address;
  }
  return cust;
}

export async function getAllCustomers(): Promise<Customer[]> {
  return [...memStore.customers];
}

export async function getCustomerLastOrder(customerId: string): Promise<{ order: Order; items: OrderItem[] } | null> {
  const customerOrders = memStore.orders
    .filter(o => o.customer_id === customerId && o.status !== 'CANCELLED')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (customerOrders.length === 0) return null;
  const lastOrder = customerOrders[0];
  const items = memStore.orderItems
    .filter(oi => oi.order_id === lastOrder.id)
    .map(oi => ({
      ...oi,
      product: memStore.products.find(p => p.id === oi.product_id)
    }));

  return { order: lastOrder, items };
}

// =========================================================================
// Atomic Order Execution RPC (Database Concurrency & Idempotency)
// =========================================================================

export interface AtomicOrderParams {
  customerId: string;
  source: 'whatsapp' | 'web_demo' | 'voice';
  rawMessage: string;
  externalMessageId?: string | null;
  deliveryAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  deliveryNotes?: string | null;
  items: Array<{
    product_id: string;
    quantity: number;
    substituted_for_product_id?: string | null;
  }>;
}

export interface AtomicOrderResult {
  success: boolean;
  idempotent?: boolean;
  order_id?: string;
  subtotal_paise?: number;
  total_paise?: number;
  items?: Array<{
    product_id: string;
    name: string;
    quantity: number;
    unit_price_paise: number;
    line_total_paise: number;
    stock_after: number;
    substituted_for_product_id?: string | null;
  }>;
  low_stock_alerts?: LowStockAlert[];
  error?: string;
  message?: string;
  out_of_stock_item?: {
    product_id: string;
    name: string;
    requested: number;
    available: number;
  };
}

export async function executeOrderAtomic(params: AtomicOrderParams): Promise<AtomicOrderResult> {
  const { customerId, source, rawMessage, externalMessageId, items } = params;

  // 1. Idempotency check
  if (externalMessageId) {
    const existing = memStore.orders.find(o => o.external_message_id === externalMessageId);
    if (existing) {
      const existingItems = memStore.orderItems.filter(oi => oi.order_id === existing.id);
      return {
        success: true,
        idempotent: true,
        order_id: existing.id,
        subtotal_paise: existing.subtotal_paise,
        total_paise: existing.total_paise,
        items: existingItems.map(oi => {
          const prod = memStore.products.find(p => p.id === oi.product_id);
          return {
            product_id: oi.product_id,
            name: prod ? prod.name : 'Unknown',
            quantity: oi.quantity,
            unit_price_paise: oi.unit_price_paise,
            line_total_paise: oi.line_total_paise,
            stock_after: prod ? prod.stock_quantity : 0
          };
        }),
        low_stock_alerts: []
      };
    }
  }

  // 2. Validate items
  if (!items || items.length === 0) {
    return { success: false, error: 'EMPTY_ITEMS', message: 'No items in order' };
  }

  // 3. Atomically check live stock of all products first (Simulation of SELECT FOR UPDATE)
  let subtotalPaise = 0;
  for (const item of items) {
    const product = memStore.products.find(p => p.id === item.product_id);
    if (!product) {
      return { success: false, error: 'PRODUCT_NOT_FOUND', message: `Product ${item.product_id} not found` };
    }
    if (!product.active) {
      return { success: false, error: 'PRODUCT_INACTIVE', message: `Product ${product.name} is inactive` };
    }
    if (product.stock_quantity < item.quantity) {
      return {
        success: false,
        error: 'INSUFFICIENT_STOCK',
        out_of_stock_item: {
          product_id: product.id,
          name: product.name,
          requested: item.quantity,
          available: product.stock_quantity
        }
      };
    }
    // Authoritative pricing from LIVE DB:
    subtotalPaise += product.price_paise * item.quantity;
  }

  const totalPaise = subtotalPaise;
  const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  // 4. Create Order
  const order: Order = {
    id: orderId,
    customer_id: customerId,
    source,
    status: 'CONFIRMED',
    subtotal_paise: subtotalPaise,
    total_paise: totalPaise,
    raw_message: rawMessage,
    external_message_id: externalMessageId || null,
    delivery_address: params.deliveryAddress || null,
    latitude: params.latitude || null,
    longitude: params.longitude || null,
    distance_km: params.distanceKm || null,
    delivery_notes: params.deliveryNotes || null,
    created_at: now
  };
  memStore.orders.unshift(order);

  // If Supabase is active, persist to Supabase
  if (supabaseClient) {
    try {
      await supabaseClient.from('orders').insert({
        id: order.id,
        customer_id: order.customer_id,
        source: order.source,
        status: order.status,
        subtotal_paise: order.subtotal_paise,
        total_paise: order.total_paise,
        raw_message: order.raw_message,
        external_message_id: order.external_message_id,
        delivery_address: order.delivery_address,
        latitude: order.latitude,
        longitude: order.longitude,
        distance_km: order.distance_km,
        delivery_notes: order.delivery_notes,
        created_at: order.created_at
      });
    } catch (e) {
      console.warn('Could not persist order to Supabase:', e);
    }
  }

  // 5. Deduct stock, record movements, create order items, check low stock
  const outItems: NonNullable<AtomicOrderResult['items']> = [];
  const lowStockAlerts: LowStockAlert[] = [];

  for (const item of items) {
    const product = memStore.products.find(p => p.id === item.product_id)!;
    const lineTotal = product.price_paise * item.quantity;
    const stockBefore = product.stock_quantity;
    const stockAfter = stockBefore - item.quantity;

    // Mutate inventory
    product.stock_quantity = stockAfter;
    product.updated_at = now;

    // Create Order Item
    const orderItemId = `oi-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    memStore.orderItems.push({
      id: orderItemId,
      order_id: orderId,
      product_id: product.id,
      quantity: item.quantity,
      unit_price_paise: product.price_paise,
      line_total_paise: lineTotal,
      substituted_for_product_id: item.substituted_for_product_id || null
    });

    // Record Inventory Movement
    memStore.movements.unshift({
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      product_id: product.id,
      order_id: orderId,
      type: 'ORDER_SALE',
      quantity_change: -item.quantity,
      stock_before: stockBefore,
      stock_after: stockAfter,
      created_at: now
    });

    outItems.push({
      product_id: product.id,
      name: product.name,
      quantity: item.quantity,
      unit_price_paise: product.price_paise,
      line_total_paise: lineTotal,
      stock_after: stockAfter,
      substituted_for_product_id: item.substituted_for_product_id || null
    });

    // Low stock detection
    if (stockAfter <= product.reorder_level) {
      lowStockAlerts.push({
        product_id: product.id,
        name: product.name,
        current_stock: stockAfter,
        reorder_level: product.reorder_level
      });
    }
  }

  return {
    success: true,
    idempotent: false,
    order_id: orderId,
    subtotal_paise: subtotalPaise,
    total_paise: totalPaise,
    items: outItems,
    low_stock_alerts: lowStockAlerts
  };
}

// =========================================================================
// Pending Conversations (Two-Turn Recovery & Approvals)
// =========================================================================

export async function getPendingConversation(phone: string): Promise<PendingConversation | null> {
  const pending = memStore.pendingConversations.get(phone);
  if (!pending) return null;
  if (new Date(pending.expires_at).getTime() < Date.now()) {
    memStore.pendingConversations.delete(phone);
    return null;
  }
  return pending;
}

export async function setPendingConversation(
  phone: string,
  state: PendingConversation['pending_state']
): Promise<void> {
  const id = `pend-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  memStore.pendingConversations.set(phone, {
    id,
    customer_phone: phone,
    pending_state: state,
    expires_at: expiresAt,
    updated_at: new Date().toISOString()
  });
}

export async function clearPendingConversation(phone: string): Promise<void> {
  memStore.pendingConversations.delete(phone);
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<Order | null> {
  const order = memStore.orders.find(o => o.id === orderId);
  if (order) {
    order.status = status;
  }
  if (supabaseClient) {
    try {
      await supabaseClient.from('orders').update({ status }).eq('id', orderId);
    } catch (e) {
      console.warn('Failed to update order status in Supabase:', e);
    }
  }
  return order || null;
}

// =========================================================================
// Agent Runs & Transparent Traces
// =========================================================================

export async function createAgentRun(run: {
  customer_id: string | null;
  source: string;
  raw_input: string;
}): Promise<AgentRun> {
  const agentRun: AgentRun = {
    id: `run-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    customer_id: run.customer_id,
    source: run.source,
    raw_input: run.raw_input,
    intent: null,
    confidence: null,
    status: 'IN_PROGRESS',
    latency_ms: null,
    created_at: new Date().toISOString()
  };
  memStore.agentRuns.unshift(agentRun);
  return agentRun;
}

export async function updateAgentRun(
  id: string,
  updates: Partial<Pick<AgentRun, 'customer_id' | 'intent' | 'confidence' | 'status' | 'latency_ms'>>
): Promise<void> {
  const run = memStore.agentRuns.find(r => r.id === id);
  if (run) {
    if (updates.customer_id !== undefined) run.customer_id = updates.customer_id;
    if (updates.intent !== undefined) run.intent = updates.intent;
    if (updates.confidence !== undefined) run.confidence = updates.confidence;
    if (updates.status !== undefined) run.status = updates.status;
    if (updates.latency_ms !== undefined) run.latency_ms = updates.latency_ms;
  }
}

export async function recordAgentEvent(
  agentRunId: string,
  step: string,
  status: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR',
  payload: Record<string, unknown> | null = null
): Promise<AgentEvent> {
  const event: AgentEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    agent_run_id: agentRunId,
    step,
    status,
    payload,
    created_at: new Date().toISOString()
  };
  memStore.agentEvents.push(event);
  return event;
}

export async function getAgentRunEvents(runId: string): Promise<AgentEvent[]> {
  return memStore.agentEvents
    .filter(e => e.agent_run_id === runId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export async function getAllAgentRuns(limit = 20): Promise<AgentRun[]> {
  return memStore.agentRuns.slice(0, limit);
}

// =========================================================================
// Orders & Dashboard Queries
// =========================================================================

export async function getAllOrders(limit = 50): Promise<Order[]> {
  return memStore.orders.slice(0, limit);
}

export async function getOrderWithDetails(orderId: string): Promise<{ order: Order; items: OrderItem[]; customer: Customer | null } | null> {
  const order = memStore.orders.find(o => o.id === orderId);
  if (!order) return null;
  const items = memStore.orderItems
    .filter(oi => oi.order_id === order.id)
    .map(oi => ({
      ...oi,
      product: memStore.products.find(p => p.id === oi.product_id)
    }));
  const customer = memStore.customers.find(c => c.id === order.customer_id) || null;
  return { order, items, customer };
}

export async function getDashboardMetrics() {
  const totalOrders = memStore.orders.length;
  const totalRevenuePaise = memStore.orders.reduce((acc, o) => acc + o.total_paise, 0);
  
  // Real calculation of autonomous completion rate:
  // orders completed without owner review / total orders
  const confirmedOrders = memStore.orders.filter(o => o.status === 'CONFIRMED' || o.status === 'DELIVERED').length;
  const reviewOrders = memStore.orders.filter(o => o.status === 'NEEDS_REVIEW').length;
  const autoRate = totalOrders > 0 ? Math.round((confirmedOrders / totalOrders) * 100) : 100;

  // Real low stock count
  const lowStockProducts = memStore.products.filter(p => p.active && p.stock_quantity <= p.reorder_level);

  // Average execution latency from agent runs
  const runsWithLatency = memStore.agentRuns.filter(r => r.latency_ms && r.latency_ms > 0);
  const avgLatencyMs = runsWithLatency.length > 0
    ? Math.round(runsWithLatency.reduce((acc, r) => acc + (r.latency_ms || 0), 0) / runsWithLatency.length)
    : 1450;

  return {
    todayOrders: totalOrders,
    todayRevenuePaise: totalRevenuePaise,
    todayRevenueINR: (totalRevenuePaise / 100).toFixed(2),
    automationRate: autoRate,
    needsReviewCount: reviewOrders,
    lowStockCount: lowStockProducts.length,
    lowStockProducts,
    avgLatencyMs
  };
}

export async function resetDatabaseToSeed(): Promise<void> {
  memStore.reset();
}

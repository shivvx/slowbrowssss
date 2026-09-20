-- KiranaPilot Realistic Seed Data: ~40 Indian Grocery Products + Hinglish Aliases

-- 1. Insert Products
INSERT INTO products (id, sku, name, brand, category, variant, pack_size, price_paise, stock_quantity, reorder_level, active) VALUES
-- Staples
('a0000001-0000-0000-0000-000000000001', 'ST-ASH-05K', 'Aashirvaad Shudh Chakki Atta 5kg', 'Aashirvaad', 'Staples', 'Chakki Fresh', '5kg', 28900, 8, 3, true),
('a0000001-0000-0000-0000-000000000002', 'ST-ASH-10K', 'Aashirvaad Shudh Chakki Atta 10kg', 'Aashirvaad', 'Staples', 'Chakki Fresh', '10kg', 54000, 5, 2, true),
('a0000001-0000-0000-0000-000000000003', 'ST-FRT-05K', 'Fortune Chakki Fresh Atta 5kg', 'Fortune', 'Staples', 'Chakki Fresh', '5kg', 26500, 6, 2, true),
('a0000001-0000-0000-0000-000000000004', 'ST-TTS-01K', 'Tata Sampann Unpolished Toor Dal 1kg', 'Tata Sampann', 'Staples', 'Toor Dal', '1kg', 17500, 12, 4, true),
('a0000001-0000-0000-0000-000000000005', 'ST-TTM-01K', 'Tata Sampann Moong Dal 1kg', 'Tata Sampann', 'Staples', 'Moong Dal', '1kg', 14500, 10, 3, true),
('a0000001-0000-0000-0000-000000000006', 'ST-IGR-01K', 'India Gate Basmati Rice Rozzana 1kg', 'India Gate', 'Staples', 'Basmati Rice', '1kg', 11500, 15, 5, true),
('a0000001-0000-0000-0000-000000000007', 'ST-DWT-01K', 'Daawat Rozana Super Basmati Rice 1kg', 'Daawat', 'Staples', 'Basmati Rice', '1kg', 9500, 14, 4, true),
('a0000001-0000-0000-0000-000000000008', 'ST-TTS-SALT', 'Tata Salt Vacuum Evaporated 1kg', 'Tata', 'Staples', 'Salt', '1kg', 2800, 25, 8, true),
('a0000001-0000-0000-0000-000000000009', 'ST-MDH-SUG1', 'Madhur Pure & Hygienic Sugar 1kg', 'Madhur', 'Staples', 'Sugar', '1kg', 5200, 20, 5, true),
('a0000001-0000-0000-0000-000000000010', 'ST-GEN-SUG1', 'Loose Premium Sugar 1kg', 'Generic', 'Staples', 'Sugar', '1kg', 4400, 30, 10, true),
('a0000001-0000-0000-0000-000000000011', 'SP-CAT-PEP', 'Catch Black Pepper Powder 100g', 'Catch', 'Spices', 'Black Pepper', '100g', 9800, 10, 3, true),
('a0000001-0000-0000-0000-000000000012', 'SP-EVR-HLD', 'Everest Turmeric Powder 200g', 'Everest', 'Spices', 'Haldi', '200g', 6200, 15, 4, true),
('a0000001-0000-0000-0000-000000000013', 'SP-MDH-MRC', 'MDH Deggi Mirch Powder 100g', 'MDH', 'Spices', 'Mirchi', '100g', 8800, 12, 4, true),

-- Edible Oils (Note: Fortune Oil 1L stock is 0 for substitution demo!)
('b0000001-0000-0000-0000-000000000001', 'OL-FRT-SUN1', 'Fortune Sunlite Refined Sunflower Oil 1L', 'Fortune', 'Edible Oils', 'Sunflower', '1L', 15200, 0, 5, true),
('b0000001-0000-0000-0000-000000000002', 'OL-DHR-MST1', 'Dhara Kachi Ghani Mustard Oil 1L', 'Dhara', 'Edible Oils', 'Mustard', '1L', 14800, 12, 4, true),
('b0000001-0000-0000-0000-000000000003', 'OL-SAF-GLD1', 'Saffola Gold Pro Healthy Edible Oil 1L', 'Saffola', 'Edible Oils', 'Blended', '1L', 17100, 8, 3, true),
('b0000001-0000-0000-0000-000000000004', 'OL-FRT-MST1', 'Fortune Kachi Ghani Mustard Oil 1L', 'Fortune', 'Edible Oils', 'Mustard', '1L', 15500, 7, 3, true),
('b0000001-0000-0000-0000-000000000005', 'OL-FRT-SUN5', 'Fortune Sunlite Refined Sunflower Oil 500ml', 'Fortune', 'Edible Oils', 'Sunflower', '500ml', 8200, 10, 3, true),

-- Dairy, Bakery & Eggs
('c0000001-0000-0000-0000-000000000001', 'DY-AML-TZ5', 'Amul Taaza Toned Milk 500ml', 'Amul', 'Dairy', 'Toned Milk', '500ml', 2700, 20, 8, true),
('c0000001-0000-0000-0000-000000000002', 'DY-AML-GL5', 'Amul Gold Full Cream Milk 500ml', 'Amul', 'Dairy', 'Full Cream', '500ml', 3300, 18, 6, true),
('c0000001-0000-0000-0000-000000000003', 'DY-MD-TN5', 'Mother Dairy Toned Milk 500ml', 'Mother Dairy', 'Dairy', 'Toned Milk', '500ml', 2700, 15, 5, true),
('c0000001-0000-0000-0000-000000000004', 'DY-AML-BTR1', 'Amul Butter Pasteurized 100g', 'Amul', 'Dairy', 'Butter', '100g', 5600, 12, 4, true),
('c0000001-0000-0000-0000-000000000005', 'DY-GEN-EGG6', 'Fresh Farm White Eggs 6 Pack', 'Generic', 'Dairy & Eggs', 'Eggs', '6 pack', 4500, 14, 5, true),
('c0000001-0000-0000-0000-000000000006', 'DY-GEN-EG12', 'Fresh Farm White Eggs 12 Pack Tray', 'Generic', 'Dairy & Eggs', 'Eggs', '12 pack', 8500, 10, 3, true),
('c0000001-0000-0000-0000-000000000007', 'BK-HVG-WHT', 'Harvest Gold White Bread 400g', 'Harvest Gold', 'Bakery', 'White Bread', '400g', 4000, 15, 5, true),
('c0000001-0000-0000-0000-000000000008', 'BK-BRT-WHT', 'Britannia 100% Whole Wheat Bread 400g', 'Britannia', 'Bakery', 'Brown Bread', '400g', 5000, 8, 3, true),

-- Snacks, Biscuits & Instant Food
('d0000001-0000-0000-0000-000000000001', 'SN-MAG-MS70', 'Maggi 2-Minute Instant Noodles Masala 70g', 'Maggi', 'Snacks & Packaged Food', 'Masala', '70g', 1400, 25, 10, true),
('d0000001-0000-0000-0000-000000000002', 'SN-MAG-MS4P', 'Maggi 2-Minute Noodles Masala 4-Pack 280g', 'Maggi', 'Snacks & Packaged Food', 'Masala', '280g', 5400, 12, 4, true),
('d0000001-0000-0000-0000-000000000003', 'SN-PRL-G10', 'Parle-G Glucose Biscuits ₹10 Pack 250g', 'Parle', 'Snacks & Packaged Food', 'Glucose', '250g', 1000, 4, 10, true), -- Low stock for demo!
('d0000001-0000-0000-0000-000000000004', 'SN-BRT-GD12', 'Britannia Good Day Butter Cookies 120g', 'Britannia', 'Snacks & Packaged Food', 'Butter', '120g', 2500, 16, 5, true),
('d0000001-0000-0000-0000-000000000005', 'SN-HLD-BHU2', 'Haldiram Nagpur Bhujia Sev 200g', 'Haldiram', 'Snacks & Packaged Food', 'Namkeen', '200g', 5500, 14, 4, true),
('d0000001-0000-0000-0000-000000000006', 'SN-LAY-MAG5', 'Lays India Magic Masala Chips 50g', 'Lays', 'Snacks & Packaged Food', 'Chips', '50g', 2000, 20, 6, true),

-- Household & Cleaning
('e0000001-0000-0000-0000-000000000001', 'HC-SRF-EW1K', 'Surf Excel Easy Wash Detergent Powder 1kg', 'Surf Excel', 'Household & Cleaning', 'Detergent', '1kg', 14000, 10, 3, true),
('e0000001-0000-0000-0000-000000000002', 'HC-VIM-BAR1', 'Vim Dishwash Bar 135g', 'Vim', 'Household & Cleaning', 'Dishwash Bar', '135g', 1000, 30, 10, true),
('e0000001-0000-0000-0000-000000000003', 'HC-VIM-GEL2', 'Vim Dishwash Gel Lemon 250ml', 'Vim', 'Household & Cleaning', 'Gel', '250ml', 6000, 8, 3, true),
('e0000001-0000-0000-0000-000000000004', 'HC-HRP-OR50', 'Harpic Power Plus Toilet Cleaner Original 500ml', 'Harpic', 'Household & Cleaning', 'Cleaner', '500ml', 9900, 9, 3, true),

-- Personal Care
('f0000001-0000-0000-0000-000000000001', 'PC-CLG-ST10', 'Colgate Strong Teeth Dental Toothpaste 100g', 'Colgate', 'Personal Care', 'Toothpaste', '100g', 6500, 15, 5, true),
('f0000001-0000-0000-0000-000000000002', 'PC-DTL-SP75', 'Dettol Original Bathing Soap 75g', 'Dettol', 'Personal Care', 'Soap', '75g', 4000, 18, 6, true),
('f0000001-0000-0000-0000-000000000003', 'PC-LUX-ROS1', 'Lux Rose Glowing Skin Beauty Soap 100g', 'Lux', 'Personal Care', 'Soap', '100g', 3800, 14, 4, true),
('f0000001-0000-0000-0000-000000000004', 'PC-CLN-PLS1', 'Clinic Plus Strong & Long Health Shampoo 175ml', 'Clinic Plus', 'Personal Care', 'Shampoo', '175ml', 12000, 10, 3, true)
ON CONFLICT (sku) DO NOTHING;

-- 2. Insert Product Aliases for Hinglish & Slang
INSERT INTO product_aliases (product_id, alias, normalized_alias) VALUES
-- Aashirvaad 5kg
('a0000001-0000-0000-0000-000000000001', 'aashirvaad atta 5kg', 'aashirvaad atta 5kg'),
('a0000001-0000-0000-0000-000000000001', 'ashirwad aata 5kg', 'ashirwad aata 5kg'),
('a0000001-0000-0000-0000-000000000001', 'aashirvaad 5 kilo', 'aashirvaad 5 kilo'),
('a0000001-0000-0000-0000-000000000001', 'ashirvaad atta 5kg', 'ashirvaad atta 5kg'),
('a0000001-0000-0000-0000-000000000001', 'ashirwad 5kg', 'ashirwad 5kg'),
('a0000001-0000-0000-0000-000000000001', 'atta 5 kilo', 'atta 5 kilo'),
('a0000001-0000-0000-0000-000000000001', 'aashirvaad atta', 'aashirvaad atta'),

-- Aashirvaad 10kg
('a0000001-0000-0000-0000-000000000002', 'aashirvaad atta 10kg', 'aashirvaad atta 10kg'),
('a0000001-0000-0000-0000-000000000002', 'ashirwad aata 10kg', 'ashirwad aata 10kg'),
('a0000001-0000-0000-0000-000000000002', 'aashirvaad 10 kilo', 'aashirvaad 10 kilo'),

-- Fortune 5kg Atta
('a0000001-0000-0000-0000-000000000003', 'fortune atta 5kg', 'fortune atta 5kg'),
('a0000001-0000-0000-0000-000000000003', 'fortune aata 5kg', 'fortune aata 5kg'),

-- Dals
('a0000001-0000-0000-0000-000000000004', 'toor dal', 'toor dal'),
('a0000001-0000-0000-0000-000000000004', 'arhar dal', 'arhar dal'),
('a0000001-0000-0000-0000-000000000004', 'tuvar dal', 'tuvar dal'),
('a0000001-0000-0000-0000-000000000005', 'moong dal', 'moong dal'),
('a0000001-0000-0000-0000-000000000005', 'mung dal', 'mung dal'),

-- Rice
('a0000001-0000-0000-0000-000000000006', 'basmati chawal', 'basmati chawal'),
('a0000001-0000-0000-0000-000000000006', 'india gate chawal', 'india gate chawal'),
('a0000001-0000-0000-0000-000000000006', 'india gate rice', 'india gate rice'),
('a0000001-0000-0000-0000-000000000007', 'daawat chawal', 'daawat chawal'),
('a0000001-0000-0000-0000-000000000007', 'daawat rice', 'daawat rice'),

-- Salt & Sugar
('a0000001-0000-0000-0000-000000000008', 'tata namak', 'tata namak'),
('a0000001-0000-0000-0000-000000000008', 'namak', 'namak'),
('a0000001-0000-0000-0000-000000000008', 'tata salt', 'tata salt'),
('a0000001-0000-0000-0000-000000000009', 'madhur chini', 'madhur chini'),
('a0000001-0000-0000-0000-000000000009', 'madhur sugar', 'madhur sugar'),
('a0000001-0000-0000-0000-000000000010', 'chini', 'chini'),
('a0000001-0000-0000-0000-000000000010', 'sugar', 'sugar'),

-- Spices
('a0000001-0000-0000-0000-000000000011', 'kali mirch', 'kali mirch'),
('a0000001-0000-0000-0000-000000000011', 'black pepper', 'black pepper'),
('a0000001-0000-0000-0000-000000000012', 'haldi', 'haldi'),
('a0000001-0000-0000-0000-000000000012', 'turmeric powder', 'turmeric powder'),
('a0000001-0000-0000-0000-000000000013', 'lal mirch', 'lal mirch'),
('a0000001-0000-0000-0000-000000000013', 'deggi mirch', 'deggi mirch'),

-- Edible Oils
('b0000001-0000-0000-0000-000000000001', 'fortune oil', 'fortune oil'),
('b0000001-0000-0000-0000-000000000001', 'fortune tel', 'fortune tel'),
('b0000001-0000-0000-0000-000000000001', 'fortune sunflower oil', 'fortune sunflower oil'),
('b0000001-0000-0000-0000-000000000001', 'fortune oil 1 litre', 'fortune oil 1 litre'),
('b0000001-0000-0000-0000-000000000001', 'fortune 1l', 'fortune 1l'),

('b0000001-0000-0000-0000-000000000002', 'dhara oil', 'dhara oil'),
('b0000001-0000-0000-0000-000000000002', 'dhara tel', 'dhara tel'),
('b0000001-0000-0000-0000-000000000002', 'sarson ka tel', 'sarson ka tel'),
('b0000001-0000-0000-0000-000000000002', 'dhara mustard oil', 'dhara mustard oil'),

('b0000001-0000-0000-0000-000000000003', 'saffola oil', 'saffola oil'),
('b0000001-0000-0000-0000-000000000003', 'saffola gold', 'saffola gold'),
('b0000001-0000-0000-0000-000000000003', 'saffola tel', 'saffola tel'),

('b0000001-0000-0000-0000-000000000004', 'fortune mustard oil', 'fortune mustard oil'),
('b0000001-0000-0000-0000-000000000004', 'fortune sarson tel', 'fortune sarson tel'),

('b0000001-0000-0000-0000-000000000005', 'fortune oil 500ml', 'fortune oil 500ml'),
('b0000001-0000-0000-0000-000000000005', 'fortune tel adha litre', 'fortune tel adha litre'),

-- Dairy & Eggs
('c0000001-0000-0000-0000-000000000001', 'amul doodh', 'amul doodh'),
('c0000001-0000-0000-0000-000000000001', 'amul milk', 'amul milk'),
('c0000001-0000-0000-0000-000000000001', 'amul taaza', 'amul taaza'),
('c0000001-0000-0000-0000-000000000001', 'doodh', 'doodh'),
('c0000001-0000-0000-0000-000000000001', 'milk', 'milk'),

('c0000001-0000-0000-0000-000000000002', 'amul gold', 'amul gold'),
('c0000001-0000-0000-0000-000000000002', 'full cream doodh', 'full cream doodh'),

('c0000001-0000-0000-0000-000000000003', 'mother dairy doodh', 'mother dairy doodh'),
('c0000001-0000-0000-0000-000000000003', 'mother dairy milk', 'mother dairy milk'),

('c0000001-0000-0000-0000-000000000004', 'amul butter', 'amul butter'),
('c0000001-0000-0000-0000-000000000004', 'makhan', 'makhan'),
('c0000001-0000-0000-0000-000000000004', 'butter', 'butter'),

('c0000001-0000-0000-0000-000000000005', 'ande 6', 'ande 6'),
('c0000001-0000-0000-0000-000000000005', 'egg 6', 'egg 6'),
('c0000001-0000-0000-0000-000000000005', '6 ande', '6 ande'),
('c0000001-0000-0000-0000-000000000006', 'ande 12', 'ande 12'),
('c0000001-0000-0000-0000-000000000006', 'egg tray', 'egg tray'),
('c0000001-0000-0000-0000-000000000006', '12 ande', '12 ande'),
('c0000001-0000-0000-0000-000000000006', 'ande', 'ande'),
('c0000001-0000-0000-0000-000000000006', 'eggs', 'eggs'),

('c0000001-0000-0000-0000-000000000007', 'bread', 'bread'),
('c0000001-0000-0000-0000-000000000007', 'white bread', 'white bread'),
('c0000001-0000-0000-0000-000000000007', 'harvest gold bread', 'harvest gold bread'),
('c0000001-0000-0000-0000-000000000008', 'brown bread', 'brown bread'),
('c0000001-0000-0000-0000-000000000008', 'wheat bread', 'wheat bread'),

-- Snacks & Maggi
('d0000001-0000-0000-0000-000000000001', 'maggi', 'maggi'),
('d0000001-0000-0000-0000-000000000001', 'maggie', 'maggie'),
('d0000001-0000-0000-0000-000000000001', 'maggi noodles', 'maggi noodles'),
('d0000001-0000-0000-0000-000000000001', 'noodles', 'noodles'),

('d0000001-0000-0000-0000-000000000002', 'maggi 4 pack', 'maggi 4 pack'),
('d0000001-0000-0000-0000-000000000002', 'maggi packet 4', 'maggi packet 4'),

('d0000001-0000-0000-0000-000000000003', 'parle g', 'parle g'),
('d0000001-0000-0000-0000-000000000003', 'parle-g', 'parle-g'),
('d0000001-0000-0000-0000-000000000003', '10 wala parle g', '10 wala parle g'),
('d0000001-0000-0000-0000-000000000003', 'parle ji', 'parle ji'),

('d0000001-0000-0000-0000-000000000004', 'good day', 'good day'),
('d0000001-0000-0000-0000-000000000004', 'good day biscuit', 'good day biscuit'),

('d0000001-0000-0000-0000-000000000005', 'bhujia', 'bhujia'),
('d0000001-0000-0000-0000-000000000005', 'haldiram bhujia', 'haldiram bhujia'),
('d0000001-0000-0000-0000-000000000005', 'sev', 'sev'),

('d0000001-0000-0000-0000-000000000006', 'lays', 'lays'),
('d0000001-0000-0000-0000-000000000006', 'chips', 'chips'),
('d0000001-0000-0000-0000-000000000006', 'lays blue', 'lays blue'),

-- Household
('e0000001-0000-0000-0000-000000000001', 'surf excel', 'surf excel'),
('e0000001-0000-0000-0000-000000000001', 'surf', 'surf'),
('e0000001-0000-0000-0000-000000000001', 'washing powder', 'washing powder'),

('e0000001-0000-0000-0000-000000000002', 'vim bar', 'vim bar'),
('e0000001-0000-0000-0000-000000000002', 'bartan ka sabun', 'bartan ka sabun'),
('e0000001-0000-0000-0000-000000000002', 'vim sabun', 'vim sabun'),

('e0000001-0000-0000-0000-000000000003', 'vim liquid', 'vim liquid'),
('e0000001-0000-0000-0000-000000000003', 'vim gel', 'vim gel'),

('e0000001-0000-0000-0000-000000000004', 'harpic', 'harpic'),
('e0000001-0000-0000-0000-000000000004', 'toilet cleaner', 'toilet cleaner'),

-- Personal Care
('f0000001-0000-0000-0000-000000000001', 'colgate', 'colgate'),
('f0000001-0000-0000-0000-000000000001', 'paste', 'paste'),
('f0000001-0000-0000-0000-000000000001', 'toothpaste', 'toothpaste'),

('f0000001-0000-0000-0000-000000000002', 'dettol soap', 'dettol soap'),
('f0000001-0000-0000-0000-000000000002', 'dettol sabun', 'dettol sabun'),
('f0000001-0000-0000-0000-000000000002', 'dettol', 'dettol'),

('f0000001-0000-0000-0000-000000000003', 'lux soap', 'lux soap'),
('f0000001-0000-0000-0000-000000000003', 'lux sabun', 'lux sabun'),

('f0000001-0000-0000-0000-000000000004', 'clinic plus', 'clinic plus'),
('f0000001-0000-0000-0000-000000000004', 'shampoo', 'shampoo');

-- 3. Insert Demo Customers
INSERT INTO customers (id, phone, name, address, language, substitution_preference) VALUES
('c1000000-0000-0000-0000-000000000001', '+919876543210', 'Shivam Sharma', 'Flat 402, Green Valley Apts, Sector 62', 'hinglish', 'ASK'),
('c1000000-0000-0000-0000-000000000002', '+919123456789', 'Pooja Verma', 'House 12, Gali 4, Shanti Nagar', 'hinglish', 'ASK'),
('c1000000-0000-0000-0000-000000000003', '+919988776655', 'Rohan Mehta', 'B-104, Sunrise Residency', 'hinglish', 'AUTO_ACCEPT')
ON CONFLICT (phone) DO NOTHING;

-- 4. Insert Past Order for Shivam Sharma (for "Mera usual wala bhej do" demo scenario)
-- Shivam's usual basket: 2 Amul Milk 500ml + 1 Bread + 1 12-Egg Tray
INSERT INTO orders (id, customer_id, source, status, subtotal_paise, total_paise, raw_message, external_message_id, created_at) VALUES
('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'whatsapp', 'DELIVERED', 17900, 17900, '2 amul doodh, 1 bread aur 12 ande bhej do', 'msg_prev_usual_1001', now() - interval '2 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (order_id, product_id, quantity, unit_price_paise, line_total_paise) VALUES
('e1000000-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 2, 2700, 5400),
('e1000000-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000007', 1, 4000, 4000),
('e1000000-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000006', 1, 8500, 8500)
ON CONFLICT DO NOTHING;

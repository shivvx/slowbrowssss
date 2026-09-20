-- KiranaPilot Schema Migration
-- Designed for Supabase PostgreSQL with strict integrity, paise-based money, and atomic operations

-- 1. Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT NOT NULL,
    variant TEXT,
    pack_size TEXT,
    price_paise INTEGER NOT NULL CHECK (price_paise >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    reorder_level INTEGER NOT NULL DEFAULT 5 CHECK (reorder_level >= 0),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Product aliases for Hinglish & slang matching
CREATE TABLE IF NOT EXISTS product_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    alias TEXT NOT NULL,
    normalized_alias TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_aliases_normalized ON product_aliases(normalized_alias);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_active_stock ON products(active, stock_quantity);

-- 4. Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT UNIQUE NOT NULL,
    name TEXT,
    address TEXT,
    language TEXT DEFAULT 'hinglish',
    substitution_preference TEXT DEFAULT 'ASK', -- 'AUTO_ACCEPT', 'ASK', 'NO_SUBSTITUTE'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- 5. Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    source TEXT NOT NULL DEFAULT 'whatsapp', -- 'whatsapp', 'web_demo', 'voice'
    status TEXT NOT NULL DEFAULT 'CONFIRMED', -- 'PENDING', 'CONFIRMED', 'NEEDS_REVIEW', 'CANCELLED', 'DELIVERED'
    subtotal_paise INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_paise >= 0),
    total_paise INTEGER NOT NULL DEFAULT 0 CHECK (total_paise >= 0),
    raw_message TEXT NOT NULL,
    external_message_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_external_message_id ON orders(external_message_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- 6. Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_paise INTEGER NOT NULL CHECK (unit_price_paise >= 0),
    line_total_paise INTEGER NOT NULL CHECK (line_total_paise >= 0),
    substituted_for_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 7. Inventory movements table
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- 'ORDER_SALE', 'RESTOCK', 'MANUAL_ADJUSTMENT', 'ORDER_CANCEL'
    quantity_change INTEGER NOT NULL,
    stock_before INTEGER NOT NULL,
    stock_after INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_order_id ON inventory_movements(order_id);

-- 8. Agent runs table
CREATE TABLE IF NOT EXISTS agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    source TEXT NOT NULL DEFAULT 'whatsapp',
    raw_input TEXT NOT NULL,
    intent TEXT,
    confidence NUMERIC(3,2),
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS', 'SUCCESS', 'NEEDS_REVIEW', 'FAILED'
    latency_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_created_at ON agent_runs(created_at DESC);

-- 9. Agent events table
CREATE TABLE IF NOT EXISTS agent_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
    step TEXT NOT NULL,
    status TEXT NOT NULL, -- 'INFO', 'SUCCESS', 'WARNING', 'ERROR'
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_events_run_id ON agent_events(agent_run_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_created_at ON agent_events(created_at ASC);

-- 10. Pending conversations state table (for two-turn out-of-stock substitution or clarifications)
CREATE TABLE IF NOT EXISTS pending_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_phone TEXT UNIQUE NOT NULL,
    pending_state JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 minutes'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Atomic Order Creation RPC
CREATE OR REPLACE FUNCTION create_order_atomic(
    p_customer_id UUID,
    p_source TEXT,
    p_raw_message TEXT,
    p_external_message_id TEXT,
    p_items JSONB -- JSON array: [{"product_id": "uuid", "quantity": 2, "substituted_for_product_id": "uuid"|null}]
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id UUID;
    v_item RECORD;
    v_product RECORD;
    v_subtotal_paise INTEGER := 0;
    v_total_paise INTEGER := 0;
    v_line_total INTEGER;
    v_new_stock INTEGER;
    v_low_stock_alerts JSONB := '[]'::jsonb;
    v_order_items_out JSONB := '[]'::jsonb;
    v_existing_order RECORD;
BEGIN
    -- 1. Idempotency check: if external_message_id already exists, return existing order
    IF p_external_message_id IS NOT NULL AND p_external_message_id <> '' THEN
        SELECT id, subtotal_paise, total_paise, status, created_at
        INTO v_existing_order
        FROM orders
        WHERE external_message_id = p_external_message_id;

        IF FOUND THEN
            RETURN jsonb_build_object(
                'success', true,
                'idempotent', true,
                'order_id', v_existing_order.id,
                'subtotal_paise', v_existing_order.subtotal_paise,
                'total_paise', v_existing_order.total_paise,
                'status', v_existing_order.status,
                'created_at', v_existing_order.created_at
            );
        END IF;
    END IF;

    -- 2. Validate input items array
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'EMPTY_ITEMS',
            'message', 'No items provided in order request'
        );
    END IF;

    -- 3. Lock product rows FOR UPDATE and verify stock
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        product_id UUID,
        quantity INTEGER,
        substituted_for_product_id UUID
    )
    LOOP
        SELECT id, name, price_paise, stock_quantity, reorder_level, active
        INTO v_product
        FROM products
        WHERE id = v_item.product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'PRODUCT_NOT_FOUND',
                'product_id', v_item.product_id
            );
        END IF;

        IF NOT v_product.active THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'PRODUCT_INACTIVE',
                'product_id', v_product.id,
                'name', v_product.name
            );
        END IF;

        IF v_product.stock_quantity < v_item.quantity THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'INSUFFICIENT_STOCK',
                'product_id', v_product.id,
                'name', v_product.name,
                'requested', v_item.quantity,
                'available', v_product.stock_quantity
            );
        END IF;

        v_line_total := v_product.price_paise * v_item.quantity;
        v_subtotal_paise := v_subtotal_paise + v_line_total;
    END LOOP;

    v_total_paise := v_subtotal_paise; -- Can add delivery fees here if applicable

    -- 4. Create Order
    INSERT INTO orders (
        customer_id,
        source,
        status,
        subtotal_paise,
        total_paise,
        raw_message,
        external_message_id
    ) VALUES (
        p_customer_id,
        p_source,
        'CONFIRMED',
        v_subtotal_paise,
        v_total_paise,
        p_raw_message,
        p_external_message_id
    ) RETURNING id INTO v_order_id;

    -- 5. Create Order Items, Deduct Inventory, Record Movements, Detect Low Stock
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        product_id UUID,
        quantity INTEGER,
        substituted_for_product_id UUID
    )
    LOOP
        SELECT id, name, price_paise, stock_quantity, reorder_level
        INTO v_product
        FROM products
        WHERE id = v_item.product_id;

        v_line_total := v_product.price_paise * v_item.quantity;
        v_new_stock := v_product.stock_quantity - v_item.quantity;

        -- Insert order item
        INSERT INTO order_items (
            order_id,
            product_id,
            quantity,
            unit_price_paise,
            line_total_paise,
            substituted_for_product_id
        ) VALUES (
            v_order_id,
            v_item.product_id,
            v_item.quantity,
            v_product.price_paise,
            v_line_total,
            v_item.substituted_for_product_id
        );

        -- Update product inventory
        UPDATE products
        SET stock_quantity = v_new_stock,
            updated_at = now()
        WHERE id = v_item.product_id;

        -- Record inventory movement
        INSERT INTO inventory_movements (
            product_id,
            order_id,
            type,
            quantity_change,
            stock_before,
            stock_after
        ) VALUES (
            v_item.product_id,
            v_order_id,
            'ORDER_SALE',
            -v_item.quantity,
            v_product.stock_quantity,
            v_new_stock
        );

        -- Record order item for output
        v_order_items_out := v_order_items_out || jsonb_build_object(
            'product_id', v_product.id,
            'name', v_product.name,
            'quantity', v_item.quantity,
            'unit_price_paise', v_product.price_paise,
            'line_total_paise', v_line_total,
            'stock_after', v_new_stock
        );

        -- Low stock alert
        IF v_new_stock <= v_product.reorder_level THEN
            v_low_stock_alerts := v_low_stock_alerts || jsonb_build_object(
                'product_id', v_product.id,
                'name', v_product.name,
                'current_stock', v_new_stock,
                'reorder_level', v_product.reorder_level
            );
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'idempotent', false,
        'order_id', v_order_id,
        'subtotal_paise', v_subtotal_paise,
        'total_paise', v_total_paise,
        'items', v_order_items_out,
        'low_stock_alerts', v_low_stock_alerts
    );
END;
$$;

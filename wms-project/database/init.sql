Create table orders (
                        order_id SERIAL PRIMARY KEY,
                        order_number Varchar(50) UNIQUE NOT NULL,
                        status VARCHAR(30) DEFAULT 'Nowe',
                        order_date TIMESTAMP DEFAULT NOW(),
                        order_realisation TIMESTAMP,
                        notes TEXT
);
CREATE TABLE products (
                        products_id SERIAL PRIMARY KEY,
                        barcode VARCHAR(50) UNIQUE,
                        name VARCHAR(150) NOT NULL,
                        price NUMERIC(10, 2),
                        date_added TIMESTAMP DEFAULT NOW()
);
CREATE TABLE order_items (
                             id SERIAL PRIMARY KEY,
                             order_id INT REFERENCES orders(order_id) ON DELETE CASCADE,
                             products_id INT REFERENCES products(products_id),
                             order_quantity INT NOT NULL CHECK (order_quantity > 0),
                             picked_quantity INT DEFAULT 0
);
CREATE TABLE warehouse_locations (
                                     location_id SERIAL PRIMARY KEY,
                                     location_code VARCHAR(20) UNIQUE NOT NULL
);
CREATE TABLE storage_stock (
                               id SERIAL PRIMARY KEY,
                               products_id INT REFERENCES products(products_id),
                               location_id INT REFERENCES warehouse_locations(location_id),
                               quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
                               CONSTRAINT unique_product_location UNIQUE (products_id, location_id)
);
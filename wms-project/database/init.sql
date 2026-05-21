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
                        sku VARCHAR(50) UNIQUE,
                        barcode VARCHAR(50) UNIQUE,
                        name VARCHAR(150) NOT NULL,
                        category VARCHAR(80) DEFAULT 'General',
                        price NUMERIC(10, 2),
                        reorder_threshold INT DEFAULT 20 CHECK (reorder_threshold >= 0),
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
CREATE TABLE users (
                       user_id SERIAL PRIMARY KEY,
                       employee_id VARCHAR(30) UNIQUE NOT NULL,
                       first_name VARCHAR(80) NOT NULL,
                       last_name VARCHAR(80) NOT NULL,
                       email VARCHAR(150) UNIQUE NOT NULL,
                       role VARCHAR(60) NOT NULL,
                       zone_assignment VARCHAR(150) DEFAULT 'Unassigned',
                       status VARCHAR(30) DEFAULT 'Active',
                       avatar_url TEXT,
                       password_hash TEXT NOT NULL,
                       created_at TIMESTAMP DEFAULT NOW(),
                       updated_at TIMESTAMP DEFAULT NOW(),
                       CONSTRAINT users_status_check CHECK (status IN ('Active', 'Suspended'))
);

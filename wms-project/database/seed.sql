INSERT INTO products (barcode, name, price) VALUES
    ('5901234567890', 'Kawa Ziarnista Arabica 1kg', 59.99),
    ('5909876543210', 'Mleko UHT 3.2% 1L', 3.49),
    ('5905556667771', 'Czekolada Gorzka 70% 100g', 4.50),
    ('5904443332220', 'Płatki Owsiane Górskie 500g', 2.99),
    ('5901112223334', 'Sok Pomarańczowy 1L', 5.20);

INSERT INTO orders (order_number, status, notes) VALUES
    ('ORD/2026/05/001', 'Nowe', '');

INSERT INTO order_items (order_id, products_id, order_quantity, picked_quantity) VALUES
     (
         (SELECT order_id FROM orders WHERE order_number = 'ORD/2026/05/001'), -- baza sama znajdzie ID zamówienia
         (SELECT products_id FROM products WHERE barcode = '5901234567890'),   -- baza sama znajdzie ID skanera
         2,
         0
     ),
     (
         (SELECT order_id FROM orders WHERE order_number = 'ORD/2026/05/001'),
         (SELECT products_id FROM products WHERE barcode = '5901112223334'),   -- baza sama znajdzie ID taśmy
         5,
         0
     );

INSERT INTO warehouse_locations (location_code) VALUES
    ('A-01-01'),
    ('A-01-02'),
    ('A-02-01'),
    ('B-01-01'),
    ('B-01-02'),
    ('RAMPA-PRZYJEC');

INSERT INTO storage_stock (products_id, location_id, quantity) VALUES
(1, 1, 15), -- 15 sztuk na A-01-01
(1, 2, 10), -- 10 sztuk na A-01-02

(2, 4, 48), -- 48 sztuk na B-01-01

(3, 3, 100), -- 100 sztuk na A-02-01

(4, 6, 50);

SELECT
    p.name AS produkt,
    p.barcode AS kod_kreskowy,
    wl.location_code AS polka,
    s.quantity AS ilosc_na_polce
FROM storage_stock s
         JOIN products p ON s.products_id = p.products_id
         JOIN warehouse_locations wl ON s.location_id = wl.location_id;
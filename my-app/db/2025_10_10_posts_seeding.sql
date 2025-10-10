-- ---------------------------------------------------------
--  Seed Listings for 4 Universities
-- ---------------------------------------------------------

-- Optional: clear existing listings for a fresh start
DELETE FROM listings;

-- ---------------------------------------------------------
-- University ID = 1 → University at Buffalo
-- ---------------------------------------------------------
INSERT INTO listings (
    user_id, university_id, title, description, pictures, comments,
    price, category, location, contact, views, created_at
) VALUES
(1, 1, 'Used Gaming Laptop',
 'MSI laptop with RTX 2060, perfect for gaming and coding.',
 JSON_ARRAY('uploads/msi1.jpg', 'uploads/msi2.jpg'), JSON_ARRAY(),
 850.00, 'electronics', 'Ellicott Complex', 'buffalotech@buffalo.edu', 12, NOW() - INTERVAL 2 DAY),

(2, 1, 'Dorm Microwave',
 'Compact microwave in great shape, works perfectly.',
 JSON_ARRAY('uploads/microwave.jpg'), JSON_ARRAY(),
 35.00, 'electronics', 'Flint Village', 'student2@buffalo.edu', 5, NOW() - INTERVAL 3 DAY),

(3, 1, 'Wooden Desk and Chair',
 'Solid wood desk and ergonomic chair. Ideal for study spaces.',
 JSON_ARRAY('uploads/deskset.jpg'), JSON_ARRAY(),
 95.00, 'furniture', 'South Lake Village', '716-444-1234', 20, NOW() - INTERVAL 1 DAY);

-- ---------------------------------------------------------
-- University ID = 2 → Cornell University
-- ---------------------------------------------------------
INSERT INTO listings (
    user_id, university_id, title, description, pictures, comments,
    price, category, location, contact, views, created_at
) VALUES
(4, 2, 'Bike for Sale - Trek FX 2',
 'Smooth ride, just tuned up, includes helmet.',
 JSON_ARRAY('uploads/bike_cornell1.jpg', 'uploads/bike_cornell2.jpg'), JSON_ARRAY(),
 280.00, 'transportation', 'Collegetown', 'cornellbike@cornell.edu', 9, NOW() - INTERVAL 4 DAY),

(5, 2, 'Python Tutoring Sessions',
 'Offering affordable Python tutoring for undergrads.',
 JSON_ARRAY('uploads/python_cornell.jpg'), JSON_ARRAY(),
 15.00, 'services', 'Engineering Quad', 'pymentor@cornell.edu', 4, NOW() - INTERVAL 1 DAY),

(6, 2, 'Textbooks: Machine Learning & Algorithms',
 'Two books used for CS4780. Both in good condition.',
 JSON_ARRAY('uploads/mlbook.jpg', 'uploads/algo.jpg'), JSON_ARRAY(),
 70.00, 'books', 'Olin Library', 'booktrade@cornell.edu', 6, NOW());

-- ---------------------------------------------------------
-- University ID = 3 → Stony Brook University
-- ---------------------------------------------------------
INSERT INTO listings (
    user_id, university_id, title, description, pictures, comments,
    price, category, location, contact, views, created_at
) VALUES
(7, 3, 'Electric Guitar + Amp',
 'Epiphone guitar bundle. Lightly used, perfect for beginners.',
 JSON_ARRAY('uploads/guitar_stony.jpg'), JSON_ARRAY(),
 220.00, 'electronics', 'West Apartments', 'stonyrock@stonybrook.edu', 15, NOW() - INTERVAL 2 DAY),

(8, 3, 'Used Mini Fridge',
 'Still works well, fits dorms perfectly.',
 JSON_ARRAY('uploads/fridge_stony.jpg'), JSON_ARRAY(),
 45.00, 'appliances', 'Tabler Quad', 'student8@stonybrook.edu', 8, NOW() - INTERVAL 3 DAY),

(9, 3, 'CSE 214 Textbook',
 'Data Structures book by Lafore, minor highlights inside.',
 JSON_ARRAY('uploads/book_cse214.jpg'), JSON_ARRAY(),
 25.00, 'books', 'Melville Library', 'bookbuyer@stonybrook.edu', 3, NOW() - INTERVAL 5 DAY);

-- ---------------------------------------------------------
-- University ID = 4 → New York University
-- ---------------------------------------------------------
INSERT INTO listings (
    user_id, university_id, title, description, pictures, comments,
    price, category, location, contact, views, created_at
) VALUES
(10, 4, 'NYU Hoodie - Like New',
 'Official NYU hoodie, size M, barely worn.',
 JSON_ARRAY('uploads/nyu_hoodie.jpg'), JSON_ARRAY(),
 30.00, 'clothing', 'Washington Square', 'nyumerch@nyu.edu', 18, NOW() - INTERVAL 1 DAY),

(11, 4, 'Freelance Web Design Service',
 'Offering portfolio websites for students at discount rates.',
 JSON_ARRAY('uploads/webdesign.jpg'), JSON_ARRAY(),
 100.00, 'services', 'Brooklyn campus', 'designlab@nyu.edu', 7, NOW() - INTERVAL 2 DAY),

(12, 4, 'Apartment Sublet (Summer)',
 'Studio apartment available near NYU Stern for June–August.',
 JSON_ARRAY('uploads/nyu_apartment.jpg'), JSON_ARRAY(),
 1650.00, 'housing', 'Greenwich Village', 'rentnyu@nyu.edu', 22, NOW());

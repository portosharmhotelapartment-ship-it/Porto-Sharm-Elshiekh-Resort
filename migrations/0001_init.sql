CREATE TABLE IF NOT EXISTS bookings (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 guest_name TEXT NOT NULL,
 phone TEXT NOT NULL,
 stay_type TEXT NOT NULL,
 plan TEXT NOT NULL,
 check_in TEXT NOT NULL,
 check_out TEXT NOT NULL,
 adults INTEGER NOT NULL DEFAULT 1,
 children INTEGER NOT NULL DEFAULT 0,
 notes TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','rejected')),
 total_amount REAL,
 paid_amount REAL NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS site_settings (
 setting_key TEXT PRIMARY KEY,
 setting_value TEXT NOT NULL,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

# Porto Sharm Resort
Bilingual Arabic/English resort website.

## Deploy on Cloudflare Pages
- Connect this repository to Cloudflare Pages; production branch: main.
- Framework preset: None. Build command: leave empty. Build output directory: / (root).
- Create D1 database and execute schema.sql.
- Add D1 binding named DB to the Pages project.
- Deploy and test a booking request.

The booking endpoint returns 503 until the D1 binding is configured. No passwords or API tokens belong in this repository.

Contact: +201061307181 · Portosharmhotelapartment@gmail.com
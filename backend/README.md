# Master Shop API

Laravel API for the Master Shop clothing storefront. It provides customer registration/sign-in, a public product catalogue, administrator-only product, customer-account, and administrator-account management, customer orders, cash on delivery, and PayMongo Checkout Sessions. Deleting a customer account preserves its order history. Only an existing administrator can create another administrator account.

## Local setup

1. Start **MySQL** in the XAMPP Control Panel and wait until it reports that it is running. Laravel needs a reachable MySQL server at the host and port configured below.
2. Create a MySQL database named `master_shop` in phpMyAdmin.
3. Create `.env` from `.env.example` if needed. In `.env`, set `DB_CONNECTION=mysql`, `DB_HOST=127.0.0.1`, `DB_PORT=3306`, `DB_DATABASE=master_shop`, and the MySQL username and password for your XAMPP setup; then generate an app key:

   ```powershell
   if (!(Test-Path .env)) { Copy-Item .env.example .env }
   php artisan key:generate
   ```

4. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` to provision an administrator. Add PayMongo **test-mode** credentials to `PAYMONGO_SECRET_KEY` and `PAYMONGO_WEBHOOK_SECRET` to enable online checkout and signed payment webhooks.
5. Run migrations and load the sample catalogue:

   ```powershell
   php artisan migrate --seed
   php artisan serve
   ```

6. Start the frontend in `frontend` with `npm run dev`; the shop opens at `http://localhost:3000` and the API defaults to `http://127.0.0.1:8000/api`.

If an API request returns `SQLSTATE[HY000] [2002]` or “connection refused” for `127.0.0.1:3306`, start MySQL in XAMPP and confirm the `DB_HOST`, `DB_PORT`, and `DB_DATABASE` values in `backend/.env` match the running server and database. Then rerun `php artisan migrate --seed`. Do not continue to Cypress until `http://127.0.0.1:8000/api/products` returns a JSON product list.

PayMongo checkout is unavailable until a secret key is configured; cash on delivery remains available. Configure a PayMongo webhook to `POST /api/payments/paymongo/webhook` after setting the webhook signing secret. Customer accounts are always created with the customer role; administrator access is provisioned only through the environment-configured seed account.

## Tests

Run API feature tests with `php artisan test --filter=StorefrontApiTest`. The suite uses an in-memory SQLite database and fakes PayMongo HTTP requests.

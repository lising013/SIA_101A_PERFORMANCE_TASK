# Master Shop storefront

The Next.js storefront requires a signed-in customer before showing the shop. It includes account creation and sign-in, searchable/category-filtered products, a shopping bag, cash-on-delivery checkout, PayMongo checkout, order history, and an administrator dashboard for product and order CRUD.

## Run locally

Start the Laravel API and configure its MySQL connection by following [`backend/README.md`](../backend/README.md). Then start the storefront:

```powershell
npm run dev
```

Open `http://localhost:3000`. The API URL defaults to `http://127.0.0.1:8000/api`; set `NEXT_PUBLIC_API_URL` when the backend is hosted elsewhere. The frontend only sends the public checkout request to the backend; the PayMongo secret key stays server-side.

## Running the E2E tests

1. In `backend`, configure the database and PayMongo test-mode credentials in `.env`, then prepare the schema and fixed sample catalogue:

   ```powershell
   php artisan migrate --seed
   php artisan serve
   ```

   The catalogue seeder restores the fixed product details, prices, and inventory on every run. Re-run `php artisan db:seed` to reset the seeded catalogue before another test run if inventory has changed. Configure the PayMongo test secret only in the backend `.env`; never put it in frontend environment variables or Cypress configuration.

2. In a second terminal, start the storefront from `frontend`:

   ```powershell
   npm run dev
   ```

3. Install the frontend dependencies once, then run the browser suite headlessly from the repository root:

   ```powershell
   Set-Location frontend
   npm install
   Set-Location ..
   npm run test:e2e
   ```

   The checkout-session and hand-over tests use PayMongo's test API and require network access plus a valid backend test-mode key. The suite uses unique customer accounts and creates its own orders; the success and cancel return tests confirm that only a verified webhook changes payment status.

### E2E test plan

| ID | Spec | Test name | Author / Rey anthony E. Lising, Marjohn Cleope, Denielle Jon bajao |
|---|---|---|---|
| E2E-01 | `cypress/e2e/catalog.cy.js` | shows seeded products with peso prices | Product |
| E2E-02 | `cypress/e2e/orders.cy.js` | creates a pending-payment order with the correct total | Order |
| E2E-03 | `cypress/e2e/checkout.cy.js` | gets a checkout URL from PayMongo | Payment |
| E2E-04 | `cypress/e2e/checkout.cy.js` | hands the customer over to PayMongo | Payment |
| E2E-05 | `cypress/e2e/orders.cy.js` | shows the success return without bypassing payment confirmation | Order |
| E2E-06 | `cypress/e2e/orders.cy.js` | keeps a cancelled order unpaid | Order |
| E2E-07 | `cypress/e2e/checkout.cy.js` | shows an error when checkout fails | Payment |
| E2E-08 | `cypress/e2e/security.cy.js` | keeps the PayMongo secret out of browser requests and assets | Product |
| E2E-09 | `cypress/e2e/catalog.cy.js` | blocks checkout with an empty bag | Product |

Replace the service-owner labels with your assigned group members' names before submission.

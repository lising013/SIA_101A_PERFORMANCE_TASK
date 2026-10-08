# Master Shop storefront

The Next.js storefront requires a signed-in customer before showing the shop. It includes account creation and sign-in, searchable/category-filtered products, a shopping bag, cash-on-delivery checkout, PayMongo checkout, order history, and an administrator dashboard for product and order CRUD.

## Run locally

Start the Laravel API and configure its MySQL connection by following [`backend/README.md`](../backend/README.md). Then start the storefront:

```powershell
npm run dev
```

Open `http://localhost:3000`. The API URL defaults to `http://127.0.0.1:8000/api`; set `NEXT_PUBLIC_API_URL` when the backend is hosted elsewhere. The frontend only sends the public checkout request to the backend; the PayMongo secret key stays server-side.

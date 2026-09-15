// ============================================================
// ORDER SERVICE  (port 4002)
// Responsibility: turn a cart of product IDs into an order,
// and track its lifecycle: pending -> paid | cancelled.
// It talks to the Product Service to price things.
// It has NEVER heard of PayMongo — that's the Payment Service's job.
// ============================================================
import express from "express"; // to import express

const app = express();
app.use(express.json());

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://localhost:4001";

// In-memory order store
const orders = new Map();
let nextOrderNumber = 1001;

app.post("/orders", async (req, res) => {
  const { productIds } = req.body;
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ error: "productIds must be a non-empty array" });
  }

  try {
    const lineItems = [];
    for (const id of productIds) {
      const r = await fetch(`${PRODUCT_SERVICE_URL}/products/${id}`);
      if (!r.ok) return res.status(400).json({ error: `Unknown product: ${id}` });
      const { data: product } = await r.json();
      lineItems.push({
        productId: product.id,
        name: product.name,
        description: product.description,
        amount: product.priceCentavos,
        quantity: 1,
        currency: "PHP",
      });
    }

    const orderId = `ORD-${nextOrderNumber++}`;
    const order = {
      id: orderId,
      status: "pending", // pending | paid | cancelled
      lineItems,
      totalCentavos: lineItems.reduce((sum, li) => sum + li.amount * li.quantity, 0),
      createdAt: new Date().toISOString(),
    };
    orders.set(orderId, order);

    res.status(201).json({ data: order });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Could not reach Product Service" });
  }
});

app.get("/orders/:id", (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json({ data: order });
});

// Called by the Payment Service after a redirect/webhook confirms payment.
// This is the ONLY way an order's status changes — Order Service owns its own state.
app.patch("/orders/:id/status", (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  const { status } = req.body;
  if (!["pending", "paid", "cancelled"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  order.status = status;
  res.json({ data: order });
});

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => console.log(`[order-service] listening on ${PORT}`));

const apiUrl = () => Cypress.expose("apiUrl");

Cypress.Commands.add("registerCustomer", () => {
  cy.request({
    url: `${apiUrl()}/products`,
    failOnStatusCode: false,
  }).then(({ status, body }) => {
    assert.equal(
      status,
      200,
      "Backend /products must return 200. Start XAMPP MySQL, verify backend/.env DB_HOST/DB_PORT/DB_DATABASE, then run php artisan migrate --seed.",
    );
    assert.isArray(body, "backend product catalogue response");
    assert.isNotEmpty(body, "seed at least one product before running E2E tests");
  });
  cy.intercept("GET", "**/api/products").as("products");

  const stamp = `${Date.now()}-${Cypress._.random(100000, 999999)}`;
  const credentials = {
    name: `E2E Customer ${stamp}`,
    email: `e2e-${stamp}@example.test`,
    password: "e2e-customer-password",
  };

  return cy.request("POST", `${apiUrl()}/register`, credentials).then(({ body }) => {
    const customer = { token: body.token, user: body.user };
    cy.visit("/", {
      onBeforeLoad(window) {
        window.localStorage.setItem("master-shop-token", customer.token);
        window.localStorage.setItem("master-shop-user", JSON.stringify(customer.user));
      },
    });
    cy.wait("@products").then(({ response }) => {
      assert.equal(response.statusCode, 200);
      assert.isArray(response.body);
      assert.isNotEmpty(response.body);
    });
    cy.get('[data-cy="product-card"]').should("have.length.greaterThan", 0);
    return cy.wrap(customer);
  });
});

Cypress.Commands.add("apiOrders", (token) =>
  cy.request({
    url: `${apiUrl()}/orders`,
    headers: { Authorization: `Bearer ${token}` },
  }).its("body"),
);

Cypress.Commands.add("apiProduct", (name) =>
  cy.request(`${apiUrl()}/products`).its("body").then((products) => {
    const product = products.find((item) => item.name === name);
    assert.isDefined(product, `seeded product "${name}"`);
    return product;
  }),
);

Cypress.Commands.add("createCashOrder", (token, productId, quantity = 1) =>
  cy.request({
    method: "POST",
    url: `${apiUrl()}/orders`,
    headers: { Authorization: `Bearer ${token}` },
    body: {
      items: [{ product_id: productId, quantity }],
      payment_method: "cash",
      contact_name: "E2E Return Test",
      phone_number: "+639123456789",
      shipping_address: "1 E2E Test Street, Tagbilaran City",
    },
  }),
);

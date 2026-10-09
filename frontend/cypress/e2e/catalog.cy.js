describe("Catalog", () => {
  beforeEach(() => {
    cy.registerCustomer();
  });

  it("E2E-01: shows seeded products with peso prices", () => {
    cy.get('[data-cy="product-card"]').should("have.length.greaterThan", 2);

    [
      ["The Weekend Tee", "₱890.00"],
      ["Everyday Linen Shirt", "₱1,490.00"],
      ["Sunday Knit Sweater", "₱2,190.00"],
    ].forEach(([name, price]) => {
      cy.contains('[data-cy="product-name"]', name)
        .closest('[data-cy="product-card"]')
        .find('[data-cy="product-price"]')
        .should("have.text", price);
    });
  });

  it("E2E-09: blocks checkout with an empty bag", () => {
    cy.intercept("POST", "**/api/orders").as("createOrder");
    cy.get('[data-cy="bag-button"]').click();
    cy.get('[data-cy="empty-cart"]').should("be.visible");
    cy.get('[data-cy="checkout-button"]').should("not.exist");
    cy.get("@createOrder.all").should("have.length", 0);
  });
});

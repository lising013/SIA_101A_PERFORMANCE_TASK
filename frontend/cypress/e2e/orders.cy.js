const productName = "The Weekend Tee";

describe("Orders", () => {
  beforeEach(() => {
    cy.registerCustomer().as("customer");
  });

  it("E2E-02: creates a pending-payment order with the correct total", () => {
    cy.get('[data-cy="product-card"]')
      .contains('[data-cy="product-name"]', productName)
      .closest('[data-cy="product-card"]')
      .find('[data-cy="add-to-cart"]')
      .click();
    cy.get('[data-cy="bag-button"]').click();
    cy.get('[data-cy="checkout-phone"]').type("+639123456789");
    cy.get('[data-cy="checkout-address"]').type("1 E2E Test Street, Tagbilaran City");
    cy.get('[data-cy="pay-cash"]').click();
    cy.intercept("POST", "**/api/orders").as("createOrder");
    cy.get('[data-cy="checkout-button"]').click();

    cy.wait("@createOrder").its("response.statusCode").should("eq", 201);
    cy.get("@customer").then(({ token, user }) => {
      cy.apiOrders(token).then((orders) => {
        const order = orders.find((item) => item.contact_name === user.name && item.payment_method === "cash");
        assert.isDefined(order, "created order");
        expect(order.status).to.eq("processing");
        expect(order.payment_status).to.eq("pending");
        expect(Number(order.total)).to.eq(890);
      });
    });
  });

  it("E2E-05: shows the success return without bypassing payment confirmation", () => {
    cy.get("@customer").then(({ token }) => {
      cy.apiProduct(productName).then((product) => {
        cy.createCashOrder(token, product.id).then(({ body }) => {
          const order = body.order;
          cy.visit(`/?payment=success&order=${encodeURIComponent(order.order_number)}`);
          cy.get('[data-cy="notice"]')
            .should("be.visible")
            .and("contain.text", "Your payment status will update when confirmed");

          cy.get('[data-cy="orders-button"]').click();
          cy.get('[data-cy="order-payment-status"]').should("contain.text", "pending");
          cy.apiOrders(token).then((orders) => {
            const returnedOrder = orders.find((item) => item.id === order.id);
            expect(returnedOrder.payment_status).to.eq("pending");
          });
        });
      });
    });
  });

  it("E2E-06: keeps a cancelled order unpaid", () => {
    cy.get("@customer").then(({ token }) => {
      cy.apiProduct(productName).then((product) => {
        cy.createCashOrder(token, product.id).then(({ body }) => {
          const order = body.order;
          cy.visit(`/?payment=cancelled&order=${encodeURIComponent(order.order_number)}`);
          cy.get('[data-cy="notice"]')
            .should("be.visible")
            .and("contain.text", `Checkout cancelled for order ${order.order_number}`);

          cy.get('[data-cy="orders-button"]').click();
          cy.get('[data-cy="order-payment-status"]').should("contain.text", "pending");
          cy.apiOrders(token).then((orders) => {
            const cancelledOrder = orders.find((item) => item.id === order.id);
            expect(cancelledOrder.payment_status).not.to.eq("paid");
          });
        });
      });
    });
  });
});

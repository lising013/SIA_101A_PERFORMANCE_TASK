const productName = "The Weekend Tee";

function addProductAndOpenCheckout() {
  cy.get('[data-cy="product-card"]')
    .contains('[data-cy="product-name"]', productName)
    .closest('[data-cy="product-card"]')
    .find('[data-cy="add-to-cart"]')
    .click();
  cy.get('[data-cy="bag-button"]').click();
  cy.get('[data-cy="checkout-phone"]').type("+639123456789");
  cy.get('[data-cy="checkout-address"]').type("1 E2E Test Street, Tagbilaran City");
}

describe("PayMongo checkout boundary", () => {
  beforeEach(() => {
    cy.registerCustomer().as("customer");
  });

  it("E2E-03: gets a checkout URL from PayMongo", () => {
    cy.intercept("POST", "**/api/orders").as("checkout");
    addProductAndOpenCheckout();
    cy.get('[data-cy="checkout-button"]').click();

    cy.wait("@checkout").then(({ response }) => {
      expect(response.statusCode).to.eq(201);
      expect(response.body.checkout_url).to.match(/^https:\/\/checkout\.paymongo\.com\//);
    });
  });

  it("E2E-04: hands the customer over to PayMongo", () => {
    cy.intercept("POST", "**/api/orders", {
      statusCode: 201,
      body: {
        order: { id: "e2e-handover" },
        checkout_url: "https://checkout.paymongo.com/cs_test_e2e-handover",
      },
    }).as("checkout");
    addProductAndOpenCheckout();
    cy.get('[data-cy="checkout-button"]').click();

    cy.wait("@checkout").then(({ response }) => {
      expect(response.statusCode).to.eq(201);
      expect(response.body.checkout_url).to.match(/^https:\/\/checkout\.paymongo\.com\//);
    });
    cy.origin("https://checkout.paymongo.com", () => {
      cy.location("hostname").should("eq", "checkout.paymongo.com");
    });
  });

  it("E2E-07: shows an error when checkout fails", () => {
    cy.get("@customer").then(({ token }) => {
      cy.apiOrders(token).its("length").as("existingOrderCount");
    });
    cy.intercept("POST", "**/api/orders", {
      statusCode: 500,
      body: { message: "Payment unavailable. Please try again." },
    }).as("checkout");
    addProductAndOpenCheckout();
    cy.get('[data-cy="checkout-button"]').click();

    cy.wait("@checkout").its("response.statusCode").should("eq", 500);
    cy.get('[data-cy="notice"]')
      .should("be.visible")
      .and("contain.text", "Payment unavailable");
    cy.location("pathname").should("eq", "/");

    cy.get("@customer").then(({ token }) => {
      cy.get("@existingOrderCount").then((count) => {
        cy.apiOrders(token).should("have.length", count);
      });
    });
  });
});

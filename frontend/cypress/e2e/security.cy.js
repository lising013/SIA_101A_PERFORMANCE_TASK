describe("Browser security boundary", () => {
  it("E2E-08: keeps the PayMongo secret out of browser requests and assets", () => {
    cy.intercept("https://api.paymongo.com/**").as("browserPayMongo");

    cy.request("/").then(({ body }) => {
      expect(body).not.to.match(/sk_(?:test|live)_/);
      const scriptPaths = [...body.matchAll(/<script[^>]+src=["']([^"']+)["']/g)]
        .map((match) => match[1]);

      cy.wrap(scriptPaths).each((scriptPath) => {
        const scriptUrl = new URL(scriptPath, Cypress.config("baseUrl")).toString();
        cy.request(scriptUrl).its("body").should("not.match", /sk_(?:test|live)_/);
      });
    });

    cy.visit("/");
    cy.get("@browserPayMongo.all").should("have.length", 0);
  });
});

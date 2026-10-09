module.exports = {
  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "cypress/e2e/**/*.cy.js",
    supportFile: "cypress/support/e2e.js",
    video: true,
    retries: 0,
    expose: {
      apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api",
    },
  },
};

import request from "supertest";
import { app, server } from "../app"; // Import your Express application and server
import { disconnectDB } from "../connection/connection";
import { Contact } from "../models/contact.model";

// Test suite for the Contacts endpoint
describe("Contacts", () => {
  let token: string;
  let mockContactId: number;

  // Before all tests, perform setup tasks
  beforeAll(async () => {
    // Clear the contacts table before each test
    await Contact.destroy({ where: {} });

    // Log in and obtain the JWT token
    const loginResponse = await request(app)
      .post("/auth/login")
      .send({ email: "Admin", password: "admin" });

    // Extract the JWT token from the login response
    token = loginResponse.body.token;
  });

  // Test case for GET /contacts endpoint

  it("should return an empty array of contacts", async () => {
    // Send a GET request to the '/contacts' endpoint
    const response = await request(app)
      .get("/contacts")
      .set("Authorization", `Bearer ${token}`);

    // Expect the response status code to be 200 (OK)
    expect(response.status).toBe(200);

    // Expect the response body to be defined
    expect(response.body).toBeDefined();

    // Expect the "data" property to be an empty array
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toHaveLength(0);

    // Expect the "count" property to be equal to 0
    expect(response.body.count).toBe(0);
  });

  it("should update a contact", async () => {
    // Create a mock contact
    const mockContact = await Contact.create({
      name: "Mock Contact",
      email: "mock@example.com",
      company: "Example TEST",
      linkedin: "https://linkedin.com/in/example",
      // Add other properties as needed
    });

    // Set the ID of the mock contact for later use
    mockContactId = mockContact.id;

    // Send a PUT request to update the contact
    const updatedResponse = await request(app)
      .put(`/contacts/${mockContactId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Updated Contact Name",
        email: "mock@example.com",
        company: "Example TEST",
        linkedin: "https://linkedin.com/in/example",
        // Update other properties as needed
      });

    // Expect the response status code to be 200 (OK)
    expect(updatedResponse.status).toBe(200);

    // Expect the response body to contain the updated contact data
    expect(updatedResponse.body.data).toHaveProperty("id", mockContactId);
    expect(updatedResponse.body.data).toHaveProperty(
      "name",
      "Updated Contact Name"
    );
  });

  it("should handle validation error for empty name field", async () => {
    // Send a PUT request to update the contact with empty name field
    const updatedResponse = await request(app)
      .put(`/contacts/${mockContactId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "",
        email: "mock@example.com",
        company: "Example TEST",
        linkedin: "https://linkedin.com/in/example",
      });

    console.log(JSON.stringify(updatedResponse.body));
    // Expect the response status code to be 400 (Bad Request)
    expect(updatedResponse.status).toBe(400);

    // Expect the response body to contain the error message for empty name field
    expect(updatedResponse.body).toEqual({
      errors: '["name" is not allowed to be empty]'
    });
  });

  it("should handle validation error for empty name field", async () => {
    // Send a PUT request to update the contact with empty name field
    const updatedResponse = await request(app)
      .put(`/contacts/${mockContactId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "",
        email: "mock@example.com",
        company: "Example TEST",
        linkedin: "https://linkedin.com/in/example",
      });

    console.log(JSON.stringify(updatedResponse.body));
    // Expect the response status code to be 400 (Bad Request)
    expect(updatedResponse.status).toBe(400);

    // Expect the response body to contain the error message for empty name field
    expect(updatedResponse.body).toEqual({
      errors: '["name" is not allowed to be empty]'
    });
  });

  it("should handle validation error for email invalid", async () => {
    // Send a PUT request to update the contact with empty name field
    const updatedResponse = await request(app)
      .put(`/contacts/${mockContactId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "",
        email: "mock",
        company: "Example TEST",
        linkedin: "https://linkedin.com/in/example",
      });

    // Expect the response status code to be 400 (Bad Request)
    expect(updatedResponse.status).toBe(400);

    // Expect the response body to contain the error message for empty name field
    expect(updatedResponse.body).toEqual({
      errors: '["name" is not allowed to be empty],["email" must be a valid email]'
    });
  });

  it("should return all contacts", async () => {
    // Realiza una solicitud GET al endpoint '/contacts'
    const response = await request(app).get("/contacts").set("Authorization", `Bearer ${token}`);

    // Espera que el código de estado de la respuesta sea 200 (OK)
    expect(response.status).toBe(200);

    // Espera que la respuesta contenga un cuerpo
    expect(response.body).toBeDefined();

    // Espera que la respuesta contenga un arreglo de contactos
    expect(Array.isArray(response.body.data)).toBe(true);

    // Opcional: Verifica la estructura de cada contacto devuelto
    response.body.data.forEach((contact: Contact) => {
      expect(contact.id).toBeDefined();
      expect(contact.name).toBeDefined();
      expect(contact.email).toBeDefined();
      // Verifica otras propiedades si es necesario
    });
  });

  it("should return Unauthorized", async () => {
    // Realiza una solicitud GET al endpoint '/contacts'
    const response = await request(app).get("/contacts");
    // Espera que el código de estado de la respuesta sea 200 (OK)
    expect(response.status).toBe(401);
    // Espera que la respuesta contenga un cuerpo
    expect(response.text).toContain("Unauthorized");
  });
});

afterAll(async () => {
  await disconnectDB();
  server.close();
});

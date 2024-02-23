import request from "supertest";

import { Permission } from "../models/permission.model";
import { Person } from "../models/person.model";
import { Role } from "../models/role.model";
import { User } from "../models/user.model";
import { edit, me } from "../api/resources/profile/profile.controller"; // Ajusta la ruta al archivo donde se encuentra la función edit
import { ProfileParameterNotSpecify } from "../api/resources/profile/profile.error";
import { UserNotExist } from "../api/resources/users/users.error";
import { app, server } from "../app"; // Import your Express application and server
import { disconnectDB } from "../connection/connection";


describe("TESTING FEATURES IN THE CONTROLLER TO RETRIEVE USER PROFILE", () => {

  beforeEach(() => {
    // Limpiar los mocks antes de cada prueba
    jest.clearAllMocks();
  });

  // Mockear los modelos y las funciones necesarias
  jest.mock("./../models/user.model.ts", () => ({
    User: {
      findOne: jest.fn(),
    },
  }));

  jest.mock("./../models/person.model.ts", () => ({
    Person: {
      findOne: jest.fn(),
    },
  }));

  it("should return the user profile when ID is specified", async () => {
    const userId = 1;
    const userMock = {
      id: userId,
      // ... define other properties of User model as needed
    } as User;

    jest.spyOn(User, "findOne").mockResolvedValueOnce(userMock);

    const result = await me(userId);

    expect(result).toEqual(userMock);
    expect(User.findOne).toHaveBeenCalledWith({
      include: [{ model: Person }, { model: Role, include: [Permission] }],
      where: { id: userId },
    });
  });

  it("should throw an error when ID is not specified", async () => {
    try {
      await me(); // Llamada a la función sin especificar el ID
      // Si no se lanza la excepción, falla la prueba
      fail("Expected ProfileParameterNotSpecify error to be thrown");
    } catch (error: any) {
      // Verificar que la excepción arrojada sea la esperada
      expect(error).toBeInstanceOf(ProfileParameterNotSpecify);
      expect(error.message).toBe(
        "Does not specify a parameter ID [null] to look up the user profile"
      );
    }
  });
  
});

describe("TESTING FEATURES IN THE CONTROLLER TO EDIT USER PROFILE", () => {
  
  beforeEach(() => {
    // Limpiar los mocks antes de cada prueba
    jest.clearAllMocks();
  });

  it("should edit the user and associated person correctly", async () => {
    // Mockear los datos necesarios para la prueba
    const userId = 1;
    const userData = {
      name: "John Doe",
      email: "johndoe@example.com",
    };
    const personData = {
      firstName: "John",
      lastName: "Doe",
      dateBurn: new Date(),
      telephone: "123456789",
      biography: "Lorem ipsum",
    };

    // Mockear la función findOne de User para devolver un usuario existente
    const userMock = {
      id: userId,
      name: "Old Name",
      email: "oldemail@example.com",
      save: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<User>;

    jest.spyOn(User, "findOne").mockResolvedValueOnce(userMock);

    // Mockear la función findOne de Person para devolver una persona existente
    const personMock = {
      id: 1,
      firstName: "Old First Name",
      lastName: "Old Last Name",
      dateBurn: new Date(),
      telephone: "987654321",
      biography: "Old Biography",
      save: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<Person>;
    jest.spyOn(Person, "findOne").mockResolvedValueOnce(personMock);

    // Ejecutar la función edit
    const updatedUser = await edit(userId, {
      ...userData,
      ...personData,
    });

    // Verificar que User.findOne haya sido llamado con los parámetros correctos
    expect(User.findOne).toHaveBeenCalledWith({
      include: [{ model: Person }, { model: Role, include: [Permission] }],
      where: { id: userId },
    });

    // Verificar que Person.findOne haya sido llamado con los parámetros correctos
    expect(Person.findOne).toHaveBeenCalledWith({ where: { userId: userId } });

    // Verificar que los datos del usuario hayan sido actualizados correctamente
    expect(userMock.name).toBe(userData.name);
    expect(userMock.email).toBe(userData.email);
    expect(userMock.save).toHaveBeenCalled();

    // Verificar que los datos de la persona hayan sido actualizados correctamente
    expect(personMock.firstName).toBe(personData.firstName);
    expect(personMock.lastName).toBe(personData.lastName);
    expect(personMock.dateBurn).toBe(personData.dateBurn);
    expect(personMock.telephone).toBe(personData.telephone);
    expect(personMock.biography).toBe(personData.biography);
    expect(personMock.save).toHaveBeenCalled();

    // Verificar que el usuario actualizado se haya devuelto correctamente
    expect(updatedUser).toBe(userMock);
  });

  it("should throw UserNotExist exception when the user does not exist", async () => {
    const userId = 1;
    const userData = {
      name: "John Doe",
      email: "johndoe@example.com",
      firstName: "John",
      lastName: "Doe",
      dateBurn: new Date(),
      telephone: "123456789",
      biography: "Lorem ipsum",
    };

    // Mockear la función findOne de User para devolver null (usuario no existe)
    jest.spyOn(User, "findOne").mockResolvedValueOnce(null);

    try {
      await edit(userId, userData);
      fail("Expected UserNotExist error to be thrown");
    } catch (error: any) {
      expect(error).toBeInstanceOf(UserNotExist);
    }
  });

});

describe("TESTING FEATURES IN THE USER PROFILE ROUTE", () => {

  let tokenAdmin: string;
  let tokenUser: string;
  let tokenGuest: string;
  beforeAll(async () => {
    // Login and get the JWT token
    const loginResponseAdmin = await request(app) // Send a POST request to '/auth/login' endpoint
      .post("/auth/login")
      .send({ email: "admin@admin.com", password: "admin" });

    // Extract the JWT token from the login response
    tokenAdmin = loginResponseAdmin.body.token;
    console.log(`Token Admin ${tokenAdmin}`)
    
    const loginResponseUser = await request(app) // Send a POST request to '/auth/login' endpoint
    .post("/auth/login")
    .send({ email: "user@user.com", password: "user" });

    // Extract the JWT token from the login response
    tokenUser = loginResponseUser.body.token;


     const loginResponseGuest = await request(app) // Send a POST request to '/auth/login' endpoint
     .post("/auth/login")
     .send({ email: "guest@guest.com", password: "guest" });
 
     // Extract the JWT token from the login response
     tokenGuest = loginResponseGuest.body.token;
  });
  
  it("should return the user root profile when called with valid authentication", async () => {
    // Log in to obtain a valid JWT token
    // Make the request to the /me endpoint with the JWT token in the header
    const response = await request(app)
      .get("/profile")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    // Assert the response
    expect(response.status).toBe(200);

    // Check if the response body is a valid JSON
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("name", "Admin");
    expect(response.body).toHaveProperty("email", "admin@admin.com");
    // expect(response.body).toHaveProperty("role", {
    //   id: 1,
    //   name: "ADMIN",
    //   createdAt: expect.any(String),
    //   updatedAt: expect.any(String),
    //   deletedAt: null,
    //   permissions: expect.any(Array),
    // });
    expect(response.body.role).toHaveProperty("name", "ADMIN");
    expect(response.body.role).toHaveProperty("permissions", expect.any(Array));
  }); // Increase timeout to 60 seconds (60000 milliseconds)

  it("should return the user normal profile when called with valid authentication", async () => {

    // Make the request to the /me endpoint with the JWT token in the header
    const response = await request(app)
      .get("/profile")
      .set("Authorization", `Bearer ${tokenUser}`);

    // Assert the response
    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("name", "user");
    expect(response.body).toHaveProperty("email", "user@user.com");
    // expect(response.body).toHaveProperty("role", {
    //   id: 1,
    //   name: "ADMIN",
    //   createdAt: expect.any(String),
    //   updatedAt: expect.any(String),
    //   deletedAt: null,
    //   permissions: expect.any(Array),
    // });
    expect(response.body.role).toHaveProperty("name", "User");
    expect(response.body.role).toHaveProperty("permissions", expect.any(Array));
  });

  it("should return the guest user profile when called with valid authentication", async () => {

    // Make the request to the /me endpoint with the JWT token in the header
    const response = await request(app)
      .get("/profile")
      .set("Authorization", `Bearer ${tokenGuest}`);

    // Assert the response
    expect(response.status).toBe(200);

    // Check if the response body is a valid JSON
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("name", "guest");
    expect(response.body).toHaveProperty("email", "guest@guest.com");
    // expect(response.body).toHaveProperty("role", {
    //   id: 1,
    //   name: "ADMIN",
    //   createdAt: expect.any(String),
    //   updatedAt: expect.any(String),
    //   deletedAt: null,
    //   permissions: expect.any(Array),
    // });
    expect(response.body.role).toHaveProperty("name", "Guest");
    expect(response.body.role).toHaveProperty("permissions", expect.any(Array));
  });

});

afterAll(async () => {
  await disconnectDB();
  server.close();
});

import { Role } from "../models/role.model";
import { Permission } from "../models/permission.model";
import request from "supertest";

import * as roleController from "../api/resources/roles/roles.controller";
import { InfoRoleInUse } from "../api/resources/roles/roles.error";
import {
  create,
  all,
  edit,
  destroy,
  createRolePermission,
  editRolePermissions,
} from "../api/resources/roles/roles.controller"; // Adjust the path to the file where the edit function is located
import { Op } from "sequelize";
import {  app, server } from "../app"; // Import your Express app and server
import { disconnectDB } from "../connection/connection";


describe("TESTING FEATURES IN THE ROLE CONTROLLER ", () => {
  jest.mock("../models/role.model", () => ({
    Role: {
      // Mocked methods and attributes of the Role model
      create: jest.fn(), // Mock the create method
      findAll: jest.fn(), // Mock the findAll method
      findOne: jest.fn(), // Mock the findOne method
      destroy: jest.fn(), // Mock the destroy method
      update: jest.fn(), // Mock the update method
      findByPk: jest.fn(), // Mock the findByPk method
      $add: jest.fn(), // Mock the $add attribute
      $set: jest.fn(), // Mock the $set attribute
      $count: jest.fn(), // Mock the $count attribute
    },
  }));

  // Mock the "../models/permission.model" module
  jest.mock("../models/permission.model", () => ({
    Permission: {
      // Mocked methods and attributes of the Permission model
      findAll: jest.fn(), // Mock the findAll method
    },
  }));

  it("should create a new role", async () => {
    const role = { name: "Test Role" };
    const createdRole = { id: 6, name: role.name, permissions: [] };

    jest.spyOn(Role, "create").mockResolvedValueOnce(createdRole);

    const result = await create(role);

    expect(result).toEqual(createdRole);

    /*
            
        The toHaveBeenCalledWith() method is used in Jest tests to verify if
        a function has been called with specific arguments.
        I use toHaveBeenCalledWith() to verify if the function
        Role.create has been called with an object that has certain
        properties and values. It checks if Role.create has been called
        with an object that includes a property include with the
        value [Permission] and a property name with the value role.name.
        */
    expect(Role.create).toHaveBeenCalledWith({
      include: [Permission],
      name: role.name,
    });
  });

  it("should retrieve all roles", async () => {
    const role1 = { name: "Test Role 1" };
    const createdRole1 = {
      id: 7,
      name: role1.name,
      permissions: [],
    } as unknown as Role;
    const role2 = { name: "Test Role 2" };
    const createdRole2 = {
      id: 8,
      name: role2.name,
      permissions: [],
    } as unknown as Role;

    jest
      .spyOn(Role, "findAll")
      .mockResolvedValueOnce([createdRole1, createdRole2]);
    const page = 1;
    const pageSize = 10;
    let where: any = {
      id: { [Op.not]: null },
    };

    const roles = await all(page, pageSize, where);

    // Verify that the roles array is defined, is an array, and matches the expected values

    expect(Array.isArray(roles.rows)).toBe(true);
    expect(roles.rows).toEqual([createdRole1, createdRole2]);
  });

  it("should edit a role", async () => {
    const role = { name: "Updated Role" };
    const mockRole = {
      id: 7,
      name: role.name,
      permissions: [],
    } as unknown as Role;

    // Mock the behavior of the `update` function of the `Role` model
    const updateMock = jest
      .spyOn(Role, "update")
      .mockResolvedValue(mockRole.id);
    // This mock simulates the behavior of the `update` function, returning the `id` of the updated role.

    // Mock the behavior of the `findOne` function of the `Role` model
    const findMock = jest.spyOn(Role, "findOne").mockResolvedValue(mockRole);
    // This mock simulates the behavior of the `findOne` function, returning the `findRole` object.
    // This ensures that when the `findOne` function is called, it resolves with the `findRole` object.

    // These mocks allow us to control the behavior of the `update` and `findOne` functions in our tests.
    // We can specify the return values and track if they are called with the expected arguments.

    // Call the edit function
    /*
          Mocking is used before calling the edit method in the tests to control the behavior of external dependencies
          and allow independent, controlled, and predictable testing of the method's logic.
    
          By mocking the dependencies before calling the edit method, it ensures that the test runs in isolation
          and no actual operations are performed in the database or other parts of the system.
        */
    const editedRole = await edit(mockRole.id, mockRole);

    // Assertions
    expect(updateMock).toHaveBeenCalledWith(
      { name: "Updated Role" },
      { where: { id: 7 } }
    );

    expect(findMock).toHaveBeenCalledWith({
      include: [Permission],
      where: { id: 7 },
    });

    expect(editedRole).toEqual(mockRole);

    // Restore the mocked functions
    updateMock.mockRestore();
    findMock.mockRestore();
  });

  it("should delete a role", async () => {
    const roleId = 1; // Proporciona un ID de rol válido de tu base de datos
    const roleToDelete = {
      id: roleId,
      name: "Test Role",
      permissions: [],
    } as unknown as Role; // Proporciona el objeto de rol a eliminar (si es necesario)
    roleToDelete.$count = jest.fn().mockResolvedValue(0);

    // Mock the dependencies
    const findMock = jest
      .spyOn(Role, "findOne")
      .mockResolvedValue(roleToDelete);
    const destroyMock = jest.spyOn(Role, "destroy").mockResolvedValue(1);

    // Call the destroy function
    const deletedRole = await destroy(roleId, roleToDelete);

    // Assertions
    expect(deletedRole).toBeDefined();
    expect(deletedRole?.id).toBe(roleId);

    // Restore the mocked functions
    findMock.mockRestore();
    destroyMock.mockRestore();
  });

  it("should throw an error when a role has associated permissions", async () => {
    const roleId = 1; // Proporciona un ID de rol válido con permisos asociados de tu base de datos
    const roleToDelete = {
      id: roleId,
      name: "Admin",
      permissions: [],
    } as unknown as Role; // Proporciona el objeto de rol a eliminar (si es necesario)
    // Mock the dependencies
    roleToDelete.$count = jest.fn().mockResolvedValue(1);

    const findMock = jest
      .spyOn(Role, "findOne")
      .mockResolvedValue(roleToDelete);
    const destroyMock = jest.spyOn(Role, "destroy").mockResolvedValue(0);

    // Call the destroy function and expect it to throw an error
    await expect(destroy(roleId, roleToDelete)).rejects.toThrow(
      "Role cannot be deleted because it has associated permissions."
    );

    // Restore the mocked functions
    findMock.mockRestore();
    destroyMock.mockRestore();
  });

  it("should assign permissions to a role", async () => {
    const permissionIds = [1, 2, 3]; // Valid permission IDs from your database
    const roleId = 1; // ID of the role

    const role = {
      id: roleId,
      name: "Admin",
      permissions: [], // Initially empty permissions
    } as unknown as Role;

    role.$add = jest.fn().mockResolvedValue(0);

    const role2 = {
      id: roleId,
      name: "Admin",
      permissions: [1, 2, 3], // Initially empty permissions
    } as unknown as Role;

    // Mock the findByPk function of Role
    const findByPkMock = jest
      .spyOn(Role, "findByPk")
      .mockResolvedValueOnce(role)
      .mockResolvedValueOnce(role2);

    // Call the createRolePermission function
    const updatedRole = await createRolePermission(permissionIds, roleId);

    // Verify that findByPk was called with the correct parameters
    expect(findByPkMock).toHaveBeenCalledWith(roleId, {
      include: [Permission],
    });

    // Verify that the permissions were assigned correctly
    expect(updatedRole).toBeDefined();
    expect(updatedRole?.id).toBe(roleId);
    expect(updatedRole?.permissions).toHaveLength(permissionIds.length);
    expect(updatedRole?.permissions.map((p: any) => p)).toEqual(permissionIds);

    // Restore the original implementation of findByPk
    findByPkMock.mockRestore();
  });

  it("should update role permissions", async () => {
    const roleId = 1;
    const permissionIds = [1, 2, 3];
    const permissionIdsSend = [4, 5, 6];

    // Create a role object and set the initial permissions
    const role = {
      id: roleId,
      name: "Admin",
      permissions: permissionIdsSend,
    } as unknown as Role;
    role.$set = jest.fn().mockResolvedValue(0);

    const roleExpected = {
      id: roleId,
      name: "Admin",
      permissions: permissionIds,
    } as unknown as Role;

    // Mock the Role.findByPk to return the role

    jest.spyOn(Role, "findByPk").mockResolvedValueOnce(role);
    jest.spyOn(Role, "findByPk").mockResolvedValueOnce(roleExpected);
    // Mock the Permission.findAll to return the permissions
    jest.spyOn(Permission, "findAll").mockResolvedValueOnce([
      { id: 1, name: "Permission 1" },
      { id: 2, name: "Permission 2" },
      { id: 3, name: "Permission 3" },
    ] as Permission[]);

    // Call the editRolePermissions function
    const updatedRole = await editRolePermissions(permissionIds, roleId);

    // Verify the expected function calls
    expect(Role.findByPk).toHaveBeenCalledWith(roleId, {
      include: [Permission],
    });
    expect(Permission.findAll).toHaveBeenCalledWith({
      where: { id: permissionIds },
    });
    expect(role.$set).toHaveBeenCalledWith("permissions", [
      { id: 1, name: "Permission 1" },
      { id: 2, name: "Permission 2" },
      { id: 3, name: "Permission 3" },
    ]);

    // Verify the result
    expect(updatedRole).toEqual(roleExpected);
    expect(updatedRole?.permissions).toHaveLength(3);
  });

  it("should remove all role permissions", async () => {
    const roleId = 1;
    const permissionIds: number[] = [];

    // Create a role object and set the initial permissions
    const role = {
      id: roleId,
      name: "Admin",
      permissions: [
        { id: 1, name: "Permission 1" },
        { id: 2, name: "Permission 2" },
      ],
    } as unknown as Role;

    role.$set = jest.fn().mockResolvedValue([
      { id: 1, name: "Permission 1" },
      { id: 2, name: "Permission 2" },
    ]);

    // Mock the Role.findByPk to return the role
    (Role.findByPk as jest.Mock).mockResolvedValueOnce(role);

    const roleExpected = {
      id: roleId,
      name: "Admin",
      permissions: [],
    } as unknown as Role;

    roleExpected.$set = jest.fn().mockResolvedValue([]);

    // Mock the Role.findByPk to return the role
    (Role.findByPk as jest.Mock).mockResolvedValueOnce(roleExpected);

    // Call the editRolePermissions function
    const updatedRole = await editRolePermissions(permissionIds, role.id);

    // Verify the expected function calls
    expect(Role.findByPk).toHaveBeenCalledWith(roleId, {
      include: [Permission],
    });
    expect(role.$set).toHaveBeenCalledWith("permissions", []);

    // Verify the result
    expect(updatedRole).toEqual(roleExpected);
    expect(updatedRole?.permissions).toHaveLength(0);
  });
});

describe("[POST /roles] TESTING FEATURES IN THE ROLE ROUTE WHEN ROLE IS CREATE", () => {
  afterEach(() => {
    jest.clearAllMocks(); // Reset mock after each test
  });

  let token: string;

  beforeAll(async () => {
    // Login and get the JWT token
    const loginResponse = await request(app)
      .post("/auth/login")
      .send({ email: "admin@admin.com", password: "admin" });

    // Extract the JWT token from the login response
    token = loginResponse.body.token;
  });

  it("should create a new role", async () => {
    // Mock the roleController.create method
    const mockCreate = jest
      .spyOn(roleController, "create")
      .mockResolvedValueOnce({
        name: "TestRole",
        // Other properties of the role
      } as Role);

    const roleData = {
      name: "TestRole",
      // Other properties of the role
    };

    // Send a request to create a new role
    const response = await request(app)
      .post("/roles")
      .set("Authorization", `Bearer ${token}`)
      .send(roleData);

    expect(response.status).toBe(201); // Expect the response status code to be 201 (Created)
    expect(response.body).toEqual({
      message: `Role with name [${roleData.name}] created successfully.`,
      data: roleData.name,
    }); // Expect the response body to contain the success message and data of the created role

    expect(mockCreate).toHaveBeenCalledTimes(1); // Expect the roleController.create method to be called once
    expect(mockCreate).toHaveBeenCalledWith(roleData); // Expect the roleController.create method to be called with the correct role data
  });

  it("should return an error if the role already exists", async () => {
    // Mock the roleController.create method to reject with a specific error
    const mockCreate = jest
      .spyOn(roleController, "create")
      .mockRejectedValueOnce(new InfoRoleInUse());

    const existingRoleData = {
      name: "ExistingRole",
      // Other properties of the existing role
    };

    // Send a request to create a role that already exists
    const response = await request(app)
      .post("/roles")
      .set("Authorization", `Bearer ${token}`)
      .send(existingRoleData);

    expect(response.status).toBe(409); // Expect the response status code to be 409 (Conflict)
    expect(response.body).toEqual({
      message: "There is a role with the same name.",
    }); // Expect the response body to contain the error message indicating a role with the same name exists

    expect(mockCreate).toHaveBeenCalledTimes(1); // Expect the roleController.create method to be called once
    expect(mockCreate).toHaveBeenCalledWith(existingRoleData); // Expect the roleController.create method to be called with the correct role data
  });

  it("should return an error if an unexpected error occurs", async () => {
    // Mock an error in the roleController.create method
    jest
      .spyOn(roleController, "create")
      .mockRejectedValueOnce(new Error("Unexpected error"));

    // Define the role data
    const roleData = {
      name: "TestRole",
      // Other properties of the role
    };

    // Send a request to create a new role
    const response = await request(app)
      .post("/roles")
      .set("Authorization", `Bearer ${token}`)
      .send(roleData);

    expect(response.status).toBe(500); // Expect the response status code to be 500 (Internal Server Error)

    // Expect the response body to contain an error message indicating an unexpected error occurred
    expect(response.body).toEqual({
      message: "Error creating the role.",
    });
  });
});

describe("[GET /roles/:id] TESTING FEATURES IN THE ROLE ROUTE WHEN ROLE IS RETRIEVED", () => {
  
  
  afterEach(() => {
    jest.clearAllMocks(); // Reset mock after each test
  });

  let token: string;

  beforeAll(async () => {
    // Login and get the JWT token
    const loginResponse = await request(app) // Send a POST request to '/auth/login' endpoint
      .post("/auth/login")
      .send({ email: "admin@admin.com", password: "admin" });

    // Extract the JWT token from the login response
    token = loginResponse.body.token;
    await Role.create({ id: 10, name: 'ACT', permissions: [] });
  });

  it("should return a role when a valid ID is provided", async () => {
 
    const createdRole = { id: 10, name: "ACT", permissions: [] } as unknown as Role;

    const response = await request(app)
        .get("/roles/10")
        .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toEqual(createdRole.id);
    expect(response.body.name).toEqual(createdRole.name);
  });


  it("should return a 405 status and error message when the role does not exist", async () => {
    // Mock the roleController.find method to return null (role not found)
    jest.spyOn(roleController, "find").mockResolvedValueOnce(null);
    const response = await request(app) // Send a GET request to '/roles/1' endpoint
      .get("/roles/1")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(405); // Expect the response status code to be 405 (Method Not Allowed)
    expect(response.body).toEqual({
      message: `Role with ID [1] does not exist.`,
    }); // Expect the response body to contain an error message
  });

  it("should return a 500 status and error message when an unexpected error occurs", async () => {
    // Mock the roleController.find method to throw an error
    const errorMessage = "Unexpected error";
    jest
      .spyOn(roleController, "find")
      .mockRejectedValueOnce(new Error(errorMessage));

    const response = await request(app) // Send a GET request to '/roles/1' endpoint
      .get("/roles/1")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(500); // Expect the response status code to be 500 (Internal Server Error)
    expect(response.body).toEqual({ message: "Error getting the role." }); // Expect the response body to contain an error message
  });
});

describe("[PUT /roles/:id] TESTING FEATURES IN THE ROLE ROUTE WHEN ROLE IS UPDATED", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  let token: string;

  beforeAll(async () => {
    // Login and get the JWT token
    const loginResponse = await request(app) // Send a POST request to '/auth/login' endpoint
      .post("/auth/login")
      .send({ email: "admin@admin.com", password: "admin" });

    // Extract the JWT token from the login response
    token = loginResponse.body.token;
  });

  it("should update a role when a valid ID is provided", async () => {
    // Mock the roleController.find method to return an existing role
    const mockExistingRole = { id: 1, name: "ExistingRole" } as Role;
    jest.spyOn(roleController, "find").mockResolvedValueOnce(mockExistingRole);

    // Mock the roleController.edit method to return the updated role
    const updatedRoleData = { id: 1, name: "UpdatedRole" } as Role;
    jest.spyOn(roleController, "edit").mockResolvedValueOnce(updatedRoleData);

    const response = await request(app)
      .put("/roles/1")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "UpdatedRole" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: `Role with name [${updatedRoleData.name}] has been successfully modified.`,
      data: updatedRoleData,
    });
    expect(roleController.edit).toHaveBeenCalledTimes(1);
    expect(roleController.edit).toHaveBeenCalledWith(1, {
      name: "UpdatedRole",
    });
  });

  it("should return a 404 status and error message when the role does not exist", async () => {
    // Mock the roleController.find method to return null (role not found)
    jest.spyOn(roleController, "find").mockResolvedValueOnce(null);

    const response = await request(app)
      .put("/roles/1")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "UpdatedRole" });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: "Role with ID [1] does not exist.",
    });
    expect(roleController.edit).not.toHaveBeenCalled();
  });

  it("should return a 500 status and error message when an unexpected error occurs", async () => {
    // Mock the roleController.find method to throw an error
    const errorMessage = "Unexpected error";
    jest
      .spyOn(roleController, "find")
      .mockRejectedValueOnce(new Error(errorMessage));

    const response = await request(app)
      .put("/roles/1")
      .set("Authorization", `Bearer ${token}`)

      .send({ name: "UpdatedRole" });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Error modifying the role." });
    expect(roleController.edit).not.toHaveBeenCalled();
  });
});

describe("[DELETE /roles/:id] TESTING FEATURES IN THE ROLE ROUTE WHEN ROLE IS DELETED", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  let token: string;

  beforeAll(async () => {
    // Login and get the JWT token
    const loginResponse = await request(app) // Send a POST request to '/auth/login' endpoint
      .post("/auth/login")
      .send({ email: "admin@admin.com", password: "admin" });

    // Extract the JWT token from the login response
    token = loginResponse.body.token;
  });

  it("should delete a role when a valid ID is provided", async () => {
    // Mock the roleController.find method to return an existing role
    const mockExistingRole = { id: 1, name: "ExistingRole" } as Role;
    jest.spyOn(roleController, "find").mockResolvedValueOnce(mockExistingRole);

    // Mock the roleController.destroy method to return the deleted role
    const deletedRoleData = { id: 1, name: "DeletedRole" } as Role;
    jest
      .spyOn(roleController, "destroy")
      .mockResolvedValueOnce(deletedRoleData);

    const response = await request(app)
      .delete("/roles/1")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: `Role with name [${deletedRoleData.name}] has been deleted.`,
      data: deletedRoleData,
    });
    expect(roleController.destroy).toHaveBeenCalledTimes(1);
    expect(roleController.destroy).toHaveBeenCalledWith(1, mockExistingRole);
  });

  it("should return a 404 status and error message when the role does not exist", async () => {
    // Mock the roleController.find method to return null (role not found)
    jest.spyOn(roleController, "find").mockResolvedValueOnce(null);

    const response = await request(app)
      .delete("/roles/1")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: "Role with ID [1] does not exist.",
    });
    expect(roleController.destroy).not.toHaveBeenCalled();
  });

  it("should return a 500 status and error message when an unexpected error occurs", async () => {
    // Mock the roleController.find method to throw an error
    const errorMessage = "Unexpected error";
    jest
      .spyOn(roleController, "find")
      .mockRejectedValueOnce(new Error(errorMessage));

    const response = await request(app)
      .delete("/roles/1")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Error deleting the role." });
    expect(roleController.destroy).not.toHaveBeenCalled();
  });
});

describe("[POST /roles/:id/permissions]  TESTING FEATURES IN THE ROLE ROUTE WHEN PERMISSIONS ARE CREATED", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  let token: string;

  beforeAll(async () => {
    // Login and get the JWT token
    const loginResponse = await request(app) // Send a POST request to '/auth/login' endpoint
      .post("/auth/login")
      .send({ email: "admin@admin.com", password: "admin" });

    // Extract the JWT token from the login response
    token = loginResponse.body.token;
  });

  it("should assign permissions to a role when a valid ID and permission IDs are provided", async () => {
    const roleId = 1;
    const permissionIds = [1, 2, 3];

    // Mock the roleController.createRolePermission method to return the role with assigned permissions
    const assignedRole = {
      id: roleId,
      name: "TestRole",
      permissions: permissionIds,
    } as unknown as Role;
    jest
      .spyOn(roleController, "createRolePermission")
      .mockResolvedValueOnce(assignedRole);

    const response = await request(app)
      .post(`/roles/${roleId}/permissions`)
      .set("Authorization", `Bearer ${token}`)
      .send({ permissionIds });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: `Permissions assigned to role with ID ${roleId}`,
      data: assignedRole,
    });
    expect(roleController.createRolePermission).toHaveBeenCalledTimes(1);
    expect(roleController.createRolePermission).toHaveBeenCalledWith(
      permissionIds,
      roleId
    );
  });

  it("should return a 500 status and error message when an unexpected error occurs", async () => {
    const roleId = 1;
    const permissionIds = [1, 2, 3];

    // Mock the roleController.createRolePermission method to throw an error
    const errorMessage = "Unexpected error";
    jest
      .spyOn(roleController, "createRolePermission")
      .mockRejectedValueOnce(new Error(errorMessage));

    const response = await request(app)
      .post(`/roles/${roleId}/permissions`)
      .set("Authorization", `Bearer ${token}`)
      .send({ permissionIds });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "Error assigning permissions to the role.",
    });
    expect(roleController.createRolePermission).toHaveBeenCalledTimes(1);
    expect(roleController.createRolePermission).toHaveBeenCalledWith(
      permissionIds,
      roleId
    );
  });
});

describe("[PUT /roles/:id/permissions]  TESTING FEATURES IN THE ROLE ROUTE WHEN PERMISSIONS ARE UPDATED", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  let token: string;

  beforeAll(async () => {
    // Login and get the JWT token
    const loginResponse = await request(app) // Send a POST request to '/auth/login' endpoint
      .post("/auth/login")
      .send({ email: "admin@admin.com", password: "admin" });

    // Extract the JWT token from the login response
    token = loginResponse.body.token;
  });
  it("should update permissions for a role when a valid ID and permission IDs are provided", async () => {
    const roleId = 1;
    const permissionIds = [4, 5, 6];

    // Mock the roleController.editRolePermissions method to return the role with updated permissions
    const updatedRole = {
      id: roleId,
      name: "TestRole",
      permissions: permissionIds,
    } as unknown as Role;
    jest
      .spyOn(roleController, "editRolePermissions")
      .mockResolvedValueOnce(updatedRole);

    const response = await request(app)
      .put(`/roles/${roleId}/permissions`)
      .set("Authorization", `Bearer ${token}`)
      .send({ permissionIds });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: `Permissions updated for role with ID ${roleId}`,
      data: updatedRole,
    });
    expect(roleController.editRolePermissions).toHaveBeenCalledTimes(1);
    expect(roleController.editRolePermissions).toHaveBeenCalledWith(
      permissionIds,
      roleId
    );
  });

  it("should return a 500 status and error message when an unexpected error occurs", async () => {
    const roleId = 1;
    const permissionIds = [4, 5, 6];

    // Mock the roleController.editRolePermissions method to throw an error
    const errorMessage = "Unexpected error";
    jest
      .spyOn(roleController, "editRolePermissions")
      .mockRejectedValueOnce(new Error(errorMessage));

    const response = await request(app)
      .put(`/roles/${roleId}/permissions`)
      .set("Authorization", `Bearer ${token}`)
      .send({ permissionIds });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "Error updating role permissions.",
    });
    expect(roleController.editRolePermissions).toHaveBeenCalledTimes(1);
    expect(roleController.editRolePermissions).toHaveBeenCalledWith(
      permissionIds,
      roleId
    );
  });
});

afterAll(async () => {
  await Role.destroy({ where: { id: 10 }, force: true });
  await disconnectDB();
  server.close();
});

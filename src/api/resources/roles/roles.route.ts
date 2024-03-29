import express, { Request, Response } from 'express';
import passport from 'passport';
import log from '../utils/logger';
import * as roleController from './roles.controller';
import { InfoRoleInUse, RoleNotExist } from './roles.error';
import { procesarErrores } from '../../libs/errorHandler';
import { validationRole } from './roles.validation';
import  { checkUserRolePermission } from './../helpers/checkRolePermision.helper';
import { Op } from 'sequelize';
import ExcelJS from 'exceljs';
import fs from 'fs';

const jwtAuthenticate = passport.authenticate('jwt', { session: false });

const rolesRouter = express.Router();

// Create a new role
rolesRouter.post('/', [jwtAuthenticate, validationRole, checkUserRolePermission('Create')], procesarErrores(async (req: Request, res: Response) => {
  let roleNew = req.body;
  try {
    const roleExist = await roleController.roleExist(roleNew);
    if (roleExist) {
      log.warn(`Role with name [${roleNew.name}] already exists.`);
      throw new InfoRoleInUse();
    }
    const roleCreated = await roleController.create(roleNew);
    res.status(201).json({ message: `Role with name [${roleCreated.name}] created successfully.`, data: roleCreated.name });
    log.info(`Role with name [${roleCreated.name}] created successfully.`);
  } catch (error) {
    // Handle the error
    if (error instanceof InfoRoleInUse) {
      log.warn(`Error creating the role [${roleNew.name}]: ${error.message}`);
      res.status(409).json({ message: error.message });
    } else {
      log.error(`Error creating the role [${roleNew.name}]`);
      res.status(500).json({ message: 'Error creating the role.' });
    }
  }
}));

// Get all roles
rolesRouter.get('/', [jwtAuthenticate, checkUserRolePermission('List')], procesarErrores(async (_req: Request, res: Response) => {
  try {
    const { page = 1, pageSize =10, name } = _req.query;
    let where: any = {
      id: { [Op.not]: null },
    };

    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }

    const result = await roleController.all(page as number, pageSize as number, where);
    res.json({ data: result.rows, count: result.count });
  } catch (error) {
    console.error('Error al obtener todos los roles:', error);
    res.status(500).json({ message: 'Error al obtener todos los roles.' });
  }
}));


rolesRouter.get('/export', [jwtAuthenticate], procesarErrores(async (req: Request, res: Response) => {
  const { page = 1, pageSize = Number.MAX_SAFE_INTEGER, name } = req.query as { page?: number; pageSize?: number; name?: string };

  let where: any = { };

  if (name) {
      where = {
          name: { [Op.like]: `%${name}%` }
      };
  }

  const roles = await roleController.all(page, pageSize, where);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Roles');

  worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Nombre', key: 'name', width: 30 },
      { header: 'Descripción', key: 'description', width: 50 },
  ];

  roles.rows.forEach((role: any) => {
      worksheet.addRow({
          id: role.id,
          name: role.name,
          description: role.description,
      });
  });

  const filename = 'roles.xlsx';
  const filepath = `./${filename}`;
  await workbook.xlsx.writeFile(filepath);

  const filestream = fs.createReadStream(filepath);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  filestream.pipe(res);

  filestream.on('close', () => {
      fs.unlinkSync(filepath);
  });
}));

// Get a specific role by ID
rolesRouter.get('/:id', [jwtAuthenticate,checkUserRolePermission('Read')], procesarErrores(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  try {
    const role = await roleController.find(id);
    if (!role) {
      throw new RoleNotExist(`Role with ID [${id}] does not exist.`);
    }
    res.json(role);
  } catch (error) {
    // Handle the error
    if (error instanceof RoleNotExist) {
      log.warn(`${error.message}. Role ID [${id}] does not exist`);
      res.status(405).json({ message: error.message });
    } else {
      log.error(`Error getting the role with ID [${id}]`);
      res.status(500).json({ message: 'Error getting the role.' });
    }
  }
  
}));

// Update a role by ID
rolesRouter.put('/:id', [jwtAuthenticate,checkUserRolePermission('Update')], procesarErrores(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  try {
    let roleToUpdate = await roleController.find(id);
    if (!roleToUpdate) {
      throw new RoleNotExist(`Role with ID [${id}] does not exist.`);
    }
    const roleUpdated = await roleController.edit(id, req.body);
    if (roleUpdated) {
      res.json({ message: `Role with name [${roleUpdated.name}] has been successfully modified.`, data: roleUpdated });
      log.info(`Role with ID [${roleUpdated.id}] has been successfully modified.`);
    }

  } catch (error) {
    // Handle the error
    if (error instanceof RoleNotExist) {
      log.warn(`${error.message}. Role ID [${id}] does not exist`);
      res.status(404).json({ message: error.message });
    } else {
      log.error(`Error modifying the role with ID [${id}]`);
      res.status(500).json({ message: 'Error modifying the role.' });
    }
  }
}));

// Delete a role by ID
rolesRouter.delete('/:id', [jwtAuthenticate,checkUserRolePermission('Delete')], procesarErrores(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  try {
    let roleToDelete = await roleController.find(id);
    if (!roleToDelete) {
      throw new RoleNotExist(`Role with ID [${id}] does not exist.`);
    }
    roleToDelete = await roleController.destroy(id, roleToDelete);
    log.info(`Role with ID [${id}] has been deleted.`);
    res.json({ message: `Role with name [${roleToDelete.name}] has been deleted.`, data: roleToDelete });
  } catch (error) {
    if (error instanceof RoleNotExist) {
      log.warn(`${error.message}. Role ID [${id}] does not exist`);
      res.status(404).json({ message: error.message });
    } else {
      log.error(`Error deleting the role with ID [${id}]`);
      res.status(500).json({ message: 'Error deleting the role.' });
    }
  }
}));

// Assign permissions to a role
rolesRouter.post('/:id/permissions', [jwtAuthenticate,checkUserRolePermission('Create')], procesarErrores(async (req: Request, res: Response) => {
  const roleId = parseInt(req.params.id);
  const permissionIds: number[] = req.body.permissionIds;

  try {
    const role = await roleController.createRolePermission(permissionIds, roleId);
    res.json({ message: `Permissions assigned to role with ID ${roleId}`, data: role });
    log.info(`Permissions assigned to the role with ID ${roleId}`);
  } catch (error) {
    log.error('Error assigning permissions to the role');
    res.status(500).json({ message: 'Error assigning permissions to the role.' });
  }
}));

// Update permissions for a role
rolesRouter.put('/:id/permissions', [jwtAuthenticate,checkUserRolePermission('Update')], procesarErrores(async (req: Request, res: Response) => {
  const roleId = parseInt(req.params.id);
  const permissionIds: number[] = req.body.permissionIds;
  try {
    const role = await roleController.editRolePermissions(permissionIds, roleId);
    res.json({ message: `Permissions updated for role with ID ${roleId}`, data: role });
    log.info(`Permissions updated for the role with ID ${roleId}`);
  } catch (error) {
    log.error('Error updating role permissions');
    res.status(500).json({ message: 'Error updating role permissions.' });
  }
}));

export default rolesRouter;

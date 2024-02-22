import express, { Request, Response } from 'express';
import passport from 'passport';
import log from '../utils/logger';
import * as contactController from './contacts.controller';
import { procesarErrores } from '../../libs/errorHandler';
import  { checkUserRolePermission } from './../helpers/checkRolePermision.helper';
import {ContactNotExist } from './contacts.error';
import { Op } from 'sequelize';
import ExcelJS from 'exceljs';
import fs from 'fs';
import { validationContact } from './contacts.validation';


const jwtAuthenticate = passport.authenticate('jwt', { session: false });

const contactRouter = express.Router();

contactRouter.get('/', [jwtAuthenticate, checkUserRolePermission('List')], procesarErrores(async (_req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 10, name } = _req.query;

    let where: any = {
        id: { [Op.not]: null },
    };
      
    if (name) {
    where[Op.or] = [
        { name: { [Op.like]: `%${name}%` } },
        { company: { [Op.like]: `%${name}%` } },
        { email: { [Op.like]: `%${name}%` } }
    ];
    }

    const result = await contactController.all(page as number, pageSize as number, where);

    if ('rows' in result && 'count' in result) {
      res.json({ data: result.rows, count: result.count });
    } else {
      console.error('Unexpected result format:', result);
      res.status(500).json({ message: 'Unexpected result format.' });
    }
  } catch (error) {
    console.error('Error retrieving all contacts:', error);
    res.status(500).json({ message: 'Error retrieving all contacts.' });
  }
}));


contactRouter.get('/export', [jwtAuthenticate], procesarErrores(async (req: Request, res: Response) => {
    const { page = 1, pageSize = Number.MAX_SAFE_INTEGER, name } = req.query as { page?: number; pageSize?: number; name?: string };
    
    let where: any = {
        id: { [Op.not]: null },
    };
      
    if (name) {
    where[Op.or] = [
        { name: { [Op.like]: `%${name}%` } },
        { company: { [Op.like]: `%${name}%` } },
        { email: { [Op.like]: `%${name}%` } }
    ];
    }

    try {
        const contacts = await contactController.all(page, pageSize, where);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Contacts');

        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Name', key: 'name', width: 30 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'LinkedIn', key: 'linkedin', width: 30 },
            { header: 'Company', key: 'company', width: 30 },
        ];

        contacts.rows.forEach((contact: any) => {
            worksheet.addRow({
                id: contact.id,
                name: contact.name,
                email: contact.email,
                linkedin: contact.linkedin,
                company: contact.company,
            });
        });

        const filename = 'contacts.xlsx';
        const filepath = `./${filename}`;
        await workbook.xlsx.writeFile(filepath);

        const filestream = fs.createReadStream(filepath);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        filestream.pipe(res);

        filestream.on('close', () => {
            fs.unlinkSync(filepath);
        });
    } catch (error) {
        console.error('Error exporting contacts:', error);
        res.status(500).json({ message: 'Error exporting contacts.' });
    }
}));

contactRouter.get('/:id', [jwtAuthenticate, checkUserRolePermission('Read')], procesarErrores(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  try {
    const application = await contactController.getById(id);
    if (!application) {
      throw new ContactNotExist(`Contact with ID [${id}] does not exist.`);
    }
    log.info(`Successfully retrieved contact with ID [${id}].`);
    res.json(application);
  } catch (error) {
    if (error instanceof ContactNotExist) {
      log.warn(`${error.message}. Contact with ID [${id}] not found.`);
      res.status(404).json({ message: error.message });
    } else {
      log.error(`Error retrieving application with ID [${id}].`);
      res.status(500).json({ message: 'Error retrieving application.' });
    }
  }
}));

contactRouter.put('/:id', [jwtAuthenticate, checkUserRolePermission('Update')],validationContact, procesarErrores(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const contact = req.body;

  try {
    let contactToUpdate = await contactController.getById(id);
    if (!contactToUpdate) {
      throw new ContactNotExist(`Contact with ID [${id}] does not exist.`);
    }
    const contactUpdated = await contactController.update(id,contact);
    if (contactUpdated) {
      log.info(`Contact with ID [${contactUpdated.id}] has been successfully updated.`);
      res.json({ message: `Contact with company [${contactUpdated.company}] has been successfully updated.`, data: contactUpdated });
    }
  } catch (error) {
    if (error instanceof ContactNotExist) {
      log.warn(`${error.message}. Contact with ID [${id}] not found.`);
      res.status(404).json({ message: error.message });
    } else {
      log.error(`Error updating application with ID [${id}].`);
      res.status(500).json({ message: 'Error updating application.' });
    }
  }
}));

contactRouter.delete('/:id', [jwtAuthenticate, checkUserRolePermission('Delete')], procesarErrores(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  try {
    let contactToDelete = await contactController.getById(id);
    if (!contactToDelete) {
      throw new ContactNotExist(`Contact with ID [${id}] does not exist.`);
    }
    contactToDelete = await contactController.destroy(id, contactToDelete);
    log.info(`Contact with ID [${id}] has been deleted.`);
    res.json({ message: `Contact with company [${contactToDelete.company}] has been deleted.`, data: contactToDelete });
  } catch (error) {
    if (error instanceof ContactNotExist) {
      log.warn(`${error.message}. Contact with ID [${id}] not found.`);
      res.status(404).json({ message: error.message });
    } else {
      log.error(`Error deleting application with ID [${id}].`);
      res.status(500).json({ message: 'Error deleting application.' });
    }
  }
}));

export default contactRouter;

import express, { Request, Response } from 'express';
import passport from 'passport';
import log from '../utils/logger';
import * as applicationController from './applications.controller';
import { procesarErrores } from '../../libs/errorHandler';
import { validationApplication } from './applications.validation';
import  { checkUserRolePermission } from './../helpers/checkRolePermision.helper';
import {ApplicationNotExist,ApplicationInUse } from './applications.error';
import { Op } from 'sequelize';
import ExcelJS from 'exceljs';
import fs from 'fs';


const jwtAuthenticate = passport.authenticate('jwt', { session: false });

const applicationsRouter = express.Router();

applicationsRouter.post('/', [jwtAuthenticate, checkUserRolePermission('Create'), validationApplication], procesarErrores(async (req: Request, res: Response) => {
  let newApplication = req.body;
  try {
    const applicationExist = await applicationController.applicationExistByData(newApplication);
    if (applicationExist) {
      log.warn(`Application with company [${newApplication.company}] already exists.`);
      throw new ApplicationInUse();
    }
    const applicationCreated = await applicationController.create(newApplication);
    log.info(`Application with ID [${applicationCreated.id}] has been successfully created.`);
    res.status(201).json({ message: `Application with company [${applicationCreated.company}] created successfully.`, data: applicationCreated });
  } catch (error) {
    if (error instanceof ApplicationInUse) {
      log.warn(`${error.message}: ${newApplication.company}`);
      res.status(409).json({ message: error.message });
    } else {
      log.error(`Error creating the application with company [${newApplication.company}].`);
      res.status(500).json({ message: 'Error creating the application.' });
    }
  }
}));

applicationsRouter.get('/', [jwtAuthenticate, checkUserRolePermission('List')], procesarErrores(async (_req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 10, company } = _req.query;
    let where: any = {
      id: { [Op.not]: null },
    };

    if (company) {
      where.company = { [Op.like]: `%${company}%` };
    }

    const result = await applicationController.all(page as number, pageSize as number, where);

    if ('rows' in result && 'count' in result) {
      res.json({ data: result.rows, count: result.count });
    } else {
      console.error('Unexpected result format:', result);
      res.status(500).json({ message: 'Unexpected result format.' });
    }
  } catch (error) {
    console.error('Error retrieving all applications:', error);
    res.status(500).json({ message: 'Error retrieving all applications.' });
  }
}));


applicationsRouter.get('/export', [jwtAuthenticate], procesarErrores(async (req: Request, res: Response) => {
  const { page = 1, pageSize = Number.MAX_SAFE_INTEGER, company } = req.query as { page?: number; pageSize?: number; company?: string };

  let where: any = {};

  if (company) {
      where = {
          company: { [Op.like]: `%${company}%` }
      };
  }

  const applications = await applicationController.all(page, pageSize, where);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Applications');

  worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Position', key: 'position', width: 30 },
      { header: 'Company', key: 'company', width: 30 },
      { header: 'Company Website', key: 'companyWebsite', width: 30 },
      { header: 'Link Application', key: 'linkApplication', width: 30 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Notes', key: 'notes', width: 50 },
      { header: 'Applied Date', key: 'appliedDate', width: 20 },
      { header: 'Contact Name', key: 'contactName', width: 30 },
      { header: 'Contact Linkedin', key: 'contactLinkedin', width: 30 },
  ];

  applications.rows.forEach((application: any) => {
      worksheet.addRow({
          id: application.id,
          position: application.position,
          company: application.company,
          companyWebsite: application?.companyWebsite,
          linkApplication: application?.linkApplication,
          status: application.status,
          notes: application?.notes,
          appliedDate: application.appliedDate,
          contactName: application.contact?.name,
          contactLinkedin: application.contact?.contactLinkedin
      });
  });

  const filename = 'applications.xlsx';
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

applicationsRouter.get('/:id', [jwtAuthenticate, checkUserRolePermission('Read')], procesarErrores(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  try {
    const application = await applicationController.find(id);
    if (!application) {
      throw new ApplicationNotExist(`Application with ID [${id}] does not exist.`);
    }
    log.info(`Successfully retrieved application with ID [${id}].`);
    res.json(application);
  } catch (error) {
    if (error instanceof ApplicationNotExist) {
      log.warn(`${error.message}. Application with ID [${id}] not found.`);
      res.status(404).json({ message: error.message });
    } else {
      log.error(`Error retrieving application with ID [${id}].`);
      res.status(500).json({ message: 'Error retrieving application.' });
    }
  }
}));

applicationsRouter.put('/:id', [jwtAuthenticate, checkUserRolePermission('Update')], procesarErrores(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const application= req.body;
  const {  contact } = req.body;

  try {
    let applicationToUpdate = await applicationController.find(id);
    if (!applicationToUpdate) {
      throw new ApplicationNotExist(`Application with ID [${id}] does not exist.`);
    }
    const applicationUpdated = await applicationController.edit(id, application,contact);
    if (applicationUpdated) {
      log.info(`Application with ID [${applicationUpdated.id}] has been successfully updated.`);
      res.json({ message: `Application with company [${applicationUpdated.company}] has been successfully updated.`, data: applicationUpdated });
    }
  } catch (error) {
    if (error instanceof ApplicationNotExist) {
      log.warn(`${error.message}. Application with ID [${id}] not found.`);
      res.status(404).json({ message: error.message });
    } else {
      log.error(`Error updating application with ID [${id}].`);
      res.status(500).json({ message: 'Error updating application.' });
    }
  }
}));

applicationsRouter.delete('/:id', [jwtAuthenticate, checkUserRolePermission('Delete')], procesarErrores(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  try {
    let applicationToDelete = await applicationController.find(id);
    if (!applicationToDelete) {
      throw new ApplicationNotExist(`Application with ID [${id}] does not exist.`);
    }
    applicationToDelete = await applicationController.destroy(id, applicationToDelete);
    log.info(`Application with ID [${id}] has been deleted.`);
    res.json({ message: `Application with company [${applicationToDelete.company}] has been deleted.`, data: applicationToDelete });
  } catch (error) {
    if (error instanceof ApplicationNotExist) {
      log.warn(`${error.message}. Application with ID [${id}] not found.`);
      res.status(404).json({ message: error.message });
    } else {
      log.error(`Error deleting application with ID [${id}].`);
      res.status(500).json({ message: 'Error deleting application.' });
    }
  }
}));

export default applicationsRouter;

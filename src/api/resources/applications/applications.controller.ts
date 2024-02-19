import { Application } from "../../../models/application.models";
import { Contact } from "../../../models/contact.model";
import { FindOptions } from 'sequelize';

/**
 * Creates a new application entry in the database along with associated contact details.
 * @param application Object containing application details.
 * @returns Promise<Application> Created application object.
 */

export const create = async (application: {
    position: string,
    company: string,
    companyWebsite: string,
    linkApplication: string,
    status: string,
    notes: string,
    appliedDate:string,
    name: string,
    email: string,
    linkedin: string,
}): Promise<Application> => {
    const { position, company, companyWebsite, linkApplication, status, notes, appliedDate, name, email, linkedin } = application;
    console.log(application)
    const parsedAppliedDate = new Date(appliedDate);
    console.log(parsedAppliedDate)
    const contactCreate = await Contact.create({
        name,
        email,
        linkedin,
        company
    });

    const applicationCreate = await Application.create({
        position,
        company,
        companyWebsite,
        linkApplication,
        status,
        notes,
        appliedDate: parsedAppliedDate, // Usar la fecha convertida
        contactId: contactCreate.id
    }, {
        include: [Contact],
    });



    return applicationCreate;
};

/**
 * Retrieves applications from the database based on specified criteria.
 * @param page Page number.
 * @param pageSize Number of applications per page.
 * @param where Criteria to filter applications.
 * @returns Promise<{ rows: Application[]; count: number }> Object containing array of applications and total count.
 */
export const all = async (page: number, pageSize: number, where: any): Promise<{ rows: Application[]; count: number }> => {
    const options: FindOptions<Application> = {
        where,
        include: [Contact],
    };

    if (page && pageSize) {
        options.offset = (page - 1) * pageSize;
        options.limit = pageSize;
        options.order = [['id', 'ASC']];
    }

    const { rows } = await Application.findAndCountAll(options);
    const applicationCount = await Application.count({ where });

    return { rows, count: applicationCount };
};

/**
 * Finds an application based on provided parameters.
 * @param id Application ID.
 * @param company Company name.
 * @param nameContact Contact name.
 * @returns Promise<Application | null> Found application object or null if not found.
 */
export const find = (id: number | null = null, company: string | null = null, nameContact: string | null = null): Promise<Application | null> => {
    if (id) {
        return Application.findOne({ include: [Contact], where: { id } }) as Promise<Application | null>;
    }
    if (company) {
        return Application.findOne({ include: [Contact], where: { company } }) as Promise<Application | null>;
    }
    if (nameContact) {
        return Application.findOne({ include: [{ model: Contact, where: { name: nameContact } }] }) as Promise<Application | null>;
    }

    throw new Error('No se especificó un parámetro para buscar la postulación');
};


export const applicationExistByData = async (data: {
    position: string,
    company: string,
    companyWebsite: string,
    linkApplication: string,
}): Promise<boolean> => {
    try {
        const { position, company, companyWebsite, linkApplication } = data;
        
        // Buscar la aplicación en la base de datos
        const application = await Application.findOne({ where: { position, company, companyWebsite, linkApplication } });

        // Verificar si se encontró una aplicación
        return !!application;
    } catch (error) {
        console.error("Error al verificar la existencia de la aplicación:", error);
        return false;
    }
};


/**
 * Checks if an application with the specified ID exists.
 * @param id Application ID.
 * @returns Promise<boolean> True if application exists, false otherwise.
 */
export const applicationExist = ({ id }: { id: number }): Promise<boolean> => {
    return Application.findOne({ where: { id } })
        .then(application => !!application)
        .catch(() => false);
};

/**
 * Updates an existing application and associated contact details.
 * @param id Application ID.
 * @param application Updated application details.
 * @param contact Updated contact details.
 * @returns Promise<Application | null> Updated application object or null if not found.
 */
export const edit = async (id: number, application: {
    position: string,
    company: string,
    companyWebsite: string,
    linkApplication: string,
    status: string,
    notes: string,
    appliedDate: Date,
    contactId: number
}, contact: {
    id: number,
    name: string,
    email: string,
    linkedin: string
}): Promise<Application | null> => {
    try {
        const [updatedApplicationRowsCount] = await Application.update(application, { where: { id } });
        const [updatedContactRowsCount] = await Contact.update(contact, { where: { id: contact.id } });

        if (updatedApplicationRowsCount > 0 && updatedContactRowsCount > 0) {
            const updatedApplication = await Application.findByPk(id, { include: [Contact] });
            return updatedApplication;
        } else {
            return null;
        }
    } catch (error) {
        throw error;
    }
};

/**
 * Deletes an application from the database.
 * @param id Application ID.
 * @param applicationToDelete Application to be deleted.
 * @returns Promise<Application> Deleted application object.
 */
export const destroy = (id: number, applicationToDelete: Application): Promise<Application> => {
    return Application.destroy({ where: { id } })
        .then(() => applicationToDelete)
        .catch(error => {
            throw error;
        });
};

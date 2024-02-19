import { Contact } from "../../../models/contact.model";
import { FindOptions } from 'sequelize';

/**
 * Updates an existing contact.
 * @param id Contact ID.
 * @param contact Updated contact details.
 * @returns Promise<Contact | null> Updated contact object or null if not found.
 */
export const update = async (id: number, contact: {
    name: string,
    email: string,
    linkedin: string,
    company: string
}): Promise<Contact | null> => {
    try {
        const [updatedRowsCount] = await Contact.update(contact, { where: { id } });

        if (updatedRowsCount > 0) {
            const updatedContact = await Contact.findByPk(id);
            return updatedContact;
        } else {
            return null;
        }
    } catch (error) {
        throw error;
    }
};

/**
 * Retrieves a contact based on the provided ID.
 * @param id Contact ID.
 * @returns Promise<Contact | null> Found contact object or null if not found.
 */
export const getById = async (id: number): Promise<Contact | null> => {
    try {
        const contact = await Contact.findByPk(id);
        return contact;
    } catch (error) {
        throw error;
    }
};

/**
 * Retrieves all contacts.
 * @returns Promise<Contact[]> Array of all contact objects.
 */
export const all = async (page: number, pageSize: number, where: any): Promise<{ rows: Contact[]; count: number }> => {
    const options: FindOptions<Contact> = {
      where: where
    };
  
    if (page && pageSize) {
      options.offset = (page - 1) * pageSize;
      options.limit = pageSize;
      options.order = [['id', 'ASC']];
    }
  
    const { rows } = await Contact.findAndCountAll(options);
  
    const contactCount = await Contact.count({ where });
  
  
    return { rows, count: contactCount };
  };
  
/**
 * Deletes an application from the database.
 * @param id Contact ID.
 * @param contactToDelete Contact to be deleted.
 * @returns Promise<Contact> Deleted application object.
 */
export const destroy = (id: number, contactToDelete: Contact): Promise<Contact> => {
    return Contact.destroy({ where: { id } })
        .then(() => contactToDelete)
        .catch(error => {
            throw error;
        });
};

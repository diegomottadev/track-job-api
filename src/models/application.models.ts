// application.model.ts
import { Table, Model, Column, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { Contact } from "./contact.model";

@Table({
  timestamps: true,
  paranoid: true,
  modelName: "Application",
})
export class Application extends Model {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  position!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  company!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  companyWebsite!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  linkApplication?: string;


  @Column({
    type: DataType.ENUM('Applied', 'Interview','Code Challenge', 'Technical Interview', 'Offer', 'Rejected'),
    allowNull: false,
    defaultValue: 'Applied'
  })
  status!: 'Applied' | 'Interview' | 'Code Challenge' | 'Technical Interview' | 'Offer' | 'Rejected';
  
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes?: string;
  
  @Column({
    type: DataType.DATE,
    allowNull: false,
    get() {
      const appliedDate = this.getDataValue('appliedDate');
      // Verificar si appliedDate es una instancia de Date y si no está vacío
      if (appliedDate instanceof Date && !isNaN(appliedDate.getTime())) {
        // Convertir la fecha al formato 'dd/mm/yyyy'
        return `${appliedDate.getDate()}/${appliedDate.getMonth() + 1}/${appliedDate.getFullYear()}`;
      }
      return appliedDate;
    },
  })
  appliedDate!: Date;

  @Column(DataType.DATE)
  deletedAt?: Date;


  @ForeignKey(() => Contact)
  @Column(DataType.INTEGER)
  contactId!: number; // Column to store the roleId

  @BelongsTo(() => Contact)
  contact!: Contact; // Define the association with the Role model
}

// application.model.ts
import { Table, Model, Column, DataType } from "sequelize-typescript";

@Table({
  timestamps: true,
  paranoid: true,
  modelName: "Contact",
})
export class Contact extends Model {

  
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  name?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  email?: string;


  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  linkedin?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  company?: string;

  @Column(DataType.DATE)
  deletedAt?: Date;
}

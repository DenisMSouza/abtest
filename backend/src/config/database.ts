import { Sequelize } from "sequelize";
import path from "path";

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "../../database.sqlite"),
  logging: process.env.NODE_ENV === "development" ? console.log : false,
});

export default sequelize;

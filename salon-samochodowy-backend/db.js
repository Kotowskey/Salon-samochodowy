import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize('salon_samochodowy', 'root', 'Admin', {
    host: 'localhost',
    dialect: 'mysql',
});

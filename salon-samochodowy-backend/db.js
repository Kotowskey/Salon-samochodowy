import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize('salon_samochodowy', 'klient', 'klient', {
    host: 'localhost',
    dialect: 'mysql',
});

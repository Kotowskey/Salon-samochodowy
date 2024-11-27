import { Sequelize } from 'sequelize';


export const sequelize = new Sequelize('salon_samochodowy', 'root', 'root', {
    host: 'localhost',        
    dialect: 'mysql',
    logging: false,           
});

const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to the database.');
    } catch (error) {
        console.error('Cant connect to the database:', error);
    }
};

testConnection();
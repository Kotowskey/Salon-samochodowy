import { Sequelize } from 'sequelize';

// Inicjalizacja Sequelize
const sequelize = new Sequelize('salon_samochodowy', 'root', 'Admin', {
    host: 'localhost',
    dialect: 'mysql', // lub 'sqlite', 'postgres', 'mssql'
});

// Definicja modeli
const Car = sequelize.define('Car', {
    brand: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    model: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    year: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    vin: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
    price: {
        type: Sequelize.FLOAT,
        allowNull: false,
    },
    isAvailableForRent: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
    },
});

const Salon = sequelize.define('Salon', {
    name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    location: {
        type: Sequelize.STRING,
        allowNull: false,
    },
});

const User = sequelize.define('User', {
    username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    firstName: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    lastName: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    isDealer: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },
});

// Relacje
Salon.hasMany(Car, { as: 'cars' });
Car.belongsTo(Salon);

User.belongsToMany(Car, { through: 'UserCarsBought', as: 'carsBought' });
Car.belongsToMany(User, { through: 'UserCarsBought', as: 'buyers' });

User.belongsToMany(Car, { through: 'UserCarsRented', as: 'carsRented' });
Car.belongsToMany(User, { through: 'UserCarsRented', as: 'renters' });

// Eksport modeli i instancji Sequelize
export { sequelize, Car, Salon, User };

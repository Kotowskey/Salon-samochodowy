import { Sequelize } from 'sequelize';

// Inicjalizacja Sequelize
const sequelize = new Sequelize('salon_samochodowy', 'klient', 'klient', {
    host: 'localhost',
    dialect: 'mysql', // lub 'sqlite', 'postgres', 'mssql'
});

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
}, {
    timestamps: false, // Wyłącza createdAt i updatedAt
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
}, {
    timestamps: false, // Wyłącza kolumny createdAt i updatedAt
});


// Relacje
User.belongsToMany(Car, { through: 'UserCarsBought', as: 'carsBought' });
Car.belongsToMany(User, { through: 'UserCarsBought', as: 'buyers' });

User.belongsToMany(Car, { through: 'UserCarsRented', as: 'carsRented' });
Car.belongsToMany(User, { through: 'UserCarsRented', as: 'renters' });

// Synchronizacja bazy danych
(async () => {
    await sequelize.sync({ alter: true })
        .then(() => console.log('Database synchronized'))
        .catch(err => console.error('Database synchronization error:', err));
})();

// Eksport modeli i instancji Sequelize
export { sequelize, Car, User };

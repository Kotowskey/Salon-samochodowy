import { DataTypes } from 'sequelize';
import { sequelize } from './db.js';

// Definicja modelu Car
export const Car = sequelize.define('Car', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    brand: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    model: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    vin: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    isAvailableForRent: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'Cars',
    timestamps: false,
});

// Definicja modelu Salon
export const Salon = sequelize.define('Salon', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: 'Salons',
    timestamps: false,
});

// Definicja modelu User
export const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    isDealer: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
}, {
    tableName: 'Users',
    timestamps: false,
});



//salon
Salon.hasMany(Car, {
    foreignKey: 'salonId',
    as: 'cars',
    onDelete: 'CASCADE',
});
Car.belongsTo(Salon, {
    foreignKey: 'salonId',
    as: 'salon',
});

//kupowanie
User.belongsToMany(Car, {
    through: 'CarsBought',
    foreignKey: 'userId',
    otherKey: 'carId',
    as: 'carsBought',
});
Car.belongsToMany(User, {
    through: 'CarsBought',
    foreignKey: 'carId',
    otherKey: 'userId',
    as: 'buyers',
});

//wypozyczenie
User.belongsToMany(Car, {
    through: 'CarsRented',
    foreignKey: 'userId',
    otherKey: 'carId',
    as: 'carsRented',
});
Car.belongsToMany(User, {
    through: 'CarsRented',
    foreignKey: 'carId',
    otherKey: 'userId',
    as: 'renters',
});


const syncModels = async () => {
    try {
        await sequelize.sync({ alter: true });
        console.log('Modele zostały zsynchronizowane z bazą danych.');
    } catch (error) {
        console.error('Błąd synchronizacji modeli:', error);
    }
};

syncModels();

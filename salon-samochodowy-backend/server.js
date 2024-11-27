// server.js

import express from 'express';
import bodyParser from 'body-parser';
import { sequelize, Car, Salon, User } from './models.js'; // Import modeli
import { Op } from 'sequelize';

// Inicjalizacja aplikacji Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Test połączenia z bazą danych
sequelize.authenticate()
    .then(() => {
        console.log('Połączono z bazą danych.');
    })
    .catch(err => {
        console.error('Nie udało się połączyć z bazą danych:', err);
    });

// Synchronizacja modeli (opcjonalne, jeśli nie chcesz synchronizować w models.js)
// sequelize.sync({ alter: true })
//     .then(() => {
//         console.log('Modele zsynchronizowane.');
//     })
//     .catch(err => {
//         console.error('Błąd synchronizacji:', err);
//     });

/**
 * ROUTE: GET /
 * Opis: Strona główna API
 */
app.get('/', (req, res) => {
    res.send('Witamy w API Salon Samochodowy!');
});

/**
 * ROUTE: CRUD dla modeli
 */

// ====== SALONS ======

// GET all Salons
app.get('/salons', async (req, res) => {
    try {
        const salons = await Salon.findAll({ include: ['cars'] });
        res.json(salons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET Salon by ID
app.get('/salons/:id', async (req, res) => {
    try {
        const salon = await Salon.findByPk(req.params.id, { include: ['cars'] });
        if (salon) {
            res.json(salon);
        } else {
            res.status(404).json({ error: 'Salon nie znaleziony' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// CREATE Salon
app.post('/salons', async (req, res) => {
    try {
        const { name, location } = req.body;
        const newSalon = await Salon.create({ name, location });
        res.status(201).json(newSalon);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// UPDATE Salon
app.put('/salons/:id', async (req, res) => {
    try {
        const salon = await Salon.findByPk(req.params.id);
        if (salon) {
            const { name, location } = req.body;
            await salon.update({ name, location });
            res.json(salon);
        } else {
            res.status(404).json({ error: 'Salon nie znaleziony' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE Salon
app.delete('/salons/:id', async (req, res) => {
    try {
        const salon = await Salon.findByPk(req.params.id);
        if (salon) {
            await salon.destroy();
            res.json({ message: 'Salon usunięty' });
        } else {
            res.status(404).json({ error: 'Salon nie znaleziony' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ====== CARS ======

// GET all Cars
app.get('/cars', async (req, res) => {
    try {
        const cars = await Car.findAll({ include: ['salon', 'buyers', 'renters'] });
        res.json(cars);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET Car by ID
app.get('/cars/:id', async (req, res) => {
    try {
        const car = await Car.findByPk(req.params.id, { include: ['salon', 'buyers', 'renters'] });
        if (car) {
            res.json(car);
        } else {
            res.status(404).json({ error: 'Samochód nie znaleziony' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// CREATE Car
app.post('/cars', async (req, res) => {
    try {
        const { brand, model, year, vin, price, isAvailableForRent, salonId } = req.body;
        const newCar = await Car.create({ brand, model, year, vin, price, isAvailableForRent, salonId });
        res.status(201).json(newCar);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// UPDATE Car
app.put('/cars/:id', async (req, res) => {
    try {
        const car = await Car.findByPk(req.params.id);
        if (car) {
            const { brand, model, year, vin, price, isAvailableForRent, salonId } = req.body;
            await car.update({ brand, model, year, vin, price, isAvailableForRent, salonId });
            res.json(car);
        } else {
            res.status(404).json({ error: 'Samochód nie znaleziony' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE Car
app.delete('/cars/:id', async (req, res) => {
    try {
        const car = await Car.findByPk(req.params.id);
        if (car) {
            await car.destroy();
            res.json({ message: 'Samochód usunięty' });
        } else {
            res.status(404).json({ error: 'Samochód nie znaleziony' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ====== USERS ======

// GET all Users
app.get('/users', async (req, res) => {
    try {
        const users = await User.findAll({ include: ['carsBought', 'carsRented'] });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET User by ID
app.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, { include: ['carsBought', 'carsRented'] });
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ error: 'Użytkownik nie znaleziony' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// CREATE User
app.post('/users', async (req, res) => {
    try {
        const { username, password, firstName, lastName, isDealer } = req.body;
        const newUser = await User.create({ username, password, firstName, lastName, isDealer });
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// UPDATE User
app.put('/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (user) {
            const { username, password, firstName, lastName, isDealer } = req.body;
            await user.update({ username, password, firstName, lastName, isDealer });
            res.json(user);
        } else {
            res.status(404).json({ error: 'Użytkownik nie znaleziony' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE User
app.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (user) {
            await user.destroy();
            res.json({ message: 'Użytkownik usunięty' });
        } else {
            res.status(404).json({ error: 'Użytkownik nie znaleziony' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ====== RELACJE: KUPNO I WYPOŻYCZENIE SAMOCHODU ======

// KUPNO SAMOCHODU PRZEZ UŻYTKOWNIKA
app.post('/users/:userId/buy/:carId', async (req, res) => {
    try {
        const { userId, carId } = req.params;
        const user = await User.findByPk(userId);
        const car = await Car.findByPk(carId);

        if (!user || !car) {
            return res.status(404).json({ error: 'Użytkownik lub samochód nie znaleziony' });
        }

        await user.addCarsBought(car);
        res.json({ message: `Użytkownik ${userId} kupił samochód ${carId}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// WYPOŻYCZENIE SAMOCHODU PRZEZ UŻYTKOWNIKA
app.post('/users/:userId/rent/:carId', async (req, res) => {
    try {
        const { userId, carId } = req.params;
        const user = await User.findByPk(userId);
        const car = await Car.findByPk(carId);

        if (!user || !car) {
            return res.status(404).json({ error: 'Użytkownik lub samochód nie znaleziony' });
        }

        if (!car.isAvailableForRent) {
            return res.status(400).json({ error: 'Samochód nie jest dostępny do wypożyczenia' });
        }

        await user.addCarsRented(car);
        // Aktualizacja statusu dostępności samochodu
        await car.update({ isAvailableForRent: false });

        res.json({ message: `Użytkownik ${userId} wypożyczył samochód ${carId}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ZWROT WYPOŻYCZONEGO SAMOCHODU PRZEZ UŻYTKOWNIKA
app.post('/users/:userId/return/:carId', async (req, res) => {
    try {
        const { userId, carId } = req.params;
        const user = await User.findByPk(userId);
        const car = await Car.findByPk(carId);

        if (!user || !car) {
            return res.status(404).json({ error: 'Użytkownik lub samochód nie znaleziony' });
        }

        await user.removeCarsRented(car);
        // Aktualizacja statusu dostępności samochodu
        await car.update({ isAvailableForRent: true });

        res.json({ message: `Użytkownik ${userId} zwrócił samochód ${carId}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ====== WYSZUKIWANIE SAMOCHODÓW ======

// Przykład: Wyszukiwanie samochodów po marce i roku
app.get('/search/cars', async (req, res) => {
    try {
        const { brand, year, priceMin, priceMax } = req.query;
        const whereClause = {};

        if (brand) {
            whereClause.brand = { [Op.like]: `%${brand}%` };
        }

        if (year) {
            whereClause.year = year;
        }

        if (priceMin && priceMax) {
            whereClause.price = { [Op.between]: [priceMin, priceMax] };
        } else if (priceMin) {
            whereClause.price = { [Op.gte]: priceMin };
        } else if (priceMax) {
            whereClause.price = { [Op.lte]: priceMax };
        }

        const cars = await Car.findAll({ where: whereClause, include: ['salon'] });
        res.json(cars);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ====== AUTORYZACJA I AUTENTYKACJA (PODSTAWOWE) ======

// UWAGA: W prawdziwej aplikacji należy użyć bezpieczniejszych metod przechowywania haseł, np. haszowania z bcrypt.

import jwt from 'jsonwebtoken';

// Sekret do JWT (w prawdziwej aplikacji przechowuj go w zmiennych środowiskowych)
const JWT_SECRET = 'tajny_klucz_jwt';

// LOGOWANIE
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username } });

        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });
        }

        // Tworzenie tokenu JWT
        const token = jwt.sign({ userId: user.id, isDealer: user.isDealer }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// MIDDLEWARE DO WERYFIKACJI TOKENU JWT
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const [type, token] = authHeader.split(' ');

        if (type === 'Bearer' && token) {
            jwt.verify(token, JWT_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(403).json({ error: 'Nieprawidłowy token' });
                }
                req.user = decoded;
                next();
            });
        } else {
            res.status(401).json({ error: 'Nieprawidłowy format nagłówka autoryzacji' });
        }
    } else {
        res.status(401).json({ error: 'Brak nagłówka autoryzacji' });
    }
};

// PRZYKŁADOWA OCHRONA ROUTE
app.get('/protected', authenticate, (req, res) => {
    res.json({ message: `Witaj użytkowniku ${req.user.userId}, dealer: ${req.user.isDealer}` });
});

// ====== START SERWERA ======
app.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
});

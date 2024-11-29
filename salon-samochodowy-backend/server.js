// server.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors'; 
import { sequelize, Car, User } from './models.js'; 
import { Op } from 'sequelize';

// Inicjalizacja aplikacji Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Konfiguracja CORS
app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// Test połączenia z bazą danych
sequelize.authenticate()
    .then(() => {
        console.log('Połączono z bazą danych.');
    })
    .catch(err => {
        console.error('Nie udało się połączyć z bazą danych:', err);
    });

// ROUTE: Strona główna API
app.get('/', (req, res) => {
    res.send('Witamy w API Zarządzanie Samochodami!');
});

// ====== CARS ======

// GET all Cars
app.get('/cars', async (req, res) => {
    try {
        const cars = await Car.findAll();
        res.json(cars);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET Car by ID
app.get('/cars/:id', async (req, res) => {
    try {
        const car = await Car.findByPk(req.params.id);
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
        const { brand, model, year, vin, price, isAvailableForRent } = req.body;
        const newCar = await Car.create({ brand, model, year, vin, price, isAvailableForRent });
        res.status(201).json(newCar);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// UPDATE Car
app.put('/cars/:id', async (req, res) => {
    try {
        const { brand, model, year, vin, price, isAvailableForRent } = req.body;
        const car = await Car.findByPk(req.params.id);
        if (car) {
            await car.update({ brand, model, year, vin, price, isAvailableForRent });
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

// GET all Users (klientów)
app.get('/users', async (req, res) => {
    try {
        const users = await User.findAll({
            where: { isDealer: false } // Klienci mają isDealer: false
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET User by ID
app.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (user && !user.isDealer) {
            res.json(user);
        } else {
            res.status(404).json({ error: 'Klient nie znaleziony' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// CREATE User (klient)
app.post('/users', async (req, res) => {
    try {
        const { username, password, firstName, lastName } = req.body;
        const newUser = await User.create({ 
            username, 
            password, 
            firstName, 
            lastName,
            isDealer: false // Upewniamy się, że tworzymy klienta, a nie dealera
        });
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// UPDATE User (klient)
app.put('/users/:id', async (req, res) => {
    try {
        const { username, password, firstName, lastName } = req.body;
        const user = await User.findByPk(req.params.id);
        if (user && !user.isDealer) {
            await user.update({ username, password, firstName, lastName });
            res.json(user);
        } else {
            res.status(404).json({ error: 'Klient nie znaleziony' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE User (klient)
app.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (user && !user.isDealer) {
            await user.destroy();
            res.json({ message: 'Klient usunięty' });
        } else {
            res.status(404).json({ error: 'Klient nie znaleziony' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// RENT Car
app.post('/cars/:id/rent', async (req, res) => {
    try {
        const carId = req.params.id;
        const { userId } = req.body; // Zakładamy, że użytkownik przesyła swoje ID w treści żądania.

        // Znajdź samochód po ID
        const car = await Car.findByPk(carId);

        if (!car) {
            return res.status(404).json({ error: 'Samochód nie znaleziony' });
        }

        if (!car.isAvailableForRent) {
            return res.status(400).json({ error: 'Samochód jest już wynajęty' });
        }

        // Znajdź użytkownika po ID
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
        }

        // Wynajem samochodu
        car.isAvailableForRent = false;
        car.renterId = user.id; // Przypisujemy ID użytkownika jako wynajmującego

        await car.save();

        res.status(200).json({ message: 'Samochód został wynajęty', car });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// RETURN Car
app.post('/cars/:id/return', async (req, res) => {
    try {
        const carId = req.params.id;
        const { userId } = req.body; // Zakładamy, że użytkownik przesyła swoje ID w treści żądania.

        // Znajdź samochód po ID
        const car = await Car.findByPk(carId);

        if (!car) {
            return res.status(404).json({ error: 'Samochód nie znaleziony' });
        }

        if (car.isAvailableForRent) {
            return res.status(400).json({ error: 'Samochód już jest dostępny' });
        }

        if (car.renterId !== userId) {
            return res.status(403).json({ error: 'Nie możesz zwrócić tego samochodu, ponieważ nie jesteś jego wynajmującym' });
        }

        // Zwrócenie samochodu
        car.isAvailableForRent = true;
        car.renterId = null; // Usuwamy powiązanie z wynajmującym

        await car.save();

        res.status(200).json({ message: 'Samochód został zwrócony', car });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// BUY Car
app.post('/cars/:id/buy', async (req, res) => {
    try {
        const carId = req.params.id;
        const { userId } = req.body; // Zakładamy, że użytkownik przesyła swoje ID w treści żądania.

        // Znajdź samochód po ID
        const car = await Car.findByPk(carId);

        if (!car) {
            return res.status(404).json({ error: 'Samochód nie znaleziony' });
        }

        if (!car.isAvailableForRent) {
            return res.status(400).json({ error: 'Samochód jest już sprzedany lub wynajęty' });
        }

        // Znajdź użytkownika po ID
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
        }

        // Kupno samochodu
        car.isAvailableForRent = false; // Samochód jest teraz niedostępny do wynajmu
        car.ownerId = user.id; // Przypisujemy właściciela

        await car.save();

        res.status(200).json({ message: 'Samochód został kupiony', car });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



// ====== START SERWERA ======
app.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
});

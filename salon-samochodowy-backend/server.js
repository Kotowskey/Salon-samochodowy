// server.js

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors'; // Import pakietu cors
import { sequelize, Car } from './models.js'; // Import tylko modelu Car
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

// ====== START SERWERA ======
app.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
});

// server.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors'; 
import session from 'express-session'; // Import express-session
import { sequelize, Car, User } from './models.js'; 
import { Op } from 'sequelize';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Konfiguracja CORS
app.use(cors({
  origin: 'http://localhost:4200', // Zmień na adres Twojej aplikacji frontendowej
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, // Pozwól na przesyłanie ciasteczek
}));

// Konfiguracja sesji
app.use(session({
    secret: 'TwojSuperTajnyKlucz', // Powinno być przechowywane w zmiennych środowiskowych
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Ustaw na true, jeśli używasz HTTPS
        httpOnly: true, // Zapobiega dostępowi do ciasteczka z poziomu JavaScript
        maxAge: 1000 * 60 * 60 // Sesja ważna przez 1 godzinę
    }
}));

// Middleware do ochrony tras
const authenticateSession = (req, res, next) => {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Nieautoryzowany' });
    }
};

// Test połączenia z bazą danych
sequelize.authenticate()
    .then(() => {
        console.log('Połączono z bazą danych.');
    })
    .catch(err => {
        console.error('Nie udało się połączyć z bazą danych:', err);
    });

/**
 * @api {get} / Strona główna API
 * @apiName GetHome
 * @apiGroup General
 *
 * @apiSuccess {String} message Witamy w API Zarządzanie Samochodami!
 */
app.get('/', (req, res) => {
    res.send('Witamy w API Zarządzanie Samochodami!');
});

/**
 * @api {post} /register Rejestracja nowego użytkownika
 * @apiName RegisterUser
 * @apiGroup Authentication
 *
 * @apiParam {String} username Nazwa użytkownika
 * @apiParam {String} password Hasło użytkownika
 * @apiParam {String} firstName Imię użytkownika
 * @apiParam {String} lastName Nazwisko użytkownika
 *
 * @apiSuccess (201) {String} message Informacja o sukcesie rejestracji
 * @apiSuccess {Object} user Informacje o zarejestrowanym użytkowniku
 * @apiSuccess {Number} user.id ID użytkownika
 * @apiSuccess {String} user.username Nazwa użytkownika
 * @apiSuccess {String} user.firstName Imię
 * @apiSuccess {String} user.lastName Nazwisko
 *
 * @apiError (400) {String} error Nazwa użytkownika jest już zajęta
 * @apiError (500) {String} error Opis błędu serwera
 */
app.post('/register', async (req, res) => {
    try {
        const { username, password, firstName, lastName } = req.body;

        // Sprawdzenie, czy użytkownik już istnieje
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: 'Nazwa użytkownika jest już zajęta' });
        }

        // Tworzenie nowego użytkownika (bez haszowania hasła)
        const newUser = await User.create({ 
            username, 
            password, 
            firstName, 
            lastName,
            isDealer: false // Upewniamy się, że tworzymy klienta, a nie dealera
        });

        // Inicjalizacja sesji
        req.session.userId = newUser.id;
        req.session.username = newUser.username;

        res.status(201).json({ 
            message: 'Rejestracja udana', 
            user: { 
                id: newUser.id, 
                username: newUser.username, 
                firstName: newUser.firstName, 
                lastName: newUser.lastName 
            } 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @api {post} /login Logowanie użytkownika
 * @apiName LoginUser
 * @apiGroup Authentication
 *
 * @apiParam {String} username Nazwa użytkownika
 * @apiParam {String} password Hasło użytkownika
 *
 * @apiSuccess {String} message Informacja o sukcesie logowania
 * @apiSuccess {Object} user Informacje o zalogowanym użytkowniku
 * @apiSuccess {Number} user.id ID użytkownika
 * @apiSuccess {String} user.username Nazwa użytkownika
 * @apiSuccess {String} user.firstName Imię
 * @apiSuccess {String} user.lastName Nazwisko
 * @apiSuccess {Boolean} user.isDealer Status dealera
 *
 * @apiError (400) {String} error Nieprawidłowa nazwa użytkownika lub hasło
 * @apiError (500) {String} error Opis błędu serwera
 */
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Znajdź użytkownika po nazwie użytkownika
        const user = await User.findOne({ where: { username } });

        if (!user) {
            return res.status(400).json({ error: 'Nieprawidłowa nazwa użytkownika lub hasło' });
        }

        // Sprawdź hasło (bez haszowania)
        if (user.password !== password) {
            return res.status(400).json({ error: 'Nieprawidłowa nazwa użytkownika lub hasło' });
        }

        // Inicjalizacja sesji
        req.session.userId = user.id;
        req.session.username = user.username;

        res.status(200).json({ 
            message: 'Logowanie udane', 
            user: { 
                id: user.id, 
                username: user.username, 
                firstName: user.firstName, 
                lastName: user.lastName,
                isDealer: user.isDealer
            } 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @api {post} /logout Wylogowanie użytkownika
 * @apiName LogoutUser
 * @apiGroup Authentication
 *
 * @apiSuccess {String} message Informacja o sukcesie wylogowania
 *
 * @apiError (400) {String} error Brak aktywnej sesji
 * @apiError (500) {String} error Nie udało się wylogować
 */
app.post('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ error: 'Nie udało się wylogować' });
            } else {
                res.status(200).json({ message: 'Wylogowano pomyślnie' });
            }
        });
    } else {
        res.status(400).json({ error: 'Brak aktywnej sesji' });
    }
});

/**
 * @api {get} /cars Pobierz wszystkie samochody
 * @apiName GetAllCars
 * @apiGroup Cars
 *
 * @apiSuccess {Object[]} cars Lista samochodów
 *
 * @apiError (500) {String} error Opis błędu serwera
 */
app.get('/cars', async (req, res) => {
    try {
        const cars = await Car.findAll();
        res.json(cars);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @api {get} /cars/:id Pobierz samochód po ID
 * @apiName GetCarById
 * @apiGroup Cars
 *
 * @apiParam {Number} id ID samochodu
 *
 * @apiSuccess {Object} car Informacje o samochodzie
 *
 * @apiError (404) {String} error Samochód nie znaleziony
 * @apiError (500) {String} error Opis błędu serwera
 */
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

/**
 * @api {post} /cars Dodaj nowy samochód
 * @apiName CreateCar
 * @apiGroup Cars
 * @apiPermission authenticated
 *
 * @apiHeader {String} Cookie Sesja użytkownika
 *
 * @apiParam {String} brand Marka samochodu
 * @apiParam {String} model Model samochodu
 * @apiParam {Number} year Rok produkcji
 * @apiParam {String} vin Numer VIN
 * @apiParam {Number} price Cena samochodu
 * @apiParam {Number} horsePower Moc silnika
 * @apiParam {Boolean} isAvailableForRent Status dostępności do wynajmu
 *
 * @apiSuccess (201) {Object} newCar Informacje o nowym samochodzie
 *
 * @apiError (401) {String} error Nieautoryzowany
 * @apiError (500) {String} error Opis błędu serwera
 */
app.post('/cars', authenticateSession, async (req, res) => {
    try {
        const { brand, model, year, vin, price, horsePower, isAvailableForRent } = req.body;
        const newCar = await Car.create({ 
            brand, 
            model, 
            year, 
            vin, 
            price,
            horsePower, 
            isAvailableForRent
        });
        res.status(201).json(newCar);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @api {put} /cars/:id Aktualizuj informacje o samochodzie
 * @apiName UpdateCar
 * @apiGroup Cars
 * @apiPermission authenticated
 *
 * @apiHeader {String} Cookie Sesja użytkownika
 *
 * @apiParam {Number} id ID samochodu
 * @apiParam {String} brand Marka samochodu
 * @apiParam {String} model Model samochodu
 * @apiParam {Number} year Rok produkcji
 * @apiParam {String} vin Numer VIN
 * @apiParam {Number} price Cena samochodu
 * @apiParam {Number} horsePower Moc silnika
 * @apiParam {Boolean} isAvailableForRent Status dostępności do wynajmu
 *
 * @apiSuccess {Object} car Zaktualizowane informacje o samochodzie
 *
 * @apiError (401) {String} error Nieautoryzowany
 * @apiError (404) {String} error Samochód nie znaleziony
 * @apiError (500) {String} error Opis błędu serwera
 */
app.put('/cars/:id', authenticateSession, async (req, res) => {
    try {
        const { brand, model, year, vin, price, horsePower, isAvailableForRent } = req.body;
        const car = await Car.findByPk(req.params.id);
        if (car) {
            await car.update({ brand, model, year, vin, price, horsePower, isAvailableForRent });
            res.json(car);
        } else {
            res.status(404).json({ error: 'Samochód nie znaleziony' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @api {delete} /cars/:id Usuń samochód
 * @apiName DeleteCar
 * @apiGroup Cars
 * @apiPermission authenticated, dealer
 *
 * @apiHeader {String} Cookie Sesja użytkownika
 *
 * @apiParam {Number} id ID samochodu
 *
 * @apiSuccess {String} message Informacja o sukcesie usunięcia
 *
 * @apiError (401) {String} error Nieautoryzowany
 * @apiError (403) {String} error Brak uprawnień do usuwania samochodów
 * @apiError (500) {String} error Opis błędu serwera
 */
app.delete('/cars/:id', authenticateSession, async (req, res) => {
    const userId = req.session.userId;
    const carId = req.params.id;
  
    try {
        // Sprawdź, czy użytkownik jest dealerem
        const user = await User.findByPk(userId);
        if (!user || !user.isDealer) {
            return res.status(403).json({ error: 'Brak uprawnień do usuwania samochodów' });
        }
  
        // Usuń samochód
        const deleted = await Car.destroy({ where: { id: carId } });
        if (deleted) {
            res.status(200).json({ message: 'Samochód usunięty.' });
        } else {
            res.status(404).json({ error: 'Samochód nie znaleziony' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @api {get} /users Pobierz wszystkich klientów
 * @apiName GetAllUsers
 * @apiGroup Users
 * @apiPermission authenticated
 *
 * @apiHeader {String} Cookie Sesja użytkownika
 *
 * @apiSuccess {Object[]} users Lista klientów
 *
 * @apiError (401) {String} error Nieautoryzowany
 * @apiError (500) {String} error Opis błędu serwera
 */
app.get('/users', authenticateSession, async (req, res) => {
    try {
        const users = await User.findAll({
            where: { isDealer: false } // Klienci mają isDealer: false
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @api {get} /users/:id Pobierz klienta po ID
 * @apiName GetUserById
 * @apiGroup Users
 * @apiPermission authenticated
 *
 * @apiHeader {String} Cookie Sesja użytkownika
 *
 * @apiParam {Number} id ID użytkownika
 *
 * @apiSuccess {Object} user Informacje o kliencie
 *
 * @apiError (401) {String} error Nieautoryzowany
 * @apiError (404) {String} error Klient nie znaleziony
 * @apiError (500) {String} error Opis błędu serwera
 */
app.get('/users/:id', authenticateSession, async (req, res) => {
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

/**
 * @api {put} /users/:id Aktualizuj informacje o kliencie
 * @apiName UpdateUser
 * @apiGroup Users
 * @apiPermission authenticated, self
 *
 * @apiHeader {String} Cookie Sesja użytkownika
 *
 * @apiParam {Number} id ID użytkownika
 * @apiParam {String} username Nazwa użytkownika
 * @apiParam {String} password Hasło użytkownika
 * @apiParam {String} firstName Imię użytkownika
 * @apiParam {String} lastName Nazwisko użytkownika
 *
 * @apiSuccess {Object} user Zaktualizowane informacje o kliencie
 *
 * @apiError (401) {String} error Nieautoryzowany
 * @apiError (403) {String} error Nie masz uprawnień do edycji tego użytkownika
 * @apiError (404) {String} error Klient nie znaleziony
 * @apiError (500) {String} error Opis błędu serwera
 */
app.put('/users/:id', authenticateSession, async (req, res) => {
    try {
        const { username, password, firstName, lastName } = req.body;
        const user = await User.findByPk(req.params.id);
        if (user && !user.isDealer) {
            // Opcjonalnie: Możesz dodać logikę, aby użytkownik mógł edytować tylko swoje własne dane
            if (user.id !== req.session.userId) {
                return res.status(403).json({ error: 'Nie masz uprawnień do edycji tego użytkownika' });
            }

            await user.update({ username, password, firstName, lastName });
            res.json(user);
        } else {
            res.status(404).json({ error: 'Klient nie znaleziony' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @api {delete} /users/:id Usuń klienta
 * @apiName DeleteUser
 * @apiGroup Users
 * @apiPermission authenticated, self
 *
 * @apiHeader {String} Cookie Sesja użytkownika
 *
 * @apiParam {Number} id ID użytkownika
 *
 * @apiSuccess {String} message Informacja o sukcesie usunięcia
 *
 * @apiError (401) {String} error Nieautoryzowany
 * @apiError (403) {String} error Nie masz uprawnień do usunięcia tego użytkownika
 * @apiError (404) {String} error Klient nie znaleziony
 * @apiError (500) {String} error Opis błędu serwera
 */
app.delete('/users/:id', authenticateSession, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (user && !user.isDealer) {
            // Opcjonalnie: Użytkownik może usunąć tylko swoje konto
            if (user.id !== req.session.userId) {
                return res.status(403).json({ error: 'Nie masz uprawnień do usunięcia tego użytkownika' });
            }

            await user.destroy();
            res.json({ message: 'Klient usunięty' });
        } else {
            res.status(404).json({ error: 'Klient nie znaleziony' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @api {post} /cars/:id/rent Wypożycz samochód
 * @apiName RentCar
 * @apiGroup Cars
 * @apiPermission authenticated
 *
 * @apiHeader {String} Cookie Sesja użytkownika
 *
 * @apiParam {Number} id ID samochodu
 *
 * @apiSuccess {String} message Informacja o sukcesie wypożyczenia
 * @apiSuccess {Object} car Zaktualizowane informacje o samochodzie
 *
 * @apiError (400) {String} error Samochód jest już wynajęty
 * @apiError (403) {String} error Nieautoryzowany dostęp do zwrotu samochodu
 * @apiError (404) {String} error Samochód nie znaleziony
 * @apiError (500) {String} error Opis błędu serwera
 */
app.post('/cars/:id/rent', authenticateSession, async (req, res) => {
    try {
        const carId = req.params.id;

        // Znajdź samochód po ID
        const car = await Car.findByPk(carId);

        if (!car) {
            return res.status(404).json({ error: 'Samochód nie znaleziony' });
        }

        if (!car.isAvailableForRent) {
            return res.status(400).json({ error: 'Samochód jest już wynajęty' });
        }

        // Wynajem samochodu
        car.isAvailableForRent = false;
        car.renterId = req.session.userId; // Przypisujemy ID użytkownika jako wynajmującego

        await car.save();

        res.status(200).json({ message: 'Samochód został wynajęty', car });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @api {post} /cars/:id/return Zwrot samochodu
 * @apiName ReturnCar
 * @apiGroup Cars
 * @apiPermission authenticated, renter
 *
 * @apiHeader {String} Cookie Sesja użytkownika
 *
 * @apiParam {Number} id ID samochodu
 *
 * @apiSuccess {String} message Informacja o sukcesie zwrotu
 * @apiSuccess {Object} car Zaktualizowane informacje o samochodzie
 *
 * @apiError (400) {String} error Samochód już jest dostępny
 * @apiError (403) {String} error Nie możesz zwrócić tego samochodu, ponieważ nie jesteś jego wynajmującym
 * @apiError (404) {String} error Samochód nie znaleziony
 * @apiError (500) {String} error Opis błędu serwera
 */
app.post('/cars/:id/return', authenticateSession, async (req, res) => {
    try {
        const carId = req.params.id;

        // Znajdź samochód po ID
        const car = await Car.findByPk(carId);

        if (!car) {
            return res.status(404).json({ error: 'Samochód nie znaleziony' });
        }

        if (car.isAvailableForRent) {
            return res.status(400).json({ error: 'Samochód już jest dostępny' });
        }

        if (car.renterId !== req.session.userId) {
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

/**
 * @api {get} /cars/:id/renter Pobierz wynajmującego samochód
 * @apiName GetCarRenter
 * @apiGroup Cars
 * @apiPermission none
 *
 * @apiParam {Number} id ID samochodu
 *
 * @apiSuccess {Number} carId ID samochodu
 * @apiSuccess {Number} renterId ID wynajmującego
 *
 * @apiError (404) {String} error Samochód nie znaleziony
 * @apiError (500) {String} error Opis błędu serwera
 */
app.get('/cars/:id/renter', async (req, res) => {
    const carId = req.params.id; // ID samochodu z parametru URL
    try {
        // Znajdź samochód na podstawie ID
        const car = await Car.findByPk(carId);

        if (car) {
            res.json({ carId: car.id, renterId: car.renterId });
        } else {
            res.status(404).json({ error: 'Samochód nie znaleziony' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @api {post} /cars/:id/buy Kupno samochodu
 * @apiName BuyCar
 * @apiGroup Cars
 * @apiPermission authenticated
 *
 * @apiHeader {String} Cookie Sesja użytkownika
 *
 * @apiParam {Number} id ID samochodu
 *
 * @apiSuccess {String} message Informacja o sukcesie kupna
 * @apiSuccess {Object} car Zaktualizowane informacje o samochodzie
 *
 * @apiError (400) {String} error Wpłata wstępna nie może być większa niż cena samochodu
 * @apiError (404) {String} error Samochód nie znaleziony
 * @apiError (500) {String} error Opis błędu serwera
 */
app.post('/cars/:id/buy', authenticateSession, async (req, res) => {
    try {
        const carId = req.params.id;

        // Znajdź samochód po ID
        const car = await Car.findByPk(carId);

        if (!car) {
            return res.status(404).json({ error: 'Samochód nie znaleziony' });
        }

        if (!car.isAvailableForRent) {
            return res.status(400).json({ error: 'Samochód jest już sprzedany lub wynajęty' });
        }

        // Kupno samochodu
        car.isAvailableForRent = false; // Samochód jest teraz niedostępny do wynajmu
        car.ownerId = req.session.userId; // Przypisujemy właściciela

        await car.save();

        res.status(200).json({ message: 'Samochód został kupiony', car });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @api {get} /current-user Pobierz aktualnie zalogowanego użytkownika
 * @apiName GetCurrentUser
 * @apiGroup Users
 * @apiPermission authenticated
 *
 * @apiHeader {String} Cookie Sesja użytkownika
 *
 * @apiSuccess {Object} user Informacje o aktualnie zalogowanym użytkowniku
 *
 * @apiError (401) {String} error Nieautoryzowany
 * @apiError (404) {String} error Użytkownik nie znaleziony
 * @apiError (500) {String} error Opis błędu serwera
 */
app.get('/current-user', authenticateSession, async (req, res) => {
    try {
        const user = await User.findByPk(req.session.userId, {
            attributes: ['id', 'username', 'firstName', 'lastName', 'isDealer']
        });
        if (user) {
            res.json({ user });
        } else {
            res.status(404).json({ error: 'Użytkownik nie znaleziony' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @api {post} /cars/:id/leasing Leasing samochodu
 * @apiName LeaseCar
 * @apiGroup Cars
 * @apiPermission none
 *
 * @apiParam {Number} id ID samochodu
 * @apiParam {Number} downPayment Wpłata wstępna
 * @apiParam {Number} months Liczba miesięcy
 *
 * @apiSuccess {Number} carId ID samochodu
 * @apiSuccess {String} carBrand Marka samochodu
 * @apiSuccess {String} carModel Model samochodu
 * @apiSuccess {Number} totalPrice Cena samochodu
 * @apiSuccess {Number} downPayment Wpłata wstępna
 * @apiSuccess {Number} remainingAmount Pozostała kwota do spłaty
 * @apiSuccess {Number} months Liczba miesięcy
 * @apiSuccess {Number} monthlyRate Miesięczna rata
 *
 * @apiError (400) {String} error Nieprawidłowe dane wejściowe
 * @apiError (404) {String} error Samochód nie znaleziony
 * @apiError (500) {String} error Opis błędu serwera
 */
app.post('/cars/:id/leasing', async (req, res) => {
    try {
        const carId = req.params.id;
        const { downPayment, months } = req.body;

        if (!downPayment || !months || months <= 0 || downPayment < 0) {
            return res.status(400).json({ error: 'Nieprawidłowe dane wejściowe' });
        }

        const car = await Car.findByPk(carId);

        if (!car) {
            return res.status(404).json({ error: 'Samochód nie znaleziony' });
        }

        const remainingAmount = car.price - downPayment;

        if (remainingAmount < 0) {
            return res.status(400).json({ error: 'Wpłata wstępna nie może być większa niż cena samochodu' });
        }

        const monthlyRate = remainingAmount / months;

        res.status(200).json({
            carId: car.id,
            carBrand: car.brand,
            carModel: car.model,
            totalPrice: car.price,
            downPayment: downPayment,
            remainingAmount: remainingAmount.toFixed(2),
            months: months,
            monthlyRate: monthlyRate.toFixed(2),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @api {post} /admin/create-customer Tworzenie nowego klienta przez dealera
 * @apiName CreateCustomer
 * @apiGroup Admin
 * @apiPermission authenticated, dealer
 *
 * @apiHeader {String} Cookie Sesja użytkownika
 *
 * @apiParam {String} username Nazwa użytkownika
 * @apiParam {String} password Hasło użytkownika
 * @apiParam {String} firstName Imię użytkownika
 * @apiParam {String} lastName Nazwisko użytkownika
 *
 * @apiSuccess (201) {String} message Informacja o sukcesie dodania klienta
 * @apiSuccess {Object} user Informacje o nowym kliencie
 * @apiSuccess {Number} user.id ID użytkownika
 * @apiSuccess {String} user.username Nazwa użytkownika
 * @apiSuccess {String} user.firstName Imię
 * @apiSuccess {String} user.lastName Nazwisko
 * @apiSuccess {Boolean} user.isDealer Status dealera
 *
 * @apiError (400) {String} error Nazwa użytkownika jest już zajęta
 * @apiError (403) {String} error Brak uprawnień do tworzenia klientów
 * @apiError (500) {String} error Opis błędu serwera
 */
app.post('/admin/create-customer', authenticateSession, async (req, res) => {
    try {
        const { username, password, firstName, lastName } = req.body;

        // Sprawdzenie, czy aktualny użytkownik jest dealerem
        const dealer = await User.findByPk(req.session.userId);
        if (!dealer || !dealer.isDealer) {
            return res.status(403).json({ error: 'Brak uprawnień do tworzenia klientów' });
        }

        // Sprawdzenie, czy użytkownik już istnieje
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: 'Nazwa użytkownika jest już zajęta' });
        }

        // Tworzenie nowego klienta bez haszowania hasła
        const newUser = await User.create({ 
            username, 
            password, 
            firstName, 
            lastName,
            isDealer: false // Upewniamy się, że tworzymy klienta, a nie dealera
        });

        res.status(201).json({ 
            message: 'Klient został pomyślnie dodany', 
            user: { 
                id: newUser.id, 
                username: newUser.username, 
                firstName: newUser.firstName, 
                lastName: newUser.lastName,
                isDealer: newUser.isDealer
            } 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ====== START SERWERA ======
app.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
});

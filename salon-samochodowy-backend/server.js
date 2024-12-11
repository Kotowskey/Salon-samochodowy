import express from 'express';
// import bodyParser from 'body-parser'; // Nie jest już potrzebny
import cors from 'cors';
import session from 'express-session';
import { sequelize, Car, User } from './models.js';
import { body, validationResult, param, query } from 'express-validator'; // Import express-validator

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // Zamiast bodyParser.json()

// Konfiguracja CORS
app.use(cors({
  origin: 'http://localhost:4200', // Zmień na adres Twojej aplikacji frontendowej
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, // Pozwól na przesyłanie ciasteczek
}));

// Konfiguracja sesji
app.use(session({
    secret: process.env.SESSION_SECRET || 'TwojSuperTajnyKlucz', // Powinno być przechowywane w zmiennych środowiskowych
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // Ustaw na true w produkcji
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

// Middleware do obsługi walidacji
const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }
        
        res.status(400).json({ errors: errors.array() });
    };
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
 */
app.post('/register', validate([
    body('username')
        .isLength({ min: 3 }).withMessage('Nazwa użytkownika musi mieć przynajmniej 3 znaki')
        .trim()
        .escape(),
    body('password')
        .isLength({ min: 6 }).withMessage('Hasło musi mieć przynajmniej 6 znaków')
        .trim(),
    body('firstName')
        .notEmpty().withMessage('Imię jest wymagane')
        .trim()
        .escape(),
    body('lastName')
        .notEmpty().withMessage('Nazwisko jest wymagane')
        .trim()
        .escape()
]), async (req, res) => {
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
 */
app.post('/login', validate([
    body('username')
        .notEmpty().withMessage('Nazwa użytkownika jest wymagana')
        .trim()
        .escape(),
    body('password')
        .notEmpty().withMessage('Hasło jest wymagane')
]), async (req, res) => {
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
 */
app.get('/cars', validate([
    query('page').optional().isInt({ min: 1 }).withMessage('Strona musi być liczbą całkowitą większą lub równą 1'),
    query('limit').optional().isInt({ min: 1 }).withMessage('Limit musi być liczbą całkowitą większą lub równą 1')
]), async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const cars = await Car.findAndCountAll({
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        res.json({
            totalItems: cars.count,
            totalPages: Math.ceil(cars.count / limit),
            currentPage: parseInt(page),
            data: cars.rows
        });
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
 */
app.get('/cars/:id', validate([
    param('id')
        .isInt({ min: 1 }).withMessage('ID samochodu musi być liczbą całkowitą większą lub równą 1')
]), async (req, res) => {
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
 */
app.post('/cars', authenticateSession, validate([
    body('brand')
        .notEmpty().withMessage('Marka samochodu jest wymagana')
        .trim()
        .escape(),
    body('model')
        .notEmpty().withMessage('Model samochodu jest wymagany')
        .trim()
        .escape(),
    body('year')
        .isInt({ min: 1886 }).withMessage('Rok produkcji musi być poprawną liczbą całkowitą')
        .toInt(),
    body('vin')
        .isLength({ min: 17, max: 17 }).withMessage('Numer VIN musi mieć dokładnie 17 znaków')
        .trim()
        .escape(),
    body('price')
        .isFloat({ min: 0 }).withMessage('Cena samochodu musi być liczbą dodatnią')
        .toFloat(),
    body('horsePower')
        .isInt({ min: 1 }).withMessage('Moc silnika musi być liczbą całkowitą większą lub równą 1')
        .toInt(),
    body('isAvailableForRent')
        .isBoolean().withMessage('Status dostępności do wynajmu musi być wartością logiczną')
        .toBoolean()
]), async (req, res) => {
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
 */
app.put('/cars/:id', authenticateSession, validate([
    param('id')
        .isInt({ min: 1 }).withMessage('ID samochodu musi być liczbą całkowitą większą lub równą 1'),
    body('brand')
        .optional()
        .notEmpty().withMessage('Marka samochodu nie może być pusta')
        .trim()
        .escape(),
    body('model')
        .optional()
        .notEmpty().withMessage('Model samochodu nie może być pusty')
        .trim()
        .escape(),
    body('year')
        .optional()
        .isInt({ min: 1886 }).withMessage('Rok produkcji musi być poprawną liczbą całkowitą')
        .toInt(),
    body('vin')
        .optional()
        .isLength({ min: 17, max: 17 }).withMessage('Numer VIN musi mieć dokładnie 17 znaków')
        .trim()
        .escape(),
    body('price')
        .optional()
        .isFloat({ min: 0 }).withMessage('Cena samochodu musi być liczbą dodatnią')
        .toFloat(),
    body('horsePower')
        .optional()
        .isInt({ min: 1 }).withMessage('Moc silnika musi być liczbą całkowitą większą lub równą 1')
        .toInt(),
    body('isAvailableForRent')
        .optional()
        .isBoolean().withMessage('Status dostępności do wynajmu musi być wartością logiczną')
        .toBoolean()
]), async (req, res) => {
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
 */
app.delete('/cars/:id', authenticateSession, validate([
    param('id')
        .isInt({ min: 1 }).withMessage('ID samochodu musi być liczbą całkowitą większą lub równą 1')
]), async (req, res) => {
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
 */
app.get('/users', authenticateSession, validate([
    query('page').optional().isInt({ min: 1 }).withMessage('Strona musi być liczbą całkowitą większą lub równą 1'),
    query('limit').optional().isInt({ min: 1 }).withMessage('Limit musi być liczbą całkowitą większą lub równą 1')
]), async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const users = await User.findAndCountAll({
            where: { isDealer: false }, // Klienci mają isDealer: false
            limit: parseInt(limit),
            offset: parseInt(offset),
            attributes: ['id', 'username', 'firstName', 'lastName']
        });
        res.json({
            totalItems: users.count,
            totalPages: Math.ceil(users.count / limit),
            currentPage: parseInt(page),
            data: users.rows
        });
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
 */
app.get('/users/:id', authenticateSession, validate([
    param('id')
        .isInt({ min: 1 }).withMessage('ID użytkownika musi być liczbą całkowitą większą lub równą 1')
]), async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: ['id', 'username', 'firstName', 'lastName', 'isDealer']
        });
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
 */
app.put('/users/:id', authenticateSession, validate([
    param('id')
        .isInt({ min: 1 }).withMessage('ID użytkownika musi być liczbą całkowitą większą lub równą 1'),
    body('username')
        .optional()
        .isLength({ min: 3 }).withMessage('Nazwa użytkownika musi mieć przynajmniej 3 znaki')
        .trim()
        .escape(),
    body('password')
        .optional()
        .isLength({ min: 6 }).withMessage('Hasło musi mieć przynajmniej 6 znaków')
        .trim(),
    body('firstName')
        .optional()
        .notEmpty().withMessage('Imię nie może być puste')
        .trim()
        .escape(),
    body('lastName')
        .optional()
        .notEmpty().withMessage('Nazwisko nie może być puste')
        .trim()
        .escape()
]), async (req, res) => {
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
 */
app.delete('/users/:id', authenticateSession, validate([
    param('id')
        .isInt({ min: 1 }).withMessage('ID użytkownika musi być liczbą całkowitą większą lub równą 1')
]), async (req, res) => {
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
 */
app.post('/cars/:id/rent', authenticateSession, validate([
    param('id')
        .isInt({ min: 1 }).withMessage('ID samochodu musi być liczbą całkowitą większą lub równą 1')
]), async (req, res) => {
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
 */
app.post('/cars/:id/return', authenticateSession, validate([
    param('id')
        .isInt({ min: 1 }).withMessage('ID samochodu musi być liczbą całkowitą większą lub równą 1')
]), async (req, res) => {
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
 */
app.get('/cars/:id/renter', validate([
    param('id')
        .isInt({ min: 1 }).withMessage('ID samochodu musi być liczbą całkowitą większą lub równą 1')
]), async (req, res) => {
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
 */
app.post('/cars/:id/buy', authenticateSession, validate([
    param('id')
        .isInt({ min: 1 }).withMessage('ID samochodu musi być liczbą całkowitą większą lub równą 1')
]), async (req, res) => {
    try {
        const carId = req.params.id;

        // Znajdź samochód po ID
        const car = await Car.findByPk(carId);

        if (!car) {
            return res.status(404).json({ error: 'Samochód nie znaleziony' });
        }

        if (!car.isAvailableForRent) { // Można rozważyć zmianę logiki na isAvailableForSale
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
 */
app.post('/cars/:id/leasing', validate([
    param('id')
        .isInt({ min: 1 }).withMessage('ID samochodu musi być liczbą całkowitą większą lub równą 1'),
    body('downPayment')
        .isFloat({ min: 0 }).withMessage('Wpłata wstępna musi być liczbą dodatnią')
        .toFloat(),
    body('months')
        .isInt({ min: 1 }).withMessage('Liczba miesięcy musi być liczbą całkowitą większą lub równą 1')
        .toInt()
]), async (req, res) => {
    try {
        const carId = req.params.id;
        const { downPayment, months } = req.body;

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
 */
app.post('/admin/create-customer', authenticateSession, validate([
    body('username')
        .isLength({ min: 3 }).withMessage('Nazwa użytkownika musi mieć przynajmniej 3 znaki')
        .trim()
        .escape(),
    body('password')
        .isLength({ min: 6 }).withMessage('Hasło musi mieć przynajmniej 6 znaków')
        .trim(),
    body('firstName')
        .notEmpty().withMessage('Imię jest wymagane')
        .trim()
        .escape(),
    body('lastName')
        .notEmpty().withMessage('Nazwisko jest wymagane')
        .trim()
        .escape()
]), async (req, res) => {
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

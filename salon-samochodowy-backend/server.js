import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors'; 
import session from 'express-session'; // Import express-session
import { sequelize, Car, User,Rental } from './models.js'; 
import { Op } from 'sequelize';
import { body, param, validationResult } from 'express-validator'; // Import express-validator

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Konfiguracja CORS
app.use(cors({
  origin: 'http://localhost:4200', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, 
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

// Middleware do obsługi wyników walidacji
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
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
 * @apiParam {String{3..}} username Nazwa użytkownika (min 3 znaki)
 * @apiParam {String{6..}} password Hasło użytkownika (min 6 znaków)
 * @apiParam {String} firstName Imię użytkownika (wymagane)
 * @apiParam {String} lastName Nazwisko użytkownika (wymagane)
 *
 */
app.post('/register', [
    body('username')
        .isString().withMessage('Nazwa użytkownika musi być tekstem')
        .isLength({ min: 3 }).withMessage('Nazwa użytkownika musi mieć co najmniej 3 znaki'),
    body('password')
        .isString().withMessage('Hasło musi być tekstem')
        .isLength({ min: 6 }).withMessage('Hasło musi mieć co najmniej 6 znaków'),
    body('firstName')
        .notEmpty().withMessage('Imię jest wymagane'),
    body('lastName')
        .notEmpty().withMessage('Nazwisko jest wymagane'),
    handleValidationErrors
], async (req, res) => {
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
 * @apiParam {String{3..}} username Nazwa użytkownika (min 3 znaki)
 * @apiParam {String{6..}} password Hasło użytkownika (min 6 znaków)
 *
 */
app.post('/login', [
    body('username')
        .isString().withMessage('Nazwa użytkownika musi być tekstem')
        .isLength({ min: 3 }).withMessage('Nazwa użytkownika musi mieć co najmniej 3 znaki'),
    body('password')
        .isString().withMessage('Hasło musi być tekstem')
        .isLength({ min: 6 }).withMessage('Hasło musi mieć co najmniej 6 znaków'),
    handleValidationErrors
], async (req, res) => {
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
 * @apiParam {Number{1..}} [page=1] Numer strony
 * @apiParam {Number{1..}} [limit=10] Liczba rekordów na stronę
 *
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
 * @apiParam {Number{1..}} id ID samochodu
 *
 */
app.get('/cars/:id', [
    param('id')
        .isInt({ min: 1 }).withMessage('ID samochodu musi być liczbą całkowitą większą lub równą 1'),
    handleValidationErrors
], async (req, res) => {
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
 * @apiParam {String} brand Marka samochodu (wymagane)
 * @apiParam {String} model Model samochodu (wymagane)
 * @apiParam {Number{1886..}} year Rok produkcji (min 1886)
 * @apiParam {String{17}} vin Numer VIN (dokładnie 17 znaków)
 * @apiParam {Number{0..}} price Cena samochodu (liczba dodatnia)
 * @apiParam {Number{1..}} horsePower Moc silnika (liczba całkowita >= 1)
 * @apiParam {Boolean} isAvailableForRent Status dostępności do wynajmu (wymagane)
 *
 */
app.post('/cars', authenticateSession, [
    body('brand')
        .isString().withMessage('Marka musi być tekstem')
        .notEmpty().withMessage('Marka jest wymagana'),
    body('model')
        .isString().withMessage('Model musi być tekstem')
        .notEmpty().withMessage('Model jest wymagany'),
    body('year')
        .isInt({ min: 1886 }).withMessage('Rok produkcji musi być liczbą całkowitą nie mniejszą niż 1886'),
    body('vin')
        .isString().withMessage('Numer VIN musi być tekstem')
        .isLength({ min: 17, max: 17 }).withMessage('Numer VIN musi mieć dokładnie 17 znaków'),
    body('price')
        .isFloat({ min: 0 }).withMessage('Cena musi być liczbą dodatnią'),
    body('horsePower')
        .isInt({ min: 1 }).withMessage('Moc silnika musi być liczbą całkowitą nie mniejszą niż 1'),
    body('isAvailableForRent')
        .isBoolean().withMessage('Status dostępności do wynajmu musi być wartością boolean'),
    handleValidationErrors
], async (req, res) => {
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
 * @apiParam {Number{1..}} id ID samochodu
 * @apiParam {String} [brand] Marka samochodu (nie może być pusta)
 * @apiParam {String} [model] Model samochodu (nie może być pusty)
 * @apiParam {Number{1886..}} [year] Rok produkcji (min 1886)
 * @apiParam {String{17}} [vin] Numer VIN (dokładnie 17 znaków)
 * @apiParam {Number{0..}} [price] Cena samochodu (liczba dodatnia)
 * @apiParam {Number{1..}} [horsePower] Moc silnika (liczba całkowita >= 1)
 * @apiParam {Boolean} [isAvailableForRent] Status dostępności do wynajmu
 *
 */
app.put('/cars/:id', authenticateSession, [
    param('id')
        .isInt({ min: 1 }).withMessage('ID samochodu musi być liczbą całkowitą większą lub równą 1'),
    body('brand')
        .optional()
        .isString().withMessage('Marka musi być tekstem')
        .notEmpty().withMessage('Marka nie może być pusta'),
    body('model')
        .optional()
        .isString().withMessage('Model musi być tekstem')
        .notEmpty().withMessage('Model nie może być pusty'),
    body('year')
        .optional()
        .isInt({ min: 1886 }).withMessage('Rok produkcji musi być liczbą całkowitą nie mniejszą niż 1886'),
    body('vin')
        .optional()
        .isString().withMessage('Numer VIN musi być tekstem')
        .isLength({ min: 17, max: 17 }).withMessage('Numer VIN musi mieć dokładnie 17 znaków'),
    body('price')
        .optional()
        .isFloat({ min: 0 }).withMessage('Cena musi być liczbą dodatnią'),
    body('horsePower')
        .optional()
        .isInt({ min: 1 }).withMessage('Moc silnika musi być liczbą całkowitą nie mniejszą niż 1'),
    body('isAvailableForRent')
        .optional()
        .isBoolean().withMessage('Status dostępności do wynajmu musi być wartością boolean'),
    handleValidationErrors
], async (req, res) => {
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
 * @apiParam {Number{1..}} id ID samochodu
 *
 */
app.delete('/cars/:id', authenticateSession, [
    param('id')
        .isInt({ min: 1 }).withMessage('ID samochodu musi być liczbą całkowitą większą lub równą 1'),
    handleValidationErrors
], async (req, res) => {
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
 * @apiParam {Number{1..}} [page=1] Numer strony
 * @apiParam {Number{1..}} [limit=10] Liczba rekordów na stronę
 *
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
 * @apiParam {Number{1..}} id ID użytkownika
 *
 */
app.get('/users/:id', authenticateSession, [
    param('id')
        .isInt({ min: 1 }).withMessage('ID użytkownika musi być liczbą całkowitą większą lub równą 1'),
    handleValidationErrors
], async (req, res) => {
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
 * @apiParam {Number{1..}} id ID użytkownika
 * @apiParam {String{3..}} [username] Nazwa użytkownika (min 3 znaki)
 * @apiParam {String{6..}} [password] Hasło użytkownika (min 6 znaków)
 * @apiParam {String} [firstName] Imię użytkownika (nie może być puste)
 * @apiParam {String} [lastName] Nazwisko użytkownika (nie może być puste)
 *
 */
app.put('/users/:id', authenticateSession, [
    param('id')
        .isInt({ min: 1 }).withMessage('ID użytkownika musi być liczbą całkowitą większą lub równą 1'),
    body('username')
        .optional()
        .isString().withMessage('Nazwa użytkownika musi być tekstem')
        .isLength({ min: 3 }).withMessage('Nazwa użytkownika musi mieć co najmniej 3 znaki'),
    body('password')
        .optional()
        .isString().withMessage('Hasło musi być tekstem')
        .isLength({ min: 6 }).withMessage('Hasło musi mieć co najmniej 6 znaków'),
    body('firstName')
        .optional()
        .notEmpty().withMessage('Imię nie może być puste'),
    body('lastName')
        .optional()
        .notEmpty().withMessage('Nazwisko nie może być puste'),
    handleValidationErrors
], async (req, res) => {
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
 * @apiParam {Number{1..}} id ID użytkownika
 *
 */
app.delete('/users/:id', authenticateSession, [
    param('id')
        .isInt({ min: 1 }).withMessage('ID użytkownika musi być liczbą całkowitą większą lub równą 1'),
    handleValidationErrors
], async (req, res) => {
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
 * @apiParam {Number{1..}} id ID samochodu
 *
 */
app.post('/cars/:id/rent', authenticateSession, [
    param('id')
        .isInt({ min: 1 }).withMessage('ID samochodu musi być liczbą całkowitą większą lub równą 1'),
    handleValidationErrors
], async (req, res) => {
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
 * @apiParam {Number{1..}} id ID samochodu
 *
 */
app.post('/cars/:id/return', authenticateSession, [
    param('id')
        .isInt({ min: 1 }).withMessage('ID samochodu musi być liczbą całkowitą większą lub równą 1'),
    handleValidationErrors
], async (req, res) => {
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
 *
 * @apiParam {Number{1..}} id ID samochodu
 *
 */
app.get('/cars/:id/renter', [
    param('id')
        .isInt({ min: 1 }).withMessage('ID samochodu musi być liczbą całkowitą większą lub równą 1'),
    handleValidationErrors
], async (req, res) => {
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
 * @apiParam {Number{1..}} id ID samochodu
 *
 */
app.post('/cars/:id/buy', authenticateSession, [
    param('id')
        .isInt({ min: 1 }).withMessage('ID samochodu musi być liczbą całkowitą większą lub równą 1'),
    handleValidationErrors
], async (req, res) => {
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
 *
 * @apiParam {Number{1..}} id ID samochodu
 * @apiParam {Number{0..}} downPayment Wpłata wstępna (liczba dodatnia)
 * @apiParam {Number{1..}} months Liczba miesięcy (liczba całkowita >= 1)
 *
 */
app.post('/cars/:id/leasing', [
    param('id')
        .isInt({ min: 1 }).withMessage('ID samochodu musi być liczbą całkowitą większą lub równą 1'),
    body('downPayment')
        .isFloat({ min: 0 }).withMessage('Wpłata wstępna musi być liczbą dodatnią'),
    body('months')
        .isInt({ min: 1 }).withMessage('Liczba miesięcy musi być liczbą całkowitą nie mniejszą niż 1'),
    handleValidationErrors
], async (req, res) => {
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
 * @apiParam {String{3..}} username Nazwa użytkownika (min 3 znaki)
 * @apiParam {String{6..}} password Hasło użytkownika (min 6 znaków)
 * @apiParam {String} firstName Imię użytkownika (wymagane)
 * @apiParam {String} lastName Nazwisko użytkownika (wymagane)
 *
 */
app.post('/admin/create-customer', authenticateSession, [
    body('username')
        .isString().withMessage('Nazwa użytkownika musi być tekstem')
        .isLength({ min: 3 }).withMessage('Nazwa użytkownika musi mieć co najmniej 3 znaki'),
    body('password')
        .isString().withMessage('Hasło musi być tekstem')
        .isLength({ min: 6 }).withMessage('Hasło musi mieć co najmniej 6 znaków'),
    body('firstName')
        .notEmpty().withMessage('Imię jest wymagane'),
    body('lastName')
        .notEmpty().withMessage('Nazwisko jest wymagane'),
    handleValidationErrors
], async (req, res) => {
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


//RENTALS
app.post('/rentals', authenticateSession, async (req, res) => {
    console.log('Żądanie do zapisania wynajmu:', req.body, 'Użytkownik:', req.session.userId);

    try {
        const { carId, startDate, endDate } = req.body;

        // Walidacja dat
        if (!startDate || !endDate || new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({ error: 'Nieprawidłowe daty wynajmu' });
        }

        // Dodanie wynajmu do bazy danych
        const rental = await Rental.create({
            carId,
            userId: req.session.userId,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
        });

        console.log('Wynajem zapisany:', rental);

        // Aktualizacja statusu samochodu
        const car = await Car.findByPk(carId);
        if (car) {
            car.isAvailableForRent = false;
            await car.save();
        }

        res.status(201).json({ message: 'Wynajem zapisany', rental });
    } catch (error) {
        console.error('Błąd przy zapisie wynajmu:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/rentals/:id', authenticateSession, async (req, res) => {
    try {
        const rentalId = req.params.id;

        // Znajdź wynajem
        const rental = await Rental.findOne({ where: { carId: rentalId } });
        if (!rental) {
            return res.status(404).json({ error: 'Wynajem nie znaleziony' });
        }

        // Sprawdź, czy użytkownik jest właścicielem wynajmu
        if (rental.userId !== req.session.userId) {
            return res.status(403).json({ error: 'Nie masz uprawnień do usunięcia tego wynajmu' });
        }

        // Usunięcie wynajmu i aktualizacja statusu samochodu
        await rental.destroy();

        const car = await Car.findByPk(rental.carId);
        if (car) {
            car.isAvailableForRent = true;
            await car.save();
        }

        res.status(200).json({ message: 'Wynajem usunięty' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Pobieranie wszystkich wynajmów
app.get('/rentals', authenticateSession, async (req, res) => {
    console.log('Żądanie otrzymane do /rentals od użytkownika:', req.session?.userId);
    try {
        const rentals = await Rental.findAll();
        console.log('Znalezione wynajmy:', rentals);
        res.status(200).json(rentals);
    } catch (error) {
        console.error('Błąd w trasie /rentals:', error);
        res.status(500).json({ error: error.message });
    }
});

// ====== START SERWERA ======
app.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
});

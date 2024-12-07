import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import session from 'express-session';
import { sequelize, Car, User } from './models.js';

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
    secret: 'TwojSuperTajnyKlucz',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60,
    },
}));

/**
 * Middleware sprawdzający, czy użytkownik jest zalogowany.
 * Jeśli nie, zwraca błąd 401 (Nieautoryzowany).
 * 
 * @function
 * @param {Object} req - Obiekt żądania Express.
 * @param {Object} res - Obiekt odpowiedzi Express.
 * @param {Function} next - Funkcja do wywołania kolejnego middleware.
 */
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
 * @route GET /
 * @description Strona główna API - punkt wejścia.
 * @returns {string} Wiadomość powitalna.
 */
app.get('/', (req, res) => {
    res.send('Witamy w API Zarządzanie Samochodami!');
});

// ====== AUTHENTICATION ======

/**
 * @route POST /register
 * @description Rejestracja nowego użytkownika.
 * @param {string} req.body.username - Nazwa użytkownika.
 * @param {string} req.body.password - Hasło użytkownika.
 * @param {string} req.body.firstName - Imię użytkownika.
 * @param {string} req.body.lastName - Nazwisko użytkownika.
 * @returns {Object} Obiekt nowo utworzonego użytkownika z komunikatem.
 */
app.post('/register', async (req, res) => {
    try {
        const { username, password, firstName, lastName } = req.body;

        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: 'Nazwa użytkownika jest już zajęta' });
        }

        const newUser = await User.create({
            username,
            password,
            firstName,
            lastName,
            isDealer: false,
        });

        req.session.userId = newUser.id;
        req.session.username = newUser.username;

        res.status(201).json({
            message: 'Rejestracja udana',
            user: {
                id: newUser.id,
                username: newUser.username,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route POST /login
 * @description Logowanie użytkownika.
 * @param {string} req.body.username - Nazwa użytkownika.
 * @param {string} req.body.password - Hasło użytkownika.
 * @returns {Object} Dane zalogowanego użytkownika.
 */
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ where: { username } });

        if (!user || user.password !== password) {
            return res.status(400).json({ error: 'Nieprawidłowa nazwa użytkownika lub hasło' });
        }

        req.session.userId = user.id;
        req.session.username = user.username;

        res.status(200).json({
            message: 'Logowanie udane',
            user: {
                id: user.id,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                isDealer: user.isDealer,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route POST /logout
 * @description Wylogowanie użytkownika.
 * @returns {Object} Komunikat o pomyślnym wylogowaniu.
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

// ====== CARS ======

/**
 * @route GET /cars
 * @description Pobiera listę wszystkich samochodów.
 * @returns {Car[]} Tablica obiektów samochodów.
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
 * @route GET /cars/:id
 * @description Pobiera dane samochodu o podanym ID.
 * @param {number} req.params.id - ID samochodu.
 * @returns {Car|Object} Obiekt samochodu lub błąd 404, jeśli nie znaleziono.
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
 * @route POST /cars
 * @description Tworzy nowy samochód (dostęp chroniony, wymagana sesja).
 * @param {string} req.body.brand - Marka samochodu.
 * @param {string} req.body.model - Model samochodu.
 * @param {number} req.body.year - Rok produkcji.
 * @param {string} req.body.vin - Numer VIN.
 * @param {number} req.body.price - Cena samochodu.
 * @param {number} req.body.horsePower - Moc samochodu (KM).
 * @param {boolean} req.body.isAvailableForRent - Dostępność do wynajmu.
 * @returns {Car} Obiekt utworzonego samochodu.
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
            isAvailableForRent,
        });
        res.status(201).json(newCar);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route PUT /cars/:id
 * @description Aktualizuje dane samochodu o podanym ID (chronione).
 * @param {number} req.params.id - ID samochodu.
 * @param {string} req.body.brand - Marka.
 * @param {string} req.body.model - Model.
 * @param {number} req.body.year - Rok.
 * @param {string} req.body.vin - VIN.
 * @param {number} req.body.price - Cena.
 * @param {number} req.body.horsePower - Moc.
 * @param {boolean} req.body.isAvailableForRent - Dostępność do wynajmu.
 * @returns {Car|Object} Zaktualizowany obiekt samochodu lub błąd.
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
 * @route DELETE /cars/:id
 * @description Usuwa samochód o podanym ID (dostęp chroniony, wymagane uprawnienia dealera).
 * @param {number} req.params.id - ID samochodu.
 * @returns {Object} Komunikat o powodzeniu.
 */
app.delete('/cars/:id', authenticateSession, async (req, res) => {
    const userId = req.session.userId;
    const carId = req.params.id;

    const user = await User.findByPk(userId);
    if (!user || !user.isDealer) {
        return res.status(403).json({ error: 'Brak uprawnień do usuwania samochodów' });
    }

    await Car.destroy({ where: { id: carId } });
    res.status(200).json({ message: 'Samochód usunięty.' });
});

// ====== USERS ======

/**
 * @route GET /users
 * @description Pobiera listę użytkowników-klientów (chronione).
 * @returns {User[]} Tablica obiektów użytkowników-klientów.
 */
app.get('/users', authenticateSession, async (req, res) => {
    try {
        const users = await User.findAll({
            where: { isDealer: false },
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route GET /users/:id
 * @description Pobiera dane konkretnego klienta (chronione).
 * @param {number} req.params.id - ID użytkownika.
 * @returns {User|Object} Obiekt klienta lub błąd.
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
 * @route PUT /users/:id
 * @description Aktualizuje dane konkretnego użytkownika-klienta (chronione).
 * @param {number} req.params.id - ID użytkownika.
 * @param {string} req.body.username - Nazwa użytkownika.
 * @param {string} req.body.password - Hasło.
 * @param {string} req.body.firstName - Imię.
 * @param {string} req.body.lastName - Nazwisko.
 * @returns {User|Object} Zaktualizowany obiekt użytkownika lub błąd.
 */
app.put('/users/:id', authenticateSession, async (req, res) => {
    try {
        const { username, password, firstName, lastName } = req.body;
        const user = await User.findByPk(req.params.id);
        if (user && !user.isDealer) {
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
 * @route DELETE /users/:id
 * @description Usuwa konkretnego użytkownika-klienta (chronione).
 * @param {number} req.params.id - ID użytkownika.
 * @returns {Object} Komunikat o powodzeniu lub błąd.
 */
app.delete('/users/:id', authenticateSession, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (user && !user.isDealer) {
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
 * @route POST /cars/:id/rent
 * @description Wynajmuje samochód o podanym ID (chronione).
 * @param {number} req.params.id - ID samochodu.
 * @returns {Object} Komunikat i obiekt wynajętego samochodu.
 */
app.post('/cars/:id/rent', authenticateSession, async (req, res) => {
    try {
        const carId = req.params.id;
        const car = await Car.findByPk(carId);

        if (!car) {
            return res.status(404).json({ error: 'Samochód nie znaleziony' });
        }

        if (!car.isAvailableForRent) {
            return res.status(400).json({ error: 'Samochód jest już wynajęty' });
        }

        car.isAvailableForRent = false;
        car.renterId = req.session.userId;

        await car.save();

        res.status(200).json({ message: 'Samochód został wynajęty', car });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route POST /cars/:id/return
 * @description Zwraca wynajęty samochód (chronione).
 * @param {number} req.params.id - ID samochodu.
 * @returns {Object} Komunikat i obiekt zwróconego samochodu.
 */
app.post('/cars/:id/return', authenticateSession, async (req, res) => {
    try {
        const carId = req.params.id;
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

        car.isAvailableForRent = true;
        car.renterId = null;

        await car.save();

        res.status(200).json({ message: 'Samochód został zwrócony', car });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route GET /cars/:id/renter
 * @description Pobiera dane o aktualnym wynajmującym samochodu.
 * @param {number} req.params.id - ID samochodu.
 * @returns {Object} ID samochodu i ID wynajmującego.
 */
app.get('/cars/:id/renter', async (req, res) => {
    const carId = req.params.id;
    try {
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
 * @route POST /cars/:id/buy
 * @description Kupuje samochód o podanym ID (chronione).
 * @param {number} req.params.id - ID samochodu.
 * @returns {Object} Komunikat i obiekt kupionego samochodu.
 */
app.post('/cars/:id/buy', authenticateSession, async (req, res) => {
    try {
        const carId = req.params.id;
        const car = await Car.findByPk(carId);

        if (!car) {
            return res.status(404).json({ error: 'Samochód nie znaleziony' });
        }

        if (!car.isAvailableForRent) {
            return res.status(400).json({ error: 'Samochód jest już sprzedany lub wynajęty' });
        }

        car.isAvailableForRent = false;
        car.ownerId = req.session.userId;

        await car.save();

        res.status(200).json({ message: 'Samochód został kupiony', car });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route GET /current-user
 * @description Pobiera dane aktualnie zalogowanego użytkownika (chronione).
 * @returns {Object} Dane użytkownika.
 */
app.get('/current-user', authenticateSession, async (req, res) => {
    try {
        const user = await User.findByPk(req.session.userId, {
            attributes: ['id', 'username', 'firstName', 'lastName', 'isDealer'],
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
 * @route POST /cars/:id/leasing
 * @description Oblicza raty leasingowe dla podanego samochodu.
 * @param {number} req.params.id - ID samochodu.
 * @param {number} req.body.downPayment - Wpłata początkowa.
 * @param {number} req.body.months - Liczba miesięcy leasingu.
 * @returns {Object} Szczegóły rat leasingowych.
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
 * @route POST /admin/create-customer
 * @description Tworzy nowego użytkownika-klienta (tylko dla dealerów, chronione).
 * @param {string} req.body.username - Nazwa użytkownika.
 * @param {string} req.body.password - Hasło.
 * @param {string} req.body.firstName - Imię.
 * @param {string} req.body.lastName - Nazwisko.
 * @returns {Object} Obiekt nowo utworzonego klienta.
 */
app.post('/admin/create-customer', authenticateSession, async (req, res) => {
    try {
        const { username, password, firstName, lastName } = req.body;

        const dealer = await User.findByPk(req.session.userId);
        if (!dealer || !dealer.isDealer) {
            return res.status(403).json({ error: 'Brak uprawnień do tworzenia klientów' });
        }

        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: 'Nazwa użytkownika jest już zajęta' });
        }

        const newUser = await User.create({
            username,
            password,
            firstName,
            lastName,
            isDealer: false,
        });

        res.status(201).json({
            message: 'Klient został pomyślnie dodany',
            user: {
                id: newUser.id,
                username: newUser.username,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                isDealer: newUser.isDealer,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ====== START SERWERA ======

/**
 * Uruchamia serwer na wskazanym porcie.
 * @returns {void}
 */
app.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
});

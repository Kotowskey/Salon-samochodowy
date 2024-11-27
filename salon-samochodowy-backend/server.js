import fs from 'fs';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/', (req, res) => {
    res.send('Server with orders');
});

app.get('/orders', (req, res) => {
    fs.readFile('./orders.json', 'utf8', (err, ordersJson) => {
        if (err) {
            console.log("File read failed in GET /orders: "+ err);
            res.status(500).send('File read failed');
            return;
        }
        console.log("GET: /orders");
        res.send(ordersJson);
    });
});

app.get('/orders/:id', (req, res) => {
    fs.readFile('./orders.json', 'utf8', (err, ordersJson) => {
        if (err) {
            console.log("File read failed in GET /orders/" + req.params.id + ": "+ err);
            res.status(500).send('File read failed');
            return;
        }
        var orders = JSON.parse(ordersJson);
        var order = orders.find(ordertmp => ordertmp.orderId == req.params.id);
        if (!order) {
            console.log("Can't find order with id: " + req.params.id);
            res.status(500).send('Cant find order with id: ' + req.params.id);
            return;
        }
        var orderJSON = JSON.stringify(order);
        console.log("GET /orders/" + req.params.id);
        res.send(orderJSON);
    });
});

app.post('/orders', (req, res) => {
    fs.readFile('./orders.json', 'utf8', (err, ordersJson) => {
        if (err) {
            console.log("File read failed in POST /orders: "+ err);
            res.status(500).send('File read failed');
            return;
        }
        var orders = JSON.parse(ordersJson);
        var order = orders.find(ordertmp => ordertmp.orderId == req.body.orderId);
        if (!order) {
            orders.push(req.body);
            var newList = JSON.stringify(orders);
            fs.writeFile('./orders.json', newList, err => {
                if (err) {
                    console.log("Error writing file in POST /orders: "+ err);
                    res.status(500).send('Error writing file orders.json');
                } else {
                    res.status(201).send(req.body);
                    console.log("Successfully wrote file orders.json and added new order with id = " + req.body.orderId);
                }
            });
        } else {
            console.log("Order by id = " + req.body.orderId + " already exists");
            res.status(500).send('Order by id = ' + req.body.orderId + ' already exists');
            return;
        }
    });
});

app.put('/orders/:id', (req, res) => {
    fs.readFile('./orders.json', 'utf8', (err, ordersJson) => {
        if (err) {
            console.log("File read failed in PUT /orders/" + req.params.id+": "+ err);
            res.status(500).send('File read failed');
            return;
        }
        var orders = JSON.parse(ordersJson);
        var orderBody = orders.find(ordertmp => ordertmp.orderId == req.body.orderId);
        if (orderBody && orderBody.orderId != req.params.id) {
            console.log("Order by id = " + orderBody.orderId + " already exists");
            res.status(500).send('Order by id = ' + orderBody.orderId + ' already exists');
            return;
        }
        var order = orders.find(ordertmp => ordertmp.orderId == req.params.id);
        if (!order) {
            orders.push(req.body);
            var newList = JSON.stringify(orders);
            fs.writeFile('./orders.json', newList, err => {
                if (err) {
                    console.log("Error writing file in PUT /orders/" + req.params.id+": "+err);
                    res.status(500).send('Error writing file orders.json');
                } else {
                    res.status(201).send(req.body);
                    console.log("Successfully wrote file orders.json and added new order with id = " + req.body.orderId);
                }
            });
        } else {
            for (var i = 0; i < orders.length; i++) {
                if (orders[i].orderId == order.orderId) {
                    orders[i] = req.body;
                }
            }
            var newList = JSON.stringify(orders);
            fs.writeFile('./orders.json', newList, err => {
                if (err) {
                    console.log("Error writing file in PUT /orders/" + req.params.id+": "+ err);
                    res.status(500).send('Error writing file orders.json');
                } else {
                    res.status(200).send(req.body);
                    console.log("Successfully wrote file orders.json and edit order with old id = " + req.params.id);
                }
            });
        }
    });
});

app.delete('/orders/:id', (req, res) => {
    fs.readFile('./orders.json', 'utf8', (err, ordersJson) => {
        if (err) {
            console.log("File read failed in DELETE /orders: "+ err);
            res.status(500).send('File read failed');
            return;
        }
        var orders = JSON.parse(ordersJson);
        var orderIndex = orders.findIndex(ordertmp => ordertmp.orderId == req.params.id);
        if (orderIndex != -1) {
            orders.splice(orderIndex, 1);
            var newList = JSON.stringify(orders);
            fs.writeFile('./orders.json', newList, err => {
                if (err) {
                    console.log("Error writing file in DELETE /orders/" + req.params.id+": "+ err);
                    res.status(500).send('Error writing file orders.json');
                } else {
                    res.status(204).send();
                    console.log("Successfully deleted order with id = " + req.params.id);
                }
            });
        } else {
            console.log("Order by id = " + req.params.id + " does not exists");
            res.status(500).send('Order by id = ' + req.params.id + ' does not exists');
            return;
        }
    });
});

app.listen(7777, () => console.log("Server address http://localhost:7777"));
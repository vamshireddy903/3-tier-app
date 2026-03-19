const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

let users = []; // temporary (later SQL Server)

app.post('/register', (req, res) => {
    const { name, email, password } = req.body;

    const user = { id: Date.now(), name, email, password };
    users.push(user);

    res.json({ message: 'User registered', user });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email && u.password === password);

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    res.json({ message: 'Login successful', user });
});

app.listen(5001, () => console.log('Auth Service running on 5001'));

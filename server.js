// Import required modules
const express = require('express');
const jwt = require('jsonwebtoken');
const jose = require('node-jose');
const sqlite3 = require('sqlite3').verbose();

// Initialize Express application
const app = express();
const port = 8080;

// Open SQLite database
const db = new sqlite3.Database('totally_not_my_privateKeys.db');

// Create table if not exists to store keys
db.run(`CREATE TABLE IF NOT EXISTS keys(
    kid INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL,
    exp INTEGER NOT NULL
)`);

// Function to generate and store keys in the database
async function generateAndStoreKeys() {
    // Create a valid key and an expired key
    const validKey = await jose.JWK.createKey('RSA', 2048, { alg: 'RS256', use: 'sig' });
    const expiredKey = await jose.JWK.createKey('RSA', 2048, { alg: 'RS256', use: 'sig' });

    // Set expiration times
    const validExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const expiredExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

    // Insert keys into the database
    db.run('INSERT INTO keys (key, exp) VALUES (?, ?)', [JSON.stringify(validKey.toJSON(true)), validExp]);
    db.run('INSERT INTO keys (key, exp) VALUES (?, ?)', [JSON.stringify(expiredKey.toJSON(true)), expiredExp]);
}

// Middleware to ensure only POST requests are allowed for /auth
app.all('/auth', (req, res, next) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }
    next();
});

// Middleware to ensure only GET requests are allowed for /.well-known/jwks.json
app.all('/.well-known/jwks.json', (req, res, next) => {
    if (req.method !== 'GET') {
        return res.status(405).send('Method Not Allowed');
    }
    next();
});

// POST /auth endpoint to generate JWT
app.post('/auth', (req, res) => {
    const expired = req.query.expired === 'true';
    const currentTime = Math.floor(Date.now() / 1000);

    // Select appropriate key based on expiration status
    const query = expired
        ? 'SELECT * FROM keys WHERE exp < ? ORDER BY exp DESC LIMIT 1'
        : 'SELECT * FROM keys WHERE exp > ? ORDER BY exp ASC LIMIT 1';

    db.get(query, [currentTime], async (err, row) => {
        if (err || !row) {
            return res.status(500).send('Error retrieving key');
        }

        // Parse key data and create key object
        const keyData = JSON.parse(row.key);
        const key = await jose.JWK.asKey(keyData);

        // Create payload for JWT
        const payload = {
            user: 'sampleUser',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600
        };

        // Sign JWT with the key
        const token = jwt.sign(payload, key.toPEM(true), {
            algorithm: 'RS256',
            header: {
                typ: 'JWT',
                alg: 'RS256',
                kid: row.kid.toString()
            }
        });

        res.send(token);
    });
});

// GET /.well-known/jwks.json endpoint to retrieve public keys
app.get('/.well-known/jwks.json', (req, res) => {
    const currentTime = Math.floor(Date.now() / 1000);
    // Retrieve all non-expired keys
    db.all('SELECT * FROM keys WHERE exp > ?', [currentTime], (err, rows) => {
        if (err) {
            return res.status(500).send('Error retrieving keys');
        }

        // Format keys for JWKS response
        const keys = rows.map(row => {
            const keyData = JSON.parse(row.key);
            return {
                ...keyData,
                kid: row.kid.toString(),
            };
        });

        res.json({ keys });
    });
});

// Initialize the server
generateAndStoreKeys().then(() => {
    app.listen(port, () => {
        console.log(`Server started on http://localhost:${port}`);
    });
});
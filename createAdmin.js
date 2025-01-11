const bcrypt = require('bcrypt');
const mysql = require('mysql');

// Configuration de la connexion à la base de données
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '159357',
  database: 'ecommerce'
});

// Informations de l'administrateur
const username = 'admin';
const email = 'admin@example.com';
const password = '12345678';
const isAdmin = true;

// Hachage du mot de passe et insertion dans la base de données
bcrypt.hash(password, 10, (err, hash) => {
  if (err) throw err;

  const sql = 'INSERT INTO users (username, email, password, isAdmin) VALUES (?, ?, ?, ?)';
  connection.query(sql, [username, email, hash, isAdmin], (err, result) => {
    if (err) throw err;
    console.log('Admin user created:', result);
    connection.end();
  });
});
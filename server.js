const express = require('express');
const session = require('express-session');
const bcrypt = require("bcrypt");
const mysql = require('mysql');
const path = require('path');
const multer = require('multer');
const app = express();
const port = 3002;

// Middleware setup
app.use(express.urlencoded({ extended: false }));
app.use(express.json()); // Replaces bodyParser.json()
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Authentication middleware
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    res.redirect('/login');
  }
}

// Route definitions
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/add-product', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'addproduct.html'));
});

app.get('/home', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/shop', (req, res) => {
  res.sendFile(path.join(__dirname, 'shop.html'));
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM users WHERE email = ?";
  connection.query(sql, [email], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("<script>alert('Erreur lors de la connexion'); window.location.href = '/login';</script>");
    }
    if (results.length === 0) {
      return res.status(400).send("<script>alert('Email ou mot de passe incorrect'); window.location.href = '/login';</script>");
    }
    const user = results[0];
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error(err);
        return res.status(500).send("<script>alert('Erreur lors de la connexion'); window.location.href = '/login';</script>");
      }
      if (!isMatch) {
        return res.status(400).send("<script>alert('Email ou mot de passe incorrect'); window.location.href = '/login';</script>");
      }
      req.session.user = user;
      res.send("<script>alert('Connexion réussie'); window.location.href = '/home';</script>");
    });
  });
});

app.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      console.error(err);
      return res.status(500).send("<script>alert('Erreur lors de l\'inscription'); window.location.href = '/register';</script>");
    }
    const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
    connection.query(sql, [username, email, hash], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("<script>alert('Erreur lors de l\'inscription'); window.location.href = '/register';</script>");
      }
      req.session.user = { username, email, hash };
      res.send("<script>alert('Inscription réussie'); window.location.href = '/home';</script>");
    });
  });
});

// Serve static files after route definitions
app.use('/uploads', express.static('uploads'));
app.use(express.static(path.join(__dirname)));

// API route for products
app.get('/api/products', (req, res) => {
  const query = 'SELECT * FROM products';
  connection.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Erreur lors de la récupération des produits');
    }
    res.json(results);
  });
});

// Multer upload middleware
const upload = multer({ dest: 'uploads/' });
app.post('/submit', upload.single('imgsrc'), (req, res) => {
  const { name, price } = req.body;
  const imgsrc = req.file.path;
  const sql = 'INSERT INTO products (name, price, imgsrc) VALUES (?, ?, ?)';
  connection.query(sql, [name, price, imgsrc], (err, result) => {
    if (err) {
      throw err;
    }
    console.log('Produit ajouté:', result);
    res.redirect('/home');
  });
});

// Database connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ecommerce'
});
connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL');
});

// Start the server
app.listen(port, () => {
  console.log(`Serveur démarré sur le port http://localhost:${port}`);
});
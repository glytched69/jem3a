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

// middleware dyal admin
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.isAdmin) {
    return next();
  } else {
    res.status(403).send("<script>alert('Accès refusé'); window.location.href = '/home';</script>");
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

app.get('/add-product', isAuthenticated, isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'add-product.html'));
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
      console.error('Erreur lors de la requête SQL:', err);
      return res.status(500).send("<script>alert('Erreur lors de la connexion'); window.location.href = '/login';</script>");
    }
    if (results.length === 0) {
      console.log('Utilisateur non trouvé pour l\'email:', email);
      return res.status(400).send("<script>alert('Email ou mot de passe incorrect'); window.location.href = '/login';</script>");
    }
    const user = results[0];
    const ps=password.toString();
    console.log('Utilisateur trouvé:', user);
    bcrypt.compare(ps, user.password, (err, isMatch) => {
      if (err) {
        console.error('Erreur lors de la comparaison des mots de passe:', err);
        return res.status(500).send("<script>alert('Erreur lors de la connexion'); window.location.href = '/login';</script>");
      }

      req.session.user = {user, isAdmin: user.isAdmin };
      console.log('Connexion réussie pour l\'utilisateur:', req.session.user);
      res.send("<script>alert('Connexion réussie'); window.location.href = '/home';</script>");
    });
  });
});

app.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  bcrypt.hash(password.toString(), 8, (err, hash) => {
    if (err) {
      console.error('Erreur lors du hachage du mot de passe:', err);
      return res.status(500).send("<script>alert('Erreur lors de l\'inscription'); window.location.href = '/register';</script>");
    }
    const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
    connection.query(sql, [username, email, hash], (err, result) => {
      if (err) {
        console.error('Erreur lors de l\'insertion dans la base de données:', err);
        return res.status(500).send("<script>alert('Erreur lors de l\'inscription'); window.location.href = '/register';</script>");
      }
      req.session.user = {username, email, hash, isAdmin: false };
      console.log('Inscription réussie pour l\'utilisateur:', req.session.user);
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

// obtenir les informations de l'utilisateur connecté
app.get('/api/user', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ error: 'Non authentifié' });
  }
});

// Multer upload middleware
const upload = multer({ dest: 'uploads/' });
app.post('/submit', isAuthenticated, isAdmin, upload.single('imgsrc'), (req, res) => {
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
  password: '159357',
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
const express = require("express");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const path = require("path");

const app = express();
const PORT = 3001;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
    store: new FileStore({
        path: "./sessions",
        retries: 1
    }),
    secret: "college-assignment-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 60 * 1000
    }
}));

const USER = {
    username: "admin",
    password: "admin123"
};

function isAuthenticated(req, res, next) {
    if (req.session.isLoggedIn) {
        next();
    } else {
        res.redirect("/login");
    }
}

app.get("/", (req, res) => {
    if (req.session.isLoggedIn) {
        return res.redirect("/dashboard");
    }
    res.redirect("/login");
});

app.get("/login", (req, res) => {
    res.render("login", {
        error: null
    });
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (username === USER.username && password === USER.password) {
        req.session.isLoggedIn = true;
        req.session.username = username;

        return res.redirect("/dashboard");
    }

    res.status(401).render("login", {
        error: "Invalid username or password."
    });
});

// Protected Route 1
app.get("/dashboard", isAuthenticated, (req, res) => {
    res.render("dashboard", {
        username: req.session.username
    });
});

// Protected Route 2
app.get("/profile", isAuthenticated, (req, res) => {
    res.render("profile", {
        username: req.session.username
    });
});

app.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send("Could not log out.");
        }

        res.clearCookie("connect.sid");
        res.redirect("/login");
    });
});

app.listen(PORT, () => {
    console.log(`Q2 server running at http://localhost:${PORT}`);
});
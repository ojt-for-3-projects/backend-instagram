var express = require('express');
var router = express.Router();
const userModel = require("./users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render("login");
});

router.get("/login", function(req, res) {
  res.render("login");
});

router.get("/signup", function(req, res) {
  res.render("signup");
});

router.post("/signupping", async function(req, res) {
  let { username, fullname, email, password } = req.body;
  if (!username || !fullname || !email || !password) {
    return res.status(400).send("All fields must be filled");
  }
  if (password.length < 6) {
    return res.status(400).send("Password must contain at least 6 characters");
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = await userModel.create({
      username,
      fullname,
      password: hash,
      email
    });
    let token = jwt.sign({ email }, "satish");
    res.cookie("token", token);
    res.send(user);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error on signup route");
  }
});

router.post("/loging", async function(req, res) {
  let { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send("All fields must be completed");
  }
  try {
    let user = await userModel.findOne({ username });
    if (!user) {
      return res.status(400).send("User not found");
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      let token = jwt.sign({ username }, "satish");
      res.cookie("token", token);
      res.redirect('/home');
    } else {
      res.status(400).send("Incorrect password");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error on login route");
  }
});

router.get("/logout", function(req, res) {
  try {
    res.clearCookie("token");
    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error.");
  }
});

router.get("/home", isLogIn, function(req, res) {
  res.send("Welcome to the home");
});

function isLogIn(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect("/");
  }
  try {
    let data = jwt.verify(token, "satish");
    req.user = data;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).send("Login error");
  }
};

module.exports = router;

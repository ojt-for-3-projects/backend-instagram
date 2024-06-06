var express = require('express');
var router = express.Router();
const userModel = require("./users");
const postModel = require("./post");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require('passport');
const upload = require("./multers")

/* GET home page. */ 
router.get('/', function(req, res, next) {
  res.render("login", {footer: false});
});

router.get("/login", function(req, res) {
  res.render("login", {footer: false});
});

router.get("/signup", function(req, res) {
  res.render("signup", {footer: false});
});

router.get("/home", isLogIn, async function(req, res) {
  const user = await userModel.findOne({username : req.session.passport.user});
  const posts = await postModel.find().populate("user");
  res.render("home", {footer: true, posts, user});
});

router.get("/profile ",isLogIn, async function(req,res){
  const user = await userModel.findOne({username : req.session.passport.user});
  res.render("profile", {footer: true, user}).populate("posts")
});

router.get("/search",isLogIn, function(req, res){
  res.render("search", {footer: true});
});

router.get("/like/post:id",isLogIn, async function(req, res){
  const user = await userModel.findOne({username: req.session.passport.user});
  const post = await postModel.findOne({_id: req.params.id});

  if (post.likes.indexOf(user._id)=== -1){
    post.likes.push(user._id);
  }
  else{
    post.likes.splice(post.likes.indexOf(user._id),1); 
  }

  await post.save();
  res.redirect("/home");
});

router.get("/edit",isLogIn, async function(req, res){
  const user = await userModel.findOne({username : req.session.passport.user});
  res.render("edit", {footer: true, user});
});

router.get("/upload",isLogIn, function(req, res) {
res.render("upload", {footer: true});
});

router.get("/username/:username",isLogIn, async function(req, res){
  const regex = new RegExp(`^${req.params.username}`, 'i');
const users = await userModel.find({username: regex})
res.json(users);
});

router.post("/register", function(req, res, next){
  const userData = new userModel({
    fullname : req.body.fullname,
  email : req.body.email, 
  username : req.body.username,
  });

  userModel.register(userData, req.body.password)
  .then(function(){
    passport.authenticate("local")(req, res, function (){
      res.redirect("/profile")
    })
  })
})

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

router.post("/update",upload.single('image'), async function(req, res){
const user = await userModel.findOneAndUpdate(
  {username: req.session.passport.user}, 
  {username:req.body.username, name:req.body.fullname, bio:req.body.bio}, 
  {new: true}
);

if(req.file){
  user.profileImage = req.file.filename;
}

await user.save()
res.redirect("/profile");
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

router.post("/upload",isLogIn,upload.single("image"), async function(req, res){
  const user = await userModel.findOne({username : req.session.passport.user});
  const post = await postModel.create({
    picture: req.file.filename,
    user: user._id,
    caption: req.body.caption
  })

 user.posts.push(post._id);
 await user.save();
 res.redirect("/home"); 

});

module.exports = router;

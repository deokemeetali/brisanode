const express = require('express');
const {connectDB} =require('./database');
const User = require('./models/usermodel');
const Post = require('./models/postmodel');
const Comment = require('./models/commentmodel');
// const bcrypt = require('bcrypt');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');




  const mongoose = require('mongoose');

 const bodyparser=require('body-parser');

const app = express();

const PORT = process.env.PORT || 4000;
 const cors = require('cors');
 app.use(cors());
 app.use(bodyparser.json())
 
connectDB()
const crypto = require('crypto');
var userProfile;


const sessionSecret = crypto.randomBytes(32).toString('hex');
app.use(session({
  secret: sessionSecret, 
  resave: false,
  saveUninitialized: true,
}));


app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: '166868863171-3jc87rbv266kcefu4f2jqjlhsqrbfm1p.apps.googleusercontent.com',
    clientSecret: "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",
    callbackURL: "https://blogapp-api-lxve.onrender.com/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    userProfile=profile.id;
    console.log("user profile :" + userProfile);
    return done(null, userProfile);
}

));
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

app.post('/users/register',async (req,res)=>{
  try{
    const {username,email,password}=req.body;
    // const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username,email, password,role : "USER" });
    await user.save();
    res.json(user)
  }catch{
    res.status(500).json({ error: 'Could not fetch user' });
  }
});
app.post('/api/login',async (req,res)=>{
  const{username,password}=req.body;
  console.log(username,password);
  const user = await User.findOne({username,password});
  // console.log(user);
  if(user){
    res.status(200).json(user);
  }else{
    res.status(401).json({error:'Invalid username or password'});
  }
});
app.post('/api/posts', async (req, res) => {
  try {
   
    const { title, description, author } = req.body;
    console.log(author);
   
    
    const newPost = new Post({ title, description, author }); 
    
   ;
    await newPost.save();
    const user = await User.findById(author);
    if (user) {
      user.posts.push(newPost.username);
      await user.save();
    }
   

    res.status(201).json({ message: 'Post saved successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to save post' });
  }
});
app.get('/api/posts', async (req, res) => {
  try {
    
   
    const userId = req.query.userId;
    console.log(userId);

    const posts = await Post.find({ author: userId });
    console.log(posts);


    res.status(200).json(posts);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});
app.post('/api/posts/:postId/like', async (req, res) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);


    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    
    post.likes += 1;
    await post.save();

    res.status(200).json({ message: 'Like updated successfully', likes: post.likes });
  } catch (error) {
    console.error('Error updating like:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



  app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  app.get('/auth/google/callback',
    // passport.authenticate('google', {
    //   successRedirect: '/mainpage', 
    //   failureRedirect: '/', 
    // })
    passport.authenticate('google', { failureRedirect: '/error' }),
  function(req, res) {
    // Successful authentication, redirect success.
    //res.redirect('/success');
    
    res.redirect('/mainpage');
  });

  //app.get('/success', (req, res) => res.send(userProfile));




  app.listen(PORT,() => console.log(`Server running on port ${PORT}`))

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
    userProfile=profile;
    console.log("user profile :" + userProfile);
    return done(null, userProfile); 
     userProfile = profile;
    console.log("user profile: " + userProfile);

    // Check if the user already exists based on their Google ID
    User.findOne({ googleId: userProfile.id }, async (err, existingUser) => {
      if (err) {
        return done(err);
      }

      if (existingUser) {
        // User already exists, no need to create a new one
        return done(null, existingUser);
      }

      // User doesn't exist, create a new user and save their Google ID
      const newUser = new User({
        googleId: userProfile.id,
        // Other user data fields
      });

      try {
        await newUser.save();
        return done(null, newUser);
      } catch (error) {
        return done(error);
      }
    });
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
    const accessToken = req.user.accessToken;
  
    req.session.accessToken = accessToken;
    res.send({ userProfile, accessToken });
  });
  app.get('/api/checkAccessToken', async (req, res) => {
    const accessToken = req.query.accessToken;
  
    // Implement your access token validation logic here
    // For example, you can check if the accessToken is stored in your database
    // and if it's valid, send a 200 response, else send an error response
  
    if (isValidAccessToken(accessToken)) {
      // Access token is valid
      // Here, you can use the user ID to authenticate the user
      const user = await User.findOne({ googleId: userProfile.id });
      if (user) {
        // User is authenticated
        res.status(200).json({ message: 'Access token is valid', user });
      } else {
        // User not found
        res.status(401).json({ error: 'User not found' });
      }
    } else {
      // Access token is invalid
      res.status(401).json({ error: 'Invalid access token' });
    }
  });
  //app.get('/success', (req, res) => res.send(userProfile));




  app.listen(PORT,() => console.log(`Server running on port ${PORT}`))

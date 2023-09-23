const express = require('express');
const {connectDB} =require('./database');
const User = require('./models/usermodel');
const Post = require('./models/postmodel');
const Comment = require('./models/commentmodel');
// const bcrypt = require('bcrypt');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  'http://166868863171-3jc87rbv266kcefu4f2jqjlhsqrbfm1p.apps.googleusercontent.com',
  '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',
  'https://frontend-x0qa.onrender.com'
);


const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', 
  scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile', 
});

console.log('Authorization URL:', authUrl);



  const mongoose = require('mongoose');

 const bodyparser=require('body-parser');

const app = express();
const CLIENT_ID = 'a4983694b057f9a8161f';
const REDIRECT_URI = 'https://frontend-x0qa.onrender.com/callback/github'; 
const SCOPES = 'user:email'; 


app.get('/github-auth', (req, res) => {
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPES}`;


  res.redirect(githubAuthUrl);
});

const PORT = process.env.PORT || 4000;
 const cors = require('cors');
 app.use(cors());
 app.use(bodyparser.json())
 
connectDB()



// mongoose.connect("mongodb://127.0.0.1:27017/BlogApp",{
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
// const PostModel = mongoose.model("blogdetails", {
//   title: String,
//   description: String,
// });
// const userSchema = new mongoose.Schema({
//   username: String,
//   password: String,
//    lastLoginTime: String, 
// });

// const UserModel = mongoose.model('user_and_password', userSchema);

// app.post("/api/posts", async (req, res) => {
//   try {
//     const { title, description } = req.body;

   
//     const newPost = new PostModel({ title, description });
//     await newPost.save();

//     res.status(201).json({ message: "Post saved successfully" });
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ error: "Failed to save post" });
//   }
// });



// app.post('/login/v1', async (req, res) => {
//   try {
//     const { username, password } = req.body;
//     const hashedPassword = await bcrypt.hash(password, 10); 
//     const user = new UserModel({ username, password: hashedPassword });
//     console.log("Received login request with username:", username, "and password:", password);
//     console.log(user);


//     if (user) {
      
//        user.lastLoginTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
//        await user.save();

//       res.json(user);
//     } else {
//       res.status(401).json({ error: 'Incorrect username or password' });
//     }
//   } catch (error) {
//     console.error("Error during login:", error);
//     res.status(500).json({ error: 'Could not fetch user' });
//   }
// });
// app.get("/api/blogposts", async (req, res) => {
//   try {
//     const posts = await PostModel.find(); // Retrieve all posts from the collection
//     res.json(posts);
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ error: "Failed to fetch posts" });
//   }
// });
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




  app.listen(PORT,() => console.log(`Server running on port ${PORT}`))

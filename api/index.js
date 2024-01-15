const express = require('express');
const cors = require('cors');
const User = require('./models/User');
const Post = require('./models/Post');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' });
require('dotenv').config();
const app = express();
const fs = require('fs');

const salt = bcrypt.genSaltSync(10);
const secret = 'fkjdfkjdfkjdk32892jsksakj2kj3';

app.use(cors({credentials:true,origin:'http://localhost:3000'}));
app.use(express.json())
app.use(cookieParser())
app.use('/uploads', express.static(__dirname + '/uploads'));


app.post('/register', async (req,res) => {
    const {username,password} = req.body;
    try{
      const userDoc = await User.create({
        username,
        password:bcrypt.hashSync(password,salt),
      });
      res.json(userDoc);
    } catch(e) {
      console.log(e);
      res.status(400).json(e);
    }
  });

  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      const user = await User.findOne({
        where: {
          username: username,
        },
      });
      if (user) {
        const passOk = bcrypt.compareSync(password, user.password);
  
        if (passOk) {
          const token = jwt.sign({ username, id: user.id }, secret, {});
          res.cookie('token', token).json({
            id: user.id,
            username,
          });
        } else {
          res.status(400).json('Wrong credentials');
        }
      } else {
        res.status(400).json('User not found');
      }
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json('Internal Server Error');
    }
  });

app.get('/profile', (req,res) => {
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, (err,info) => {
      if (err) throw err;
      res.json(info);
    });
  });
  
app.post('/logout', (req,res) => {
    res.cookie('token', '').json('ok');
});

app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
    try {
      let newPath = null;
  
      if (req.file) {
        const { originalname, path } = req.file;
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        newPath = `${path}.${ext}`;
        await fs.rename(path, newPath);
      }
  
      const { token } = req.cookies;
      jwt.verify(token, secret, async (err, info) => {
        if (err) throw err;
  
        const { title, summary, content } = req.body;
  
        const postDoc = await Post.create({
          title,
          summary,
          content,
          cover: newPath,
          author: info.id,
        });
  
        res.json(postDoc.toJSON());
      });
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json('Internal Server Error');
    }
  });
  
/*app.post('/post', uploadMiddleware.single('file'), async (req,res) => {
    const {originalname,path} = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path+'.'+ext;
    fs.renameSync(path, newPath);
  
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, async (err,info) => {
      if (err) throw err;
      const {title,summary,content} = req.body;
      const postDoc = await Post.create({
        title,
        summary,
        content,
        cover:newPath,
        author:info.id,
      });
      res.json(postDoc);
    });
});*/

app.put('/post', uploadMiddleware.single('file'), async (req, res) => {
    try {
      let newPath = null;
  
      if (req.file) {
        const { originalname, path } = req.file;
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        newPath = `${path}.${ext}`;
        await fs.rename(path, newPath);
      }
  
      const { token } = req.cookies;
      jwt.verify(token, secret, async (err, info) => {
        if (err) throw err;
  
        const { id, title, summary, content } = req.body;
        const post = await Post.findById(id);
  
        if (!post) {
          return res.status(404).json('Post not found');
        }
  
        const isAuthor = post.author === info.id;
  
        if (!isAuthor) {
          return res.status(400).json('You are not the author');
        }
  
        await post.update({
          title,
          summary,
          content,
          cover: newPath ? newPath : post.cover,
        });
  
        res.json(post.toJSON());
      });
    } catch (error) {
      console.error('Error updating post:', error);
      res.status(500).json('Internal Server Error');
    }
  });

app.get('/post', async (req,res) => {
    try {
        const posts = await Post.findAll({
          include: [{
            model: User,
            attributes: ['username'],
          }],
          order: [['createdAt', 'DESC']],
          limit: 20,
        });
    
        res.json(posts);
      } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json('Internal Server Error');
      }
  });

  
  app.get('/post/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const postDoc = await Post.findByPk(id, {
        include: [{
          model: User,
          attributes: ['username'],
        }],
      });
  
      if (!postDoc) {
        return res.status(404).json('Post not found');
      }
  
      res.json(postDoc);
    } catch (error) {
      console.error('Error fetching post:', error);
      res.status(500).json('Internal Server Error');
    }
  });

app.listen(4000);

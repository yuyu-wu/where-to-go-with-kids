const express = require('express');
const app = express();
const path = require('path');
const engine = require('ejs-mate');
const mongoose = require('mongoose');
const Idea = require('./models/ideas');

mongoose.connect('mongodb://localhost:27017/weekend')
    .then(() => {
        console.log('Mongo connection open!')
    })
    .catch((err) => {
        console.log('Oh no Mongo connection error!')
        console.log(err)
    })

mongoose.connection.on('error', err => {
    console.log('Error after initial connection established!')
    console.log(err)
})

app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/ideas/new', (req, res) => {
    res.render('ideas/new')
})

app.get('/ideas', async (req, res) => {
    const ideas = await Idea.find({});
    res.render('ideas/index', {ideas});
})

app.post('/ideas', async (req, res) => {
    const idea = new Idea(req.body.idea);
    await idea.save();
    // console.log(req.body)
    // res.redirect('/ideas')
    res.send(req.body)
})

app.get('/ideas/:id', async(req, res) => {
    const idea = await Idea.findById(req.params.id)

    if (!idea) {
        return res.redirect('/ideas');
    }
    res.render('ideas/show', {idea});
})

app.get('/register', (req, res) => {
    res.render('users/register')
})

app.get('/login', (req, res) => {
    res.render('users/login')
})

app.listen(3000, () => {
    console.log('Listening on 3000!')
})





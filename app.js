const express = require('express');
const app = express();
const path = require('path');
const engine = require('ejs-mate');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/places')
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

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/places/new', (req, res) => {
    res.render('places/new')
})

app.listen(3000, () => {
    console.log('Listening on 3000!')
})
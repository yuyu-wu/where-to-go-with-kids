const express = require('express');
const app = express();
const path = require('path');
const engine = require('ejs-mate');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const Idea = require('./models/idea');
const catchAsync = require('./error/catchAsync');
const ExpressError = require('./error/ExpressError');
const ideaSchema = require('./schemas.js');

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
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

const validateIdea = (req, res, next) => {
    const {error} = ideaSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

app.get('/', (req, res) => {
    res.render('home')
});

app.get('/ideas/new', (req, res) => {
    res.render('ideas/new')
});

app.get('/ideas', catchAsync(async (req, res) => {
    const ideas = await Idea.find({});
    res.render('ideas/index', {ideas});
}));

app.post('/ideas', validateIdea, catchAsync(async (req, res) => {
    // if (!req.body.idea) {
    //     throw new ExpressError('Invalid Idea Data', 404);
    // }
    const idea = new Idea(req.body.idea);
    await idea.save();
    res.redirect('/ideas')
}));

app.get('/ideas/:id', catchAsync(async(req, res) => {
    const idea = await Idea.findById(req.params.id)
    if (!idea) {
        return res.redirect('/ideas');
    }
    res.render('ideas/show', {idea});
}));

app.get('/ideas/:id/edit', catchAsync(async (req, res) => {
    const idea = await Idea.findById(req.params.id);
    res.render('ideas/edit', {idea});
}));

app.put('/ideas/:id', validateIdea, catchAsync(async (req, res) => {
    const {id} = req.params;
    const idea = await Idea.findByIdAndUpdate(id, {...req.body.idea});
    res.redirect(`/ideas`);
    // res.send('it worked!!!')
}));

app.delete('/ideas/:id', catchAsync(async (req, res) => {
    const {id} = req.params;
    await Idea.findByIdAndDelete(id);
    res.redirect('/ideas');
}));

app.get('/register', (req, res) => {
    res.render('users/register')
});

app.get('/login', (req, res) => {
    res.render('users/login')
});

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
});

app.use((err, req, res, next) => {
    const {statusCode = 500} = err;
    if (!err.message) {
        err.message = 'Something went wrong!';
    }
    res.status(statusCode).render('error', {err});
    // res.status(statusCode).send('oh no')
});

app.listen(3000, () => {
    console.log('Listening on 3000!')
});





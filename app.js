if (process.env.NODE_ENV != 'production') {
    require('dotenv').config();
}
console.log(process.env.SECRET);

const express = require('express');
const app = express();
const path = require('path');
const engine = require('ejs-mate');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const Idea = require('./models/idea');
const catchAsync = require('./error/catchAsync');
const ExpressError = require('./error/ExpressError');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const {isLoggedIn, validateIdea, isAuthor} = require('./middleware');
const mongoSanitize = require('express-mongo-sanitize');
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/weekend';

const MongoStore = require('connect-mongo');  // store sessions in mongo instead of memory

mongoose.connect(dbUrl)
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
app.use(mongoSanitize());  // prevent mongo injection

const secret = process.env.SECRET || 'thisisasecret';

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret
    }
});

store.on('error', function(e) {
    console.log('SESSION STORE ERROR', e);
})

const sessionConfig = {
    store,
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        name: 'session',
        httpOnly: true,  // our session cookies are only accessible over http (not through JS)
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    console.log(req.query)
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

// app.get('/fakeuser', async(req, res) => {
//     const user = new User({email: 'colt@mail.com', username: 'colt'})
//     const newUser = await User.register(user, 'chicken')
//     res.send(newUser)
// })
app.get('/', (req, res) => {
    res.render('home');
});

app.get('/ideas/new', isLoggedIn, (req, res) => {
    res.render('ideas/new');
});

app.get('/ideas', catchAsync(async (req, res) => {
    const ideas = await Idea.find({});
    res.render('ideas/index', {ideas});
}));

app.post('/ideas', isLoggedIn, validateIdea, catchAsync(async (req, res) => {
    // if (!req.body.idea) {
    //     throw new ExpressError('Invalid Idea Data', 404);
    // }
    const idea = new Idea(req.body.idea);
    idea.author = req.user._id;
    await idea.save();
    req.flash('success', 'Successfully created a new weekend idea');
    res.redirect('/ideas');
}));

app.get('/ideas/:id', catchAsync(async(req, res) => {
    const idea = await Idea.findById(req.params.id).populate('author');
    console.log(idea);
    console.log(req.user)
    if (!idea) {
        req.flash('error', 'Cannot find the weekend idea');
        return res.redirect('/ideas');
    }
    res.render('ideas/show', {idea});
}));

app.get('/ideas/:id/edit', isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    const {id} = req.params;
    const idea = await Idea.findById(id);
    if (!idea) {
        req.flash('error', 'Cannot find the weekend idea');
        return res.redirect('/ideas');
    }
    res.render('ideas/edit', {idea});
}));

app.put('/ideas/:id', isLoggedIn, isAuthor, validateIdea, catchAsync(async (req, res) => {
    const {id} = req.params;
   
    await Idea.findByIdAndUpdate(id, {...req.body.idea});
    req.flash('success', 'Successfully updated the weekend idea');
    res.redirect(`/ideas`);
    // res.send('it worked!!!')
}));

app.delete('/ideas/:id', isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    const {id} = req.params;
    await Idea.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted weekend idea');
    res.redirect('/ideas');
}));

app.get('/register', (req, res) => {
    res.render('users/register');
});

app.post('/register', catchAsync(async(req, res, next) => {
    try {
        const {username, password, email} = req.body;
        const user = new User({username, email});
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) {
                return next(err);
            }
            req.flash('success', 'Successfully created a new account');
            res.redirect('/ideas');
        })
    } catch(e) {
        req.flash('error', e.message);
        res.redirect('register');
    }
    
}))

app.get('/login', (req, res) => {
    res.render('users/login');
});

app.post('/login', passport.authenticate('local', {failureFlash: true, failureRedirect: '/login'}), (req, res) => {
    req.flash('success', 'Welcome back');
    console.log(req.user)
    res.redirect('/ideas');
})

app.get('/logout', (req, res, next) => {
    req.logout(err => {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Successfully logged out');
        res.redirect('/ideas');
    });
})

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

app.use((err, req, res, next) => {
    const {statusCode = 500} = err;
    if (!err.message) {
        err.message = 'Something went wrong!';
    }
    res.status(statusCode).render('error', {err});
    // res.status(statusCode).send('oh no')
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});





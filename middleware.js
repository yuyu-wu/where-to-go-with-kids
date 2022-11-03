const {ideaSchema} = require('./schemas.js');
const ExpressError = require('./error/ExpressError');
const Idea = require('./models/idea');

module.exports.isLoggedIn = (req, res, next) => {
    // console.log(req.user);
    if (!req.isAuthenticated()) {
        req.flash('error', 'Please sign in first');
        return res.redirect('/login');
    }
    next();
}

module.exports.validateIdea = (req, res, next) => {
    const {error} = ideaSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.isAuthor = async (req, res, next) => {
    const {id} = req.params;
    const idea = await Idea.findById(id);
    if (!idea.author._id.equals(req.user._id)) {
        req.flash('error', 'You do not have permission');
        return res.redirect(`/ideas/${id}`);
    }
    next();
}
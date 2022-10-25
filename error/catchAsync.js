module.exports = (func) => {
    return (req, res, next) => {
        func(req, res, next).catch(next);   // execute the passed in func and catch any error and pass to next
    }
}
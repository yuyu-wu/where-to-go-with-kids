const Joi = require('joi');

module.exports.ideaSchema = Joi.object({
    idea: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required()
    }).required()
});
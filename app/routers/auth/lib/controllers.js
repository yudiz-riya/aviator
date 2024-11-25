// const User = require('../../../../../models/index');
const { User } = require('../../../models/index');
const log = require('../../../../globals/lib/log');
const helper = require('../../../../globals/lib/helper');

const controllers = {};

controllers.userRegister = async (req, res) => {
    try {
        const body = _.pick(req.body, ['sEmail', 'sPassword', 'sUsername']);
        if (!body.sPassword) {
            return res.reply({ code: 400, message: 'Password is required' });
        }
        body.sPassword = _.encryptPassword(body.sPassword); 
        await new User({
            email: body.sEmail,
            password: body.sPassword,
            username: body.sUsername
        }).save();
        return res.reply({ code: 200, message: 'User Registered' });
    } catch (error) {
        log.error('Error registering user:', error);
        return res.reply({ code: 500, message: 'Error registering user' });
    }
};

controllers.userLogin = async (req, res) => {
    const body = _.pick(req.body, ['sEmail', 'sPassword']);
    const query = {
        email: body.sEmail, 
    };

    try {
        const user = await User.findOne(query);
        if (!user) return res.reply({ code: 404, message: messages.not_found('User') });

        if (user.eStatus === 'n') return res.reply({ code: 403, message: messages.blocked('User') });
        if (user.eStatus === 'd') return res.reply({ code: 403, message: messages.deleted('User') });

        if (!helper.comparePassword(body.sPassword, user.password)) {
            return res.reply({ code: 403, message: "Invalid credentials." }); 
        }

        user.sToken = _.encodeToken({ email: user.email, _id: user._id }, { expiresIn: '24h' });
        await user.save();
        return res.reply({ code: 200, message: messages.successfully('User logged in'), data: { authorization: user.sToken } });
    } catch (error) {
        log.error('Error logging in user:', error);
        return res.reply({ code: 500, message: 'Error logging in user' });
    }
};

controllers.getUserProfile = async (req, res) => {
    try{
        return res.reply(messages.successfully('User details get'));
    } catch(error) {
        log.error('🚀 ~ file: controllers.js:133 ~ controllers.adminLogin= ~ error:', error);
        _.errorHandler(error, 'login', res);
    }
};

module.exports = controllers;

// const User = require('../../../../../models/index');
const { User } = require('../../../../../models/index');

const controllers = {};

controllers.userRegister = async (req, res) => {
    try {
        const body = _.pick(req.body, ['sEmail', 'sPassword', 'sUsername']);

        if (_.isEmail(body.sEmail)) return res.reply(messages.custom.invalid_email);
        if (_.isPassword(body.sPassword)) return res.reply(messages.custom.invalid_password);
        if (_.isUserName(body.sUsername)) return res.reply(messages.custom.invalid_username);

        body.sPassword = _.encryptPassword(body.sPassword);

        await new User(body).save();
        return res.reply(messages.successfully('User Registered'));
    } catch (error) {
        log.error('🚀 ~ file: controllers.js:113 ~ controllers.register= ~ error:', error);
        return res.reply(messages.server_error(), error.toString());
    }
};

controllers.userLogin = async (req, res) => {
    const body = _.pick(req.body, ['sEmail', 'sPassword']);
    const query = {
        sEmail: body.sEmail,
    };

    try {
        const user = await User.findOne(query);
        if (!user) return res.reply(messages.not_found('User'));

        //  const sPassword = _.encryptPassword(body.sPassword);
        if (user.eStatus === 'n') return res.reply(messages.blocked('User'));
        if (user.eStatus === 'd') return res.reply(messages.deleted('User'));

        if (_.encryptPassword(body.sPassword) !== user.sPassword) return res.reply(messages.wrong_credentials());

        user.sToken = _.encodeToken({ sEmail: user.sEmail, _id: user._id }, { expiresIn: '24h' });
        await user.save();
        return res.reply(messages.successfully('User logged in'), { authorization: user.sToken }, { authorization: user.sToken });
    } catch (error) {
        log.error('🚀 ~ file: controllers.js:133 ~ controllers.adminLogin= ~ error:', error);
        _.errorHandler(error, 'login', res);
    }
};

module.exports = controllers;

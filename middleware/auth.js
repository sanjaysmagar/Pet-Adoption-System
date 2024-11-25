const jwt = require('jsonwebtoken');
const shelterModel = require('../routes/shelters')

const auth = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        const verifyUser = jwt.verify(token, "abcdefghijklmnopqrstuvwzyzabcdefghijkl");
        console.log(verifyUser);

        const user = await shelterModel.findOne({ _id: verifyUser._id });
        console.log(user.firstName, ": hehe");

        req.token = token;
        req.user = user;

        next();
    } catch (error) {
        // res.status(401).send(error);
        res.redirect('/login')
    }
}

module.exports = auth;
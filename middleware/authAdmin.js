const jwt = require('jsonwebtoken');
const adminModel = require('../routes/admin')

const authAdmin = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        const verifyUser = jwt.verify(token, "abcdefghijklmnopqrstuvwzyzabcdefghijk");
        console.log(verifyUser);

        const user = await adminModel.findOne({ _id: verifyUser._id });
        // console.log(user.username, ": shehe");

        req.token = token;
        req.user = user;

        next();
    } catch (error) {
        // res.status(401).send(error);
        res.redirect('/login')
    }
}

module.exports = authAdmin;
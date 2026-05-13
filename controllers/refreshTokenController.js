const usersDB = {
    users: require('../model/users.json'),
    setUsers: (_users) => {
        usersDB.users = _users;
    }
} 

const jwt = require('jsonwebtoken');
require('dotenv').config();

const refreshTokenController = {
    refreshToken: async (req, res) => {
        //look for the refresh token in the cookies
        const cookies = req.cookies;

        if(!cookies?.refreshToken) {
            return res.status(401);
        }

        console.log(cookies.refreshToken);
        const _refreshToken = cookies.refreshToken;

        //check if the refresh token exists in the users record
        const userExists = usersDB.users.find(_user => _user.refreshToken === _refreshToken);
       
        if(!userExists) {
           return res.status(403);
        }

        //evaluate the refresh token
        jwt.verify(_refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
            //check if there is an error or if the user is not the same as the one in the token
            if (err || userExists.email !== decoded.user) {
                return res.status(403);
            }

            //if everything is ok, then create a new access token
            const token = jwt.sign({ user: userExists.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '60s' });
            res.status(200).json({accessToken: token});


        });

      

    }

}
module.exports = refreshTokenController;
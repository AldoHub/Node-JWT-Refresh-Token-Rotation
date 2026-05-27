/*
const usersDB = {
    users: require('../model/users.json'),
    setUsers: (_users) => {
        usersDB.users = _users;
    }
} 
*/

const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const User = require('../db_models/User');
require('dotenv').config();

const fsPromises = require('fs').promises;
const path = require('path');



const loginController = {
    login: async (req, res) => {
    
        //look for cookies
        const cookies = req.cookies;
        const {user, pwd} = req.body;
        console.log("LOGIN", user, pwd);
       
        if(!user || !pwd) {
            res.status(400).json({ message: 'User and password are required' });
            return;
        }
        const userExists = await User.findOne({user}).catch(err => console.log(err));
        //console.log("USER EXISTS", userExists);
             
        if(!userExists) {
            res.status(401).json({ message: 'User does not exist' });
            return;
        }
        try {
            const valid = await bcrypt.compare(pwd, userExists.password);
            //console.log("VALID", valid);
            if(valid) {
                
                const token = jwt.sign({ user: userExists.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '20s' });
                const refreshToken = jwt.sign({ user: userExists.email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
                //console.log("REFRESH TOKEN", refreshToken);
               
                if(cookies?.refreshToken) {
                    //clear the cookies
                    res.clearCookie('refreshToken', {
                        httpOnly: true,
                        secure: true,
                        sameSite: 'None',
                        //maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
                    });
                }

                //add the refresh token to the user
                const newUserToken = await User.findByIdAndUpdate(userExists._id, {$set: {refreshToken}}).catch(err => console.log(err));
              
                //send the refresh token to the client as a cookie
                res.cookie('refreshToken', refreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none',
                    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
                });
                
                return res.status(200).json({accessToken: token});

            }
            res.status(401).json({ message: 'Invalid password' });
        } catch (err) {
            res.status(500).json({ message: 'Error logging in' });
        }



    }

}
module.exports = loginController;

// aldo - Abc123!@


//TODO COOKIE IS NOT BEING SENT
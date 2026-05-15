const usersDB = {
    users: require('../model/users.json'),
    setUsers: (_users) => {
        usersDB.users = _users;
    }
} 

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const fsPromises = require('fs').promises;
const path = require('path');



const loginController = {
    login: async (req, res) => {

        //look for cookies
        const cookies = req.cookies;
        const {user, pwd} = req.body;
       
        if(!user || !pwd) {
            res.status(400).json({ message: 'User and password are required' });
            return;
        }
        const userExists = usersDB.users.find(_user => _user.email === user);
              
        if(!userExists) {
            res.status(401).json({ message: 'User does not exist' });
            return;
        }
        try {
            const valid = await bcrypt.compare(pwd, userExists.password);
            if(valid) {
                
                const token = jwt.sign({ user: userExists.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '60s' });
                const refreshToken = jwt.sign({ user: userExists.email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
                console.log("REFRESH TOKEN", refreshToken);
               
                const users = usersDB.users.filter(user => user.email !== userExists.email);
                
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
                const currentUser = {...userExists, refreshToken};

                //reset the users file
                usersDB.setUsers([...users, currentUser]);

                await fsPromises.writeFile(
                    path.join(__dirname, '../model/users.json'),
                    JSON.stringify(usersDB.users)
                ).catch(err => {
                    res.status(500).json({ message: 'Error saving users to file' });
                });

                //send the refresh token to the client as a cookie
                res.cookie('refreshToken', refreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'None',
                    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
                });

                //return the access token
                res.status(200).json({accessToken: token});
                return;
            }
            res.status(401).json({ message: 'Invalid password' });
        } catch (err) {
            res.status(500).json({ message: 'Error logging in' });
        }



    }

}
module.exports = loginController;

// aldo - Abc123!@
/*
const usersDB = {
    users: require('../model/users.json'),
    setUsers: (_users) => {
        usersDB.users = _users;
    }
} 

*/

const fsPromises = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');
const User = require('../db_models/User');


const registerController = {
    register: async (req, res) => {
        const {user, pwd} = req.body;
        console.log(user, pwd);

        if (!user || !pwd) {
            res.status(400).json({ message: 'User and password are required' });
            return;
        }

        const userExists = await User.findOne({user}).catch(err => console.log(err));
        console.log("USER EXISTS", userExists);

        
        if (userExists) {
            res.status(409).json({ message: 'User already exists' });
            return;
        }

        try {
            const hashedPassword = await bcrypt.hash(pwd, 10);
            const newUser = new User({
                user,
                password: hashedPassword,
                createdAt: Date.now(),
                refreshToken: ''
            });
            const createdUser = await newUser.save();
            if (!createdUser) {
                res.status(500).json({ message: 'Error creating user' });
                return;
            }

            /*
            usersDB.setUsers([...usersDB.users, newUser]);
            await fsPromises.writeFile(
                path.join(__dirname, '../model/users.json'),
                JSON.stringify(usersDB.users)
            ).catch(err => {
                res.status(500).json({ message: 'Error saving users to file' });
            });
            */
            
            res.status(201).json({ message: 'User created' });
              
        } catch (err) {
            res.status(500).json({ message: 'Error creating user' });
        }
       

    }
}

module.exports = registerController;
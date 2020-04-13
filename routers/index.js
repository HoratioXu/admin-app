const express = require('express');
const md5 = require('blueimp-md5');

const UserModel = require('../models/UserModel');
const CategoryModel = require('../models/CategoryModel');
const ProductModel = require('../models/ProductModel');
const RoleModel = require('../models/RoleModel');

const router = express.Router();

router.post('/login', (req, res) => {
    const {username, password} = req.body;
    UserModel.findOne({username, password: md5(password)})
        .then(user => {
            if (user) {
                res.cookie('userid', user._id, {maxAge: 1000 * 60 * 60 * 24});
                if (user.role_id) {
                    RoleModel.findOne({_id: user.role_id})
                        .then(role => {
                            user._doc.role = role;
                            console.log('role user', user);
                            res.send({status: 0, data: user});
                        })
                } else {
                    user._doc.role = {menus: []};
                    res.send({status: 0, data: user});
                }

            } else {
                res.send({status: 1, msg: 'Incorrect username or password!'});
            }
        })
        .catch(error => {
            console.error('login error', error);
            res.send({status: 1, msg: 'Login error, please try again'})
        })
});

router.post('/manage/user/add', (req, res) => {
    const {username, password} = req.body;
    UserModel.findOne({username})
        .then(user => {
            if (user) {
                res.send({status: 1, msg: 'The username is taken, please try another'});
                return new Promise(() => {
                })
            } else {
                return UserModel.create({...req.body, password: md5(password || 'salt')});
            }
        })
        .then(user => {
            res.send({status: 0, data: user});
        })
        .catch(error => {
            console.error('create user error', error);
            res.send({status: 1, msg: 'Register error, please try again'})
        });
});


router.post('/manage/user/update', (req, res) => {
    const user = req.body;
    UserModel.findOneAndUpdate({_id: user._id}, user)
        .then(oldUser => {
            const data = Object.assign(oldUser, user);
            res.send({status: 0, data});
        })
        .catch(error => {
            console.error('update user error', error);
            res.send({status: 1, msg: 'Update user error, please try again'});
        });
});

router.post('/manage/user/delete', (req, res) => {
    const {userId} = req.body;
    UserModel.deleteOne({_id: userId})
        .then((doc) => {
            res.send({status: 0});
        });
});

router.get('/manage/user/list', (req, res) => {
    UserModel.find({username: {'$ne': 'admin'}})
        .then(users => {
            RoleModel.find().then(roles => {
                res.send({status: 0, data: {users, roles}});
            });
        })
        .catch(error => {
            console.error('get user list error', error);
            res.send({status: 1, msg: 'Failed to get user list, please try again'});
        });
});

module.exports = router;


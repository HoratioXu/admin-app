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

router.post('/manage/role/add', (req, res) => {
    const {roleName} = req.body;
    RoleModel.create({name: roleName})
        .then(role => {
            res.send({status: 0, data: role})
        })
        .catch(error => {
            console.error('create role error', error);
            res.send({status: 1, msg: 'Failed to create role, please try again'});
        });
});

router.get('/manage/role/list', (req, res) => {
    RoleModel.find()
        .then(roles => {
            res.send({status: 0, data: roles});
        })
        .catch(error => {
            console.error('get role list error', error);
            res.send({status: 1, msg: 'Failed to get role list, please try again'});
        });
});

router.post('/manage/role/update', (req, res) => {
    const role = req.body;
    role.auth_time = Date.now();
    RoleModel.findOneAndUpdate({_id: role._id}, role)
        .then(oldRole => {
            // console.log('---', oldRole._doc)
            res.send({status: 0, data: {...oldRole._doc, ...role}});
        })
        .catch(error => {
            console.error('update role error', error);
            res.send({status: 1, msg: 'Failed to update role, please try again'});
        });
});

router.post('/manage/category/add', (req, res) => {
    const {categoryName, parentId} = req.body;
    CategoryModel.create({name: categoryName, parentId: parentId || '0'})
        .then(category => {
            res.send({status: 0, data: category});
        })
        .catch(error => {
            console.error('create category error', error);
            res.send({status: 1, msg: 'Failed to create category, please try again'});
        });
});

router.get('/manage/category/list', (req, res) => {
    const parentId = req.query.parentId || '0';
    CategoryModel.find({parentId})
        .then(categories => {
            res.send({status: 0, data: categories});
        })
        .catch(error => {
            console.error('get category list error', error);
            res.send({status: 1, msg: 'Failed to get category list, please try again'});
        });
});

router.post('/manage/category/update', (req, res) => {
    const {categoryId, categoryName} = req.body;
    CategoryModel.findOneAndUpdate({_id: categoryId}, {name: categoryName})
        .then(oldCategory => {
            res.send({status: 0});
        })
        .catch(error => {
            console.error('update category error', error);
            res.send({status: 1, msg: 'Failed to update category, please try again'});
        });
});

router.get('/manage/category/info', (req, res) => {
    const categoryId = req.query.categoryId;
    CategoryModel.findOne({_id: categoryId})
        .then(category => {
            res.send({status: 0, data: category});
        })
        .catch(error => {
            console.error('get category info error', error);
            res.send({status: 1, msg: 'Failed to get category info, please try again'});
        })
});

router.post('/manage/product/add', (req, res) => {
    const product = req.body;
    ProductModel.create(product)
        .then(product => {
            res.send({status: 0, data: product});
        })
        .catch(error => {
            console.error('add product error', error);
            res.send({status: 1, msg: 'Failed to add product, please try again'});
        })
});

router.get('/manage/product/list', (req, res) => {
    const {pageNum, pageSize} = req.query;
    ProductModel.find({})
        .then(products => {
            res.send({status: 0, data: pageFilter(products, pageNum, pageSize)});
        })
        .catch(error => {
            console.error('get product list error', error);
            res.send({status: 1, msg: 'Failed to get product list, please try again'})
        });
});

router.get('/manage/product/search', (req, res) => {
    const {pageNum, pageSize, searchName, productName, productDesc} = req.query;
    let condition = {};
    if (productName) {
        condition = {name: new RegExp(`^.*${productName}.*$`)}
    } else if (productDesc) {
        condition = {desc: new RegExp(`^.*${productDesc}.*$`)}
    }
    ProductModel.find(condition)
        .then(products => {
            res.send({status: 0, data: pageFilter(products, pageNum, pageSize)});
        })
        .catch(error => {
            console.error('search product error', error);
            res.send({status: 1, msg: 'Failed to search product, please try again'})
        });
});

router.post('/manage/product/update', (req, res) => {
    const product = req.body;
    ProductModel.findOneAndUpdate({_id: product._id}, product)
        .then(oldProduct => {
            res.send({status: 0})
        })
        .catch(error => {
            console.error('update product error', error);
            res.send({status: 1, msg: 'Failed to update product, please try again'});
        });
});

router.post('/manage/product/updateStatus', (req, res) => {
    const {productId, status} = req.body;
    ProductModel.findOneAndUpdate({_id: productId}, {status})
        .then(oldProduct => {
            res.send({status: 0});
        })
        .catch(error => {
            console.error('change product status error', error);
            res.send({status: 1, msg: 'Failed to change product status, please try again'})
        });
});

function pageFilter(arr, pageNum, pageSize) {
    pageNum = pageNum * 1;
    pageSize = pageSize * 1;
    const total = arr.length;
    const pages = Math.floor((total + pageSize - 1) / pageSize);
    const start = pageSize * (pageNum - 1);
    const end = start + pageSize <= total ? start + pageSize : total;
    const list = [];
    for (let i = start; i < end; i++) {
        list.push(arr[i]);
    }
    return {
        pageNum,
        total,
        pages,
        pageSize,
        list
    }
}

require('./file-upload')(router);

module.exports = router;


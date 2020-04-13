const express = require('express');
const md5 = require('blueimp-md5');

const UserModel = require('../models/UserModel');
const CategoryModel = require('../models/CategoryModel');
const ProductModel = require('../models/ProductModel');
const RoleModel = require('../models/RoleModel');

const router = express.Router();

module.exports = router;


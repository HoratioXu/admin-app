const mongoose = require('mongoose');
const express = require('express');
const server = express();

server.use(express.static('public'));
server.use(express.urlencoded({extended: true}));
server.use(express.json());
const cookieParser = require('cookie-parser');
server.use(cookieParser());
const indexRouter = require('./routers');
server.use('/api', indexRouter);

const fs = require('fs');


server.use((req, res) => {
    fs.readFile(__dirname + '/public/index.html', (err, data)=>{
        if(err){
            console.log(err);
            res.send('server error')
        } else {
            res.writeHead(200, {
                'Content-Type': 'text/html; charset=utf-8',
            });
            res.end(data)
        }
    });
});

mongoose.connect('mongodb://localhost/admin-panel', {useNewUrlParser: true})
    .then(() => {
        console.log('MongoDB connect success');
        server.listen('5000', () => {
            console.log('Server success: http://localhost:5000');
        });
    })
    .catch(error => {
        console.error('Failed to connect to MongoDB', error);
    });

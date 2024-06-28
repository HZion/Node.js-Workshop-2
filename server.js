// DB Setup
const { setup } = require('./db_setup');

// express
const express = require('express');
const app = express();

// session
const session = require('express-session');
app.use(session({
    secret: 'HelloWorld',
    resave: false,
    saveUninitialized: false,
}));

// cookieParser
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// bodyParsers
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

// routes
app.use('/', require('./routes/account'));
app.use('/', require('./routes/post'));

//dotenv
const dotenv = require('dotenv').config();

// listen
app.listen(process.env.WEB_PORT, async () => {
    await setup();
    console.log(`http://127.0.0.1:${process.env.WEB_PORT} 서버가 준비되었습니다...`);
});

// home, index
app.get('/', async (req, res) => {
    try {
        if (!req.session.user) {
            res.clearCookie('uid', { path: '/' });
        }

        res.render('index.ejs');
    } catch (err) {
        res.status(500).send('DB Fail.');
    }
});
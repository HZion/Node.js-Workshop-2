const router = require('express').Router();
const { setup } = require('../db_setup');

const sha = require('sha256');
const cache = require('memory-cache')
const moment = require("moment");

function cacheMiddleware(duration) {
    return (req, res, next) => {
        const key = '__express__' + req.originalUrl || req.url;
        const cachedBody = cache.get(key);

        //console.log(cachedBody)

        if (cachedBody) {
            res.send(cachedBody);
            console.log('Use Cache')
        } else {
            res.sendResponse = res.send;
            res.send = (body) => {
                cache.put(key, body, duration * 1000);
                res.sendResponse(body);
            };
            next();
        }
    };
}

function dateFormat(date) {
    return moment(date).format('YYYY-MM-DD HH:mm:ss')
}

router.get('/list', cacheMiddleware(10), async (req, res) => {
    const { mysqldb} = await setup()
    try{
        let [rows, fields] = await mysqldb.promise().query('select * from post');

        for (row of rows) {
            row.created = dateFormat(row.created)
        }
        console.log('불러오기');

        res.render('list.ejs', { data: rows });
    } catch (e) {
        console.log(e)
    }
})

module.exports = router;

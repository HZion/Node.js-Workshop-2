const router = require('express').Router();
const { setup } = require('../db_setup');

const sha = require('sha256');
const cache = require('memory-cache')
const moment = require("moment");

function cacheMiddleware(duration) {
    return (req, res, next) => {
        const key = '__express__' + req.originalUrl || req.url;
        const cachedBody = cache.get(key);

        // console.log(cachedBody)

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
    if (!req.session.user) {
        return res.redirect('/');
    }
    
    const { mysqldb } = await setup()
    try{
        let [rows, fields] = await mysqldb.promise().query('select * from post');

        for (row of rows) {
            row.created = dateFormat(row.created)
        }
        console.log('불러오기');
        res.render('post/list.ejs', { data: rows })
    } catch (e) {
        console.log(e)
    }
})

router.get('/enter', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    res.render('post/enter.ejs');
});

router.post('/save', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    // 세션 유저의 정보를 가져오기
    let account_id;
    const { mysqldb } = await setup();
    let sql = 'SELECT id FROM account WHERE userid=?';
    try {
        const [rows, fields] = await mysqldb.promise().query(sql, [req.session.user.userid]);

        if (rows.length == 0) {
            return res.render('index.ejs', { data: { alertMsg: '다시 로그인 해주세요.' } });
        }

        account_id = rows[0].id;
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }

    // post 저장
    sql = `INSERT INTO post (title, content, created, account_id) VALUES (?, ?, ?, ?)`;
    
    try {
        const [rows, fields] = await mysqldb.promise().query(sql, [req.body.title, req.body.content, new Date(), account_id]);
        console.log('Post 테이블에 저장 성공.');
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }

    res.redirect('/post/list');
});

module.exports = router;

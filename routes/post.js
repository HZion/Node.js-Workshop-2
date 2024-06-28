const router = require('express').Router();
const { setup } = require('../db_setup');

const sha = require('sha256');

router.get('/post/list', async (req, res) => {
    if (!req.session.user) {
        res.clearCookie('uid', { path: '/' });
        return res.render('index.ejs', { data: { alertMsg: '로그인을 해주세요' } });
    }

    // const { mongodb } = await setup();
    // list(mongodb, req, res);
})

// function list(mongodb, req, res) {
//     mongodb.collection('post').find().toArray().then((posts) => {
//         res.render('list.ejs', { data: posts });
//     })
// }

module.exports = router;
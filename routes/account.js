const router = require('express').Router();
const { setup } = require('../db_setup');

const sha = require('sha256');
const throttle = require("express-throttle");
const { body } = require('express-validator');
const { validatorErrorChecker } = require('../middleware/validator');

// 8 - 12  소문자 숫자 특수문자 포함
const regexPw =
    /^[a-z0-9#?!@$%^&*-](?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-])[a-z0-9#?!@$%^&*-]{8,12}$/;

// 회원가입 페이지
router.get('/enter', (req, res) => {
    res.render('enter.ejs');
});

// 회원가입 폼을 받음
/* 기능
1.중복 id 확인
2.회원 가입
 */
router.post('/signup', throttle({
    rate: "1/1m",
    on_throttled: function (req, res, next, bucket){
        res.render('index.ejs', { data: { alertMsg: '1분당 한번만 가입 가능합니다.'}})
    }
}), [
    body('userid').exists().isLength({min: 4}),
    body('userpw').exists().matches(regexPw),
    validatorErrorChecker
], async (req, res) => {
    const { mysqldb } = await setup();

    // 중복 검사 쿼리
    const checkUserQuery = 'SELECT COUNT(*) AS count FROM account WHERE userid = ?';

    mysqldb.query(checkUserQuery, [req.body.userid], (err, results) => {
        if (err) {
            console.error('error during user check: ' + err.stack);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results[0].count > 0) {
            // 중복된 userid가 존재하는 경우
            return res.status(400).json({ error: 'User ID already exists' });
        }

        // 중복된 userid가 없는 경우 회원 가입 진행
        const insertUserQuery = 'INSERT INTO account (userid, userpw, salt, usergroup, useremail) VALUES (?, ?, ?, ?, ?)';

        // Salt
        const generateSalt = (length = 16) => {
        const crypto = require('crypto');
        return crypto.randomBytes(length).toString("hex");
        };
        const salt = generateSalt();
        req.body.userpw = sha(req.body.userpw + salt);

        mysqldb.query(insertUserQuery, [req.body.userid, req.body.userpw, salt, req.body.usergroup, req.body.useremail], (err, results) => {
        if (err) {
            console.error('error during user insertion: ' + err.stack);
            return res.status(500).json({ error: 'Database error' });
        }

        res.render('index.ejs');
      });
    });
  });



// 로그인 페이지
router.get('/login', async (req, res) => {
    try {
        const { mysqldb } = await setup();
        res.send('로그인화면 : 데이터베이스 사용 가능');
    } catch (err) {
        console.log(err);
        res.status(500).send('DB Fail.');
    }
});

// 로그인 처리
router.post('/login', async (req, res) => {
    const { mysqldb } = await setup();
    let sql = 'SELECT userid, userpw, salt FROM account WHERE userid=?';
    mysqldb.query(sql, [req.body.userid], (err, rows, fields) => {
        if (err) {
            return console.error(err);
        }

        if (rows.length == 0) {
            return res.render('index.ejs', { data: { alertMsg: '다시 로그인 해주세요.' } });
        }

        if (rows[0].userpw != sha(req.body.userpw + rows[0].salt)) {
            return res.render('index.ejs', { data: { alertMsg: '다시 로그인 해주세요.' } });
        }

        req.session.user = { userid: req.body.userid };  // 로그인 성공
        res.cookie('uid', req.body.userid);
        return res.redirect('/');
    });
});

// 로그아웃
router.get('/logout', async (req, res) => {
    req.session.destroy();
    res.render('index.ejs');
});

// 회원가입 폼에서 아이디만 중복 검사하기
router.post('/check-id', async function (req, res) {
  try {
      if (req.body.userid == undefined) {
          res.json({ isDuplicate: false });
          return;
      }

      const { mysqldb } = await setup();
      let sql = 'SELECT userid, userpw, salt FROM account WHERE userid=?';
      mysqldb.query(sql, [req.body.userid], (err, rows, fields) => {
          if (err) {
              console.error(err);
              return;
          }

          if (0 < rows.length) {
              return res.json({ isDuplicate: true });
          }

          res.json({ isDuplicate: false });
      });
  } catch (error) {
      console.error('Error checking user ID:', error);
      res.status(500).json({ error: 'An error occurred while checking the user ID.' });
  }
});

module.exports = router;

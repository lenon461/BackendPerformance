const express = require('express');
const jwt = require('jsonwebtoken');

const { verifyToken, apiLimiter } = require('./middlewares');
const { Domain, User, Post, Hashtag } = require('../models');

const router = express.Router();

router.post('/token', apiLimiter , async (req, res) => {
    const { clientSecret } = req.body;
    try {
        console.log(clientSecret);
        const domain = await Domain.find({
            where : { clientSecret },
            include: { 
                model: User,
                attribute: ['nick', 'id'],
            },
        });
        if(!domain){
            return res.status(401).json({
                code: 401,
                message: '등록되지 않은 도메인입니다. 먼저 도메인을 등록하세요 ',
            });
        }
        const token = jwt.sign({
            id: domain.user.id,
            nick: domain.user.nick,
        }, process.env.JWT_SECRET, {
            expiresIn: '30m',
            issuer: 'nodebird',
        });
        return res.json({
            code: 200,
            message: '토큰이 발급되었습니다',
            token,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: '서버 에러',
        });
    }
});

router.get('/test', verifyToken, apiLimiter, (req, res) => {
    res.json(req.decoded);
});

router.get('/posts/my', apiLimiter, verifyToken, (req, res) => {
    Post.findAll({ where: { userId: req.decoded.id } })
    .then((posts) => {
        console.log(posts);
        res.json({
            code: 200,
            payload: posts,
        });
    })
    .catch((error) => {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: '서버 에러',
        });
    });
});

router.get('/posts/hashtag/:title', verifyToken, apiLimiter, async (req, res) => {
    try {
        const hashtag = await Hashtag.find({ where: { title: req.params.title} });
        if( !hashtag ){
            return res.status(404).json({
                code: 404,
                message: '검색 결과가 없습니다',
            });
        }
        const posts = await hashtag.getPosts();
        return res.json({
            code: 200,
            payload: posts,
        });
    } catch (error){
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: '서버 에러',
        });
    }
});

router.get('/follower/:user', verifyToken, apiLimiter, async (req, res) => {
    try {
        const user = await User.find({ where : { nick: req.params.user } });
        if( !user ){
            return res.status(404).json({
                code: 404,
                message: '검색 결과가 없습니다',
            });
        }
        const followers = await user.getFollowers();
        return res.json({
            code: 200,
            payload: followers,
        });
    } catch (error){
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: '서버 에러',
        });
    }
        
});
router.get('/following/:user', verifyToken, apiLimiter, async (req, res) => {
    try {
        const user = await User.find({ where : { nick: req.params.user } });
        if( !user ){
            return res.status(404).json({
                code: 404,
                message: '검색 결과가 없습니다',
            });
        }
        const followers = await user.getFollowings();
        return res.json({
            code: 200,
            payload: followers,
        });
    } catch (error){
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: '서버 에러',
        });
    }
        
});


module.exports = router;

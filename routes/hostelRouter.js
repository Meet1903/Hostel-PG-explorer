const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const hostels = require('../models/hostels');
var authenticate = require('../authenticate');

const hostelRouter = express.Router();

hostelRouter.use(bodyParser.json());

hostelRouter.route('/')
.get((req,res,next) => {
    hostels.find({})
    .populate('comments.author')
    .then((hostels) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(hostels);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    hostels.create(req.body)
    .then((hostel) => {
        console.log('hostel Created ', hostel);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(hostel);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /hostels');
})
.delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    hostels.remove({})
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));    
});

hostelRouter.route('/:hostelId')
.get((req,res,next) => {
    hostels.findById(req.params.hostelId)
    .populate('comments.author')
    .then((hostel) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(hostel);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /hostels/'+ req.params.hostelId);
})
.put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    hostels.findByIdAndUpdate(req.params.hostelId, {
        $set: req.body
    }, { new: true })
    .then((hostel) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(hostel);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    hostels.findByIdAndRemove(req.params.hostelId)
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));
});

hostelRouter.route('/:hostelId/comments')
.get((req,res,next) => {
    hostels.findById(req.params.hostelId)
    .populate('comments.author')
    .then((hostel) => {
        if (hostel != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(hostel.comments);
        }
        else {
            err = new Error('hostel ' + req.params.hostelId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyUser, (req, res, next) => {
    hostels.findById(req.params.hostelId)
    .then((hostel) => {
        if (hostel != null) {
            req.body.author = req.user._id;
            hostel.comments.push(req.body);
            hostel.save()
            .then((hostel) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(hostel);                
            }, (err) => next(err));
        }
        else {
            err = new Error('hostel ' + req.params.hostelId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /hostels/'
        + req.params.hostelId + '/comments');
})
.delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    hostels.findById(req.params.hostelId)
    .then((hostel) => {
        if (hostel != null) {
            for (var i = (hostel.comments.length -1); i >= 0; i--) {
                hostel.comments.id(hostel.comments[i]._id).remove();
            }
            hostel.save()
            .then((hostel) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(hostel);                
            }, (err) => next(err));
        }
        else {
            err = new Error('hostel ' + req.params.hostelId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));    
});

hostelRouter.route('/:hostelId/comments/:commentId')
.get((req,res,next) => {
    hostels.findById(req.params.hostelId)
    .populate('comments.author')
    .then((hostel) => {
        if (hostel != null && hostel.comments.id(req.params.commentId) != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(hostel.comments.id(req.params.commentId));
        }
        else if (hostel == null) {
            err = new Error('hostel ' + req.params.hostelId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Comment ' + req.params.commentId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /hostels/'+ req.params.hostelId
        + '/comments/' + req.params.commentId);
})
.put(authenticate.verifyUser, (req, res, next) => {
    hostels.findById(req.params.hostelId)
    .then((hostel) => {
        if (hostel != null && hostel.comments.id(req.params.commentId) != null 
            && hostel.comments.id(req.params.commentId).author.equals(req.user._id)) {
            if (req.body.rating) {
                hostel.comments.id(req.params.commentId).rating = req.body.rating;
            }
            if (req.body.comment) {
                hostel.comments.id(req.params.commentId).comment = req.body.comment;                
            }
            hostel.save()
            .then((hostel) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(hostel);                
            }, (err) => next(err));
        }
        else if (hostel == null) {
            err = new Error('hostel ' + req.params.hostelId + ' not found');
            err.status = 404;
            return next(err);
        }
        else if (hostel.comments.id(req.params.commentId) == null) {
            err = new Error('Comment ' + req.params.commentId + ' not found');
            err.status = 404;
            return next(err);            
        }
        else {
            err = new Error('you are not authorized to update this comment!');
            err.status = 403;
            return next(err);  
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete(authenticate.verifyUser, (req, res, next) => {
    hostels.findById(req.params.hostelId)
    .then((hostel) => {
        if (hostel != null && hostel.comments.id(req.params.commentId) != null
            && hostel.comments.id(req.params.commentId).author.equals(req.user._id)) {
            hostel.comments.id(req.params.commentId).remove();
            hostel.save()
            .then((hostel) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(hostel);                
            }, (err) => next(err));
        }
        else if (hostel == null) {
            err = new Error('hostel ' + req.params.hostelId + ' not found');
            err.status = 404;
            return next(err);
        }
        else if (hostel.comments.id(req.params.commentId) == null) {
            err = new Error('Comment ' + req.params.commentId + ' not found');
            err.status = 404;
            return next(err);            
        }
        else {
            err = new Error('you are not authorized to delete this comment!');
            err.status = 403;
            return next(err);  
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});


module.exports = hostelRouter;
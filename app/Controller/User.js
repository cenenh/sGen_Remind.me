var User = require('../Model/User');
var _ = require('underscore');
var async = require('async');
var jwt_config = require('../../config/jwt');
var jwt = require('jsonwebtoken');

//for login
module.exports.getUserForLogin = function(req, res){
  var response = {};
  var user = new User();
  user.email = req.body.email;
  user.password = req.body.password;

  user.getUserForLogin(user, function(error, result){
    var token = "";

    async.waterfall([
      function(callback){
        if(error){
          response.code = 501;
          response.data = "SERVER ERROR";
          callback(null, response);
        }
        else if(result.length > 0){
          response.code = 200;
          response.data = "LOGIN OK";
          //response.user = result;
          callback(null, response);
        }
        else{
          response.code = 404;
          response.data = "User Not Found";
          callback(null, response);
        }
      },
      function(response, callback){
        if(response.code === 200){
          jwt.sign(result[0], jwt_config.secret, {}, function(done){
            //3rd parameter, options 필수, option 없어도 {} 필수
            response.token = done;
            callback(null, response);
          });
        }
        else{
          callback(null, response);
        }
      }
    ],function(async_error, response){
      if(!async_error){
        res.json(response);
      }
      else {
        response.err = "some error in server.";
        res.json(response);
      }
    }); //async
  });
};

module.exports.getUserById = function(req, res){
  var response = {};
  var getUser = new User();
  var email = req.body.email;
  console.log("email from req : " + email);

  getUser.getUserById(email, function(err, result){
    console.log("getUserById result : " + result);
    if(err){
      response.code = 404; //user not found
      response.data = "login fail";
    }
    else{
      response.code = 200;
      response.user = result;
    }
    res.json(response);
    delete getUser;
  });
};

module.exports.getAll = function(req, res){
  var myUser = new User();
  myUser.getAll(function (result){
    //console.log(result);
    res.json(result);
    delete myUser;
  });
};

module.exports.addUser = function(req, res){

  var response = {};
  var newUser = new User();
  var access_token = false; //state var

  if(_.isEmpty(req.params)){ //sign-up using email
    newUser.name = req.body.name;
  	newUser.password = req.body.password;
  	newUser.email = req.body.email;
  }
  else{	//sign-up using Facebook or Google
    var req_data = JSON.parse(req.params.user);
  	newUser.name = req_data.name;
  	newUser.password = req_data.password;
  	newUser.email = req_data.email;
    access_token = true;
  }

  newUser.addUser(newUser, function(error, result){
    if(error){
      response.code = 400;
      response.data = "addUser Fail";
      if(error.errno === 1062){
        response.reason = "duplicate-mail";
      }
    }
    else{
      response.code = 200;
      response.data = "addUser OK";
    }

    if(access_token && response.code === 200){ // google & facebook은 토큰을 주어야함..
      console.log(newUser);
      jwt.sign(newUser, jwt_config.secret, {}, function(token){
        response.access_token = token;
        res.json(response);
      });
    }
    else{
      res.json(response);
    }
  });
};

module.exports.deleteUser = function(req, res){
  var response = {};
  var user = new User();
  user.email = req.user.email;
  user.deleteUser(user, function(err, result){
    if(err){
      response.code = 400;
      response.data = "Logout FAIL";
    }
    else{
      response.code = 200;
      response.data = "Logout OK";
    }
    res.json(response);
  });
};

'use strict';

const middy = require('middy');
const { cors } = require('middy/middlewares');
const AWS = require('aws-sdk');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool;
var AuthenticationDetails = AmazonCognitoIdentity.AuthenticationDetails;
var CognitoUser = AmazonCognitoIdentity.CognitoUser;

const bodyParser = require("body-parser");

const request = require('request');
const jwkToPem = require('jwk-to-pem');
const jwt = require('jsonwebtoken');
global.fetch = require('node-fetch');

const configs = require('./configs');

const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({ region: configs.REGION });

function initiateauth(username, password){
      const loginParams = {
        ClientId: configs.CLIENT_ID,
        AuthFlow: configs.AUTHFLOW,
        AuthParameters: {
            USERNAME: username,
            PASSWORD: password
        }
    };

    return cognitoIdentityServiceProvider.initiateAuth(loginParams).promise();
}

function authenticate(username, password) {
    const loginPromise = initiateauth(username, password);

    const responseMapper = (loginResponseInfo) => {
        const authResult = loginResponseInfo.AuthenticationResult;
        const tokens = { access_token: authResult.AccessToken, id_token: authResult.IdToken, refresh_token: authResult.RefreshToken };
        return { content: JSON.stringify(tokens) };
    }

    return packageResponse(loginPromise, responseMapper);
}

function packageResponse(awsPromise, responseMapper) {
  return awsPromise
      .then(info => {
          const responseMappedInfo = (responseMapper) ? responseMapper(info) : null;
          var response = { success: true };

          if (responseMappedInfo) {
              response.data = responseMappedInfo;
          }

          return response;
      })
      .catch(err => {
          console.log(err);
          const errMessages = Array.isArray(err) ? err : [(err.message) ? err.message : err];
          return { success: false, errors: errMessages };
      });
}

const login = async (event) => {

  var requestBody = JSON.parse(event.body);
  var username = requestBody.email.replace(/[@.]/g, '|');
  var password = requestBody.password;

  if((username == null)||(password == null)){
    return {
       statusCode: 500,
        body: JSON.stringify(
          {
            message: 'Error! Invalid Request Parameters.',
          },
          null,
          2
        ),
    };
  }

  const userPool = new CognitoUserPool({
    UserPoolId: configs.USERPOOL_ID,
    ClientId: configs.CLIENT_ID
  });

  const authenticationData = {
    Username: username,
    Password: password
  };

  const cognitoUser = new CognitoUser({ Username: username, Pool: userPool });
  const authenticationDetails = new AuthenticationDetails(authenticationData);

  const loginParams = {
      ClientId: configs.CLIENT_ID,
      AuthFlow: configs.AUTHFLOW,
      AuthParameters: {
          USERNAME: username,
          PASSWORD: password
      }
  };

  console.log(loginParams);

  try {
      let result = await authenticate(username, password);

      var content = result.data.content;
      var tokens = JSON.parse(content);
      console.log(tokens);

      return {
       statusCode: 200,
        body: JSON.stringify(
          {
            access_token: tokens["access_token"],
            id_token: tokens["id_token"],
            refresh_token: tokens["refresh_token"]
          },
          null,
          2
        ),
      };
    }catch (error) {
        console.log(error.message)
    }

};

/*
const signin = middy(login)
  .use(cors()) // Adds CORS headers to responses*/

module.exports = { login }

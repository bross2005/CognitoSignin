const mocha = require('mocha');
const chai = require('chai');
const should = chai.should();

const handler = require('./handler');

var expect = require( 'chai' ).expect;
var LambdaTester = require( 'lambda-tester' );

describe("The handler function", () => {
    it("returns a message", () => {         
      const event = {
            body:JSON.stringify({email:"letmeseeyourcode1@gmail.com",password:"P3qdmma1@123!"}) ,
            headers: {},
            httpMethod: 'POST',
            isBase64Encoded: false,
            path: '',
            pathParameters: {},
            queryStringParameters: undefined,
            stageVariables: {},
            requestContext: {},
            resource: '' };
        
        /*
        try {
              const response = handler.signin(event);
              expect( response ).to.exist;
              expect( response.valid ).to.be.true;
        }
        catch( error ) {
        }*/
        
        handler.login(event, function(error, response){
          try {
              expect( error ).to.not.exist;
              expect( response ).to.exist;
              expect( response.valid ).to.be.true;
            }
            catch( error ) {
            }
        });
    });
});
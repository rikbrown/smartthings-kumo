const OAuth2Server = require('oauth2-server');

const oauth = new OAuth2Server({
    model: require('./model')
});

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    if (event['rawPath'] == '/auth') {
        let state = event['queryStringParameters']['state']
        let redirect = event['queryStringParameters']['redirect_uri']
        let fullRedirect = redirect +
            '?code=' + '123456' +
            '&state=' + state;
        
        return {
            statusCode: 302,
            body: null,
            headers: {
                'Location': fullRedirect
            }
        };
    }

    if (event['rawPath'] == '/token') {
        let body = JSON.stringify({
            "access_token":"1234",
            "token_type":"bearer",
            "expires_in":3600,
            "refresh_token":"5678",
            "scope":"create"
        });
        return {
            statusCode: 200,
            body: body,
            headers: {
                'Content-Type': 'application/json'
            }
        }
    }

    throw 'Unknown path';


    // let request = new OAuth2Server.Request({
    //     method: event['requestContext']['http']['method'],
    //     query: event['queryStringParameters'],
    //     headers: event['headers']
    // });
    // let response = new OAuth2Server.Response();

    // console.log(request);

    // let body;
    // let statusCode = '200';
    // const headers = {
    //     'Content-Type': 'text/plain',
    // };

    // body = 'hello';

    // return oauth.authenticate(request, response)
    //     .then(function(code) {
    //         let r = {
    //             statusCode,
    //             body,
    //             headers,
    //         };
    //         resolve(r)
    //     });
};

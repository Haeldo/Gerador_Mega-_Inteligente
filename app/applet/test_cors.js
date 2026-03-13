import https from 'https';

const req = https.request('https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/1', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'http://localhost:3000',
    'Access-Control-Request-Method': 'GET'
  }
}, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
});

req.on('error', console.error);
req.end();

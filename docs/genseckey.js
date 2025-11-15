const jwt = require('jsonwebtoken');
const fs = require('fs');

// Replace these with your values
const teamId = 'FQVD6NGK4X'; // From Step 1.1
const clientId = 'com.thebetterskin.betterskin.auth'; // From Step 1.4 (e.g., com.yourcompany.facefit.web)
const keyId = 'UQ45NG5636'; // From Step 1.6
const privateKeyPath = './SigninWithAuthKey.p8'; // Path to your downloaded .p8 file

const privateKey = fs.readFileSync(privateKeyPath);

const token = jwt.sign(
  {
    iss: teamId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (86400 * 180), // 6 months in seconds
    aud: 'https://appleid.apple.com',
    sub: clientId,
  },
  privateKey,
  {
    algorithm: 'ES256',
    header: {
      alg: 'ES256',
      kid: keyId,
    },
  }
);

console.log('Client Secret:', token);
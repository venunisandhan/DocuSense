
const { OAuth2Client } = require('google-auth-library');

const env = require('./env');

const googleClient = new OAuth2Client({
  clientId: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  redirectUri: env.GOOGLE_REDIRECT_URI,
});

module.exports = googleClient;
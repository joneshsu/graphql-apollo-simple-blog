'use strict';

const { ForbiddenError } = require('apollo-server');
const jwt = require('jsonwebtoken');

const EXPIRATION_TIME = '1h';

const generateJWT = (user, secret) => (
  { token: jwt.sign({
    me: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  }, secret, { expiresIn: EXPIRATION_TIME }), expiresIn: new Date() }
);

const isAuthenticated = resolverFunc => (parent, args, context) => {
  if (!context.me) throw new ForbiddenError(`Please Login First`);
  return resolverFunc.apply(null, [parent, args, context])
};

module.exports = {
  generateJWT,
  isAuthenticated
};

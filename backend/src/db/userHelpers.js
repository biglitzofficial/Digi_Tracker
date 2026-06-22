const bcrypt = require('bcryptjs');
const store = require('./firestoreStore');
const { COLLECTIONS } = store;

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function attachUserMethods(user) {
  if (!user) return null;
  return {
    ...user,
    comparePassword: async (candidate) => bcrypt.compare(candidate, user.password),
    toJSON: () => {
      const { password, passwordResetToken, passwordResetExpires, ...rest } = user;
      return rest;
    },
  };
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password, passwordResetToken, passwordResetExpires, ...rest } = user;
  return rest;
}

module.exports = { hashPassword, attachUserMethods, sanitizeUser, COLLECTIONS };

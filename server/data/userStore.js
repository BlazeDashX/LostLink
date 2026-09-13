const users = require("../../data/users.json");

async function findUserByEmail(email) {
  return users.find(
    (user) =>
      user.email.toLowerCase() === email.toLowerCase()
  );
}

async function createUser(user) {
  users.push(user);
  return user;
}

module.exports = {
  findUserByEmail,
  createUser,
};
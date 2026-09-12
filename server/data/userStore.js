const users = require("../../data/users.json");

function findUserByEmail(email) {
  return users.find(
    (user) => user.email.toLowerCase() === email.toLowerCase()
  );
}

function createUser(user) {
  users.push(user);

  return user;
}

module.exports = {
  findUserByEmail,
  createUser,
};
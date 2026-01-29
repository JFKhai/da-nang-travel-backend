const { User } = require('../models');

exports.findByEmail = (email) => {
  return User.findOne({ where: { email } });
};

exports.findById = (id, options = {}) => {
  return User.findByPk(id, options);
};

exports.create = (data) => {
  return User.create(data);
};

exports.update = (user, data) => {
  return user.update(data);
};

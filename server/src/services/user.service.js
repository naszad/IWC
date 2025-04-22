// services/user.service.js
const { User } = require('../models');

exports.list  = ()           => User.findAll({ attributes: { exclude: ['password_hash'] } });
exports.get   = (id)         => User.findByPk(id, { attributes: { exclude: ['password_hash'] } });
exports.update = (id, data)  => User.update(data, { where: { id }, returning: true });
exports.remove = (id)        => User.destroy({ where: { id } });

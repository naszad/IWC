var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const config = require('./config');
var cors = require('cors');

var authRouter = require('./routes/auth.routes');
var studentRouter = require('./routes/student.routes');
var instructorRouter = require('./routes/instructor.routes');
var adminRouter = require('./routes/admin.routes');
var errorHandler = require('./middleware/error.middleware');

var app = express();

// Sequelize initialization
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(config.databaseUrl, { dialect: 'postgres', logging: false });
sequelize.authenticate()
  .then(() => console.log('Database connected...'))
  .then(() => sequelize.sync())
  .then(() => console.log('Database synced'))
  .catch(err => console.error('Unable to connect to DB:', err));

app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/auth', authRouter);
app.use('/student', studentRouter);
app.use('/instructor', instructorRouter);
app.use('/admin', adminRouter);

// global error handler
app.use(errorHandler);

// Define a helper to normalize the port into a number, string, or false
function normalizePort(val) {
  const port = parseInt(val, 10);
  if (isNaN(port)) {
    // named pipe
    return val;
  }
  if (port >= 0) {
    // port number
    return port;
  }
  return false;
}

var port = normalizePort(config.port);
app.set('port', port);

module.exports = app;

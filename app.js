var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const passport = require('passport');

var session = require('express-session');
const flash = require('connect-flash');

const hbs = require("hbs");

// const methodOverride = require('method-override');

var app = express();

// view engine setup

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: "session-sikho",
  cookie: { maxAge: 600000 }
}));

app.use(passport.initialize());
app.use(passport.session());

// app.use(methodOverride('_method'));

//this part is added later
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});


passport.serializeUser(usersRouter.serializeUser());
passport.deserializeUser(usersRouter.deserializeUser());

app.use(flash());

const partialsPath = path.join(__dirname,'views/partials')

hbs.registerPartials(partialsPath);

app.use(logger('dev'));
app.use(express.json());
// app.use('/api', router); // Assuming router is your express.Router()

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

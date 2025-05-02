const express = require('express');
require('express-async-errors');                    
const morgan = require('morgan');                   
const cors = require('cors');                       
const csurf = require('csurf');                    
const helmet = require('helmet');                   
const cookieParser = require('cookie-parser');       
const { ValidationError } = require('sequelize');    
const path = require('path');                        

const { environment } = require('./config');         
const isProduction = environment === 'production';   
const routes = require('./routes');                 

const app = express();                             

 
app.use(morgan('dev'));                              

 
app.use(cookieParser());                             
app.use(express.json());                          

 
app.use(express.static(path.join(__dirname, 'public')));  

 
if (!isProduction) {
   
  app.use(cors({ origin: 'http://localhost:3000', credentials: true }));  
}

 
app.use(
  helmet.crossOriginResourcePolicy({
    policy: 'cross-origin'                           
  })
);

 
app.use(
  csurf({
    cookie: {
      secure: isProduction,                          
      sameSite: isProduction ? 'Lax' : 'Strict',     
      httpOnly: true                                 
    }
  })
);

 
app.use(routes);                                 

// Serve frontend for non-API routes (SPA support)
// if (!isProduction) {
  // app.get('*', (req, res) => {
    // res.sendFile(path.join(__dirname, 'public', 'index.html')); // Serve index.html for all non-API routes
  // });
//}

 
app.use((_req, _res, next) => {                     
  const err = new Error('The requested resource couldn\'t be found.');
  err.title = 'Resource Not Found';
  err.errors = { message: 'The requested resource couldn\'t be found.' };
  err.status = 404;
  next(err);
});

 
app.use((err, _req, _res, next) => {                
  if (err instanceof ValidationError) {
    let errors = {};
    for (let error of err.errors) {
      errors[error.path] = error.message;
    }
    err.title = 'Validation error';
    err.errors = errors;
  }
  next(err);
});

 
app.use((err, _req, res, _next) => {                
  res.status(err.status || 500);
  const response = {
    message: err.title || err.message || "Server Error",
    errors: err.errors || {}
  };
   if (!isProduction) {
    console.error(err);
  }
  res.json(response);
});

module.exports = app;
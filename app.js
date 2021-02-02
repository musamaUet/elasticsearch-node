const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const routes = require('./routes');
const port = process.env.PORT || 3005;
const app = express();

// logging the request to our application
app.use(morgan('dev'));
// we want to use json
app.use(bodyParser.json());
// to use complex algorithm for deep parsing that can deal with nested objects
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/api', routes);

app.listen(port, () => {
    console.log(`server is listening on port ${port}`)
})
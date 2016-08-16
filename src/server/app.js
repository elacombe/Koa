const moment = require('moment');
const koa = require('koa');
const route = require('koa-route');
const cors = require('koa-cors');
const co = require('co');
const app = module.exports = koa();
const mongo = require('koa-mongo');
const bodyParser = require('koa-body-parser');

app.use(mongo({
    uri: 'mongodb://localhost:27017/todo',
    max: 100,
    min: 1,
    timeout: 30000,
    log: false
  })
);

app.use(bodyParser());

app.use(function *(next) {
  const start = new Date;
  yield next;
  const ms = new Date - start;
  this.set('X-Response-Time', ms + 'ms');
});

app.use(function *(next) {
  const ts = moment().format('Do MMM YY, h:mm:ss a');
  const start = new Date;
  yield next;
  var ms = new Date - start;
  console.log('%s :: %s :: %s - %s ms response time', ts, this.method, this.url, ms);
});

//CORS
app.use(cors());

//get ect..
app.use(route.get('/', function *() {
  this.body = 'Hello World, how is it hanging ?';
  })
);

app.use(route.get('/todo/lists', function *(next) {
  try {
    this.body = yield this.mongo.db('todo').collection('lists').find().toArray();
  } catch (err) {
    this.status = 500;
    this.body = err.message;
    this.app.emit('error', err, this);
  }
  })
);

app.use(route.get('/todo/tasks', function *(next) {
  try {
    yield this.mongo.db('todo').collection('tasks').find().toArray();
  } catch (err) {
    this.status = 500;
    this.body = err.message;
    this.app.emit('error', err, this);
  }
  })
);

app.use(route.post('/todo/lists', function *(next) {
  try {
    yield this.mongo.db('todo').collection('lists').insertOne({ label: this.request.body.todo.label });
    const id = yield this.mongo.db('todo').collection('lists').findOne({ label: this.request.body.todo.label });
    this.body = { id: id._id, label: this.request.body.todo.label };
  } catch (err) {
    this.status = 500;
    this.body = err.message;
    this.app.emit('error', err, this);
  }
  })
);

app.use(route.post('/todo/tasks', function *(next) {
  try {
    yield this.mongo.db('todo').collection('tasks').insertOne({ description: this.request.body.todo.description, listId: this.request.body.todo.listId });
    const id = yield this.mongo.db('todo').collection('tasks').findOne({ description: this.request.body.todo.description, listId: this.request.body.todo.listId });
    this.body = { id: id._id, description: this.request.body.todo.description, listId: this.request.body.todo.listId };
  } catch (err) {
    this.status = 500;
    this.body = err.message;
    this.app.emit('error', err, this);
  }
  })
);


if (!module.parent) {
  app.listen(3000);
  console.log('Listening on port 3000');
}
  //this.body = 'Hello World, I SAID HOW IS IT HANGING ?';


//app.use(route.get())
//voilà la liste des méthodes à utiliser: hset, sadd, srem, scard, hdel, hkeys, incr, del, hget
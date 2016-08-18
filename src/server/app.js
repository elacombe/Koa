const moment = require('moment');
const koa = require('koa');
const koarouter = require('koa-router');
const cors = require('koa-cors');
const co = require('co');
const app = koa();
const mongo = require('mongodb');
const bodyParser = require('koa-bodyparser');
const _ = require('lodash');
const ObjectId = require('mongodb').ObjectID;
const router = koarouter();

app.use(function* (next) {
  this.mongo = {
    db: yield mongo.connect('mongodb://localhost:27017/todo'),
  };
  yield next;
  this.mongo.db.close();
});

app.use(cors());
app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

const handleError = (err) => {
  this.status = 500;
  this.body = err.message;
  this.app.emit('error', err, this);
};

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

//get ect..
router.get('/errorhandling', function *() {
  this.status = 500;
  this.app.emit('error', this);
  });

router.get('/', function *() {
  this.body = 'Hello World, how is it hanging ?';
  });

router.get('/todo/lists', function *() {
  try {
    const lists = yield this.mongo.db.collection('lists').find().toArray();
    this.body = _.map(lists, (list) => { list._id = list._id.toString(); list.id = list._id; return list; });
  } catch (err) {
    handleError(err);
  }
  });

router.get('/todo/tasks', function *() {
  try {
    const tasks = yield this.mongo.db.collection('tasks').find().toArray();
    this.body = _.map(tasks, (task) => { task._id = task._id.toString(); task.id = task._id; return task; })
  } catch (err) {
    handleError(err);
  }
  });

router.post('/todo/lists', function *() {
  try {
    yield this.mongo.db.collection('lists').insertOne({ label: this.request.body.todo.label });
    const inserted = yield this.mongo.db.collection('lists').findOne({ label: this.request.body.todo.label });
    this.body = { id: inserted._id.toString(), label: this.request.body.todo.label };
  } catch (err) {
    handleError(err);
  }
  });

router.post('/todo/tasks', function *() {
  try {
    yield this.mongo.db.collection('tasks').insertOne({ description: this.request.body.task.description, listId: this.request.body.task.listId.toString() });
    const inserted = yield this.mongo.db.collection('tasks').findOne({ description: this.request.body.task.description, listId: this.request.body.task.listId.toString() });
    this.body = { id: inserted._id.toString(), description: this.request.body.task.description, listId: this.request.body.task.listId.toString() };
  } catch (err) {
    handleError(err);
  }
  });


router.delete('/todo/lists/:id', function *() {
  try {
    yield this.mongo.db.collection('tasks').deleteMany({ listId: ObjectId(this.params.id) });
    yield this.mongo.db.collection('lists').deleteOne({ _id: ObjectId(this.params.id) });
    this.body = { message: 'OK' };
  } catch (err) {
    handleError(err);
  }
  });

router.delete('/todo/tasks/:id', function *() {
  try {
    yield this.mongo.db.collection('tasks').deleteOne({ _id: ObjectId(this.params.id) });
    this.body = { message: 'OK' };
  } catch (err) {
    handleError(err);
  }
  });

app.listen(3000);
console.log('Listening on port 3000');

/*var app = require('koa')();
var server = require('http').createServer(app.callback());
var io = require('socket.io')(server);
io.on('connection', function(){ ... });
server.listen(3000);*/

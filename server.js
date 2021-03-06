var express = require('express');
var path = require('path');
var app = express();
var mongoose = require('mongoose');
var request = require('request');
var base58 = require('./base58.js');
var Url = require('./url');

app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
  res.render('index');
})

var url = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/url_shortener';
mongoose.Promise = global.Promise;
mongoose.connect(url);
var dbase = mongoose.connection;
dbase.on('open', function () {
    dbase.db.listCollections().toArray(function (err, names) {
        if (err){ console.log(err); }
        var exists = false;
        names.forEach(function(entry) {
            if(entry.name==="counter"){
                exists = true;
            }
        });
        if(exists===false){
          dbase.collection('counter').insert({ _id: 'url_count', seq: 1 });  
        }
    });
});

app.get('/new/*', function(req, res){
  var longUrl = req.params[0];
  request(longUrl, function (error, response, body) {
    if (error) {
      res.send({ 'error': error });
      return;
    } else {
        var shortUrl = '';
        Url.findOne({long_url: longUrl}, function (err, doc){
          if (err){ console.log(err); } 
          if (doc){
            shortUrl = req.headers.host  + "/" + base58.encode(doc._id);
            res.send({ 'original_url': longUrl, 'short_url': shortUrl });
          } else {
            var newUrl = Url({
              long_url: longUrl
            });
            newUrl.save(function(err) {
              if (err){ console.log(err); }
              shortUrl = req.headers.host + "/" + base58.encode(newUrl._id);
              res.send({ 'original_url': longUrl, 'short_url': shortUrl });
            });
          }
        });
      }
  });
});

app.get('/:encoded_id', function(req, res){
  var base58Id = req.params.encoded_id;
  var id = base58.decode(base58Id);
  Url.findOne({_id: id}, function (err, doc){
    if (err){ console.log(err); }    
    if (doc) {
      res.redirect(doc.long_url);
    } else {
      res.redirect(req.headers.host);
    }
  });
});

app.listen(process.env.PORT || 8080, function () {
  console.log('Example app listening on port 8080!');
});

var cheerio = require('cheerio');
var request = require('request');
var express = require('express');
var app = express();

app.set('view engine', 'ejs');
app.use(express.static('assets'));

app.get('/', function (req, res) {
  res.render('index.ejs', {title: 'Hey', message: 'Hello there!'});
});


app.get('/markets', function (req, res) {
  request.get('https://www.betfair.com/exchange/horse-racing', function (err, headers, body) {
    if (err) {
      return res.json(500, err);
    }
    var $ = cheerio.load(body);
    var all = $('#tab-day-2');
    var $racingevents = all.find('.mod-racingevents-racingevents');

    var resAll = ($racingevents || []).map(function (i, item) {
      var country = $(this).find('.country-code').text();
      var countryCode = $(this).find('.country-code').attr('rel');

      // take all markets
      var info_container = $(this).find('.info-container');
      var tracks = (info_container || []).map(function (i, item) {
        var track_name = $(this).find('.track-name').text();
        var races_list = $(this).find('.races-list .race-time a');

        var races = (races_list || []).map(function () {
          var $item = $(this);
          var link = $item.attr('href').match('/market/(.*)');
          var title = $item.attr('title');
          var date = $item.text();
          var marketId = link[1];
          return {
            date: date,
            title: title,
            marketId: marketId
          };
        }).get();

        return {races: races, track: track_name};
      }).get();

      return {country: country, countryCode: countryCode, tracks: tracks};
    }).get();

    res.json(resAll);
  });

});


app.get('/markets/:marketId', function (req, res) {
  var url = 'https://www.betfair.com/www/sports/exchange/readonly/v1/bymarket?currencyCode=USD&locale=en_GB&' +
    'marketIds=' + req.params.marketId + '&rollupLimit=4&rollupModel=STAKE&types=MARKET_STATE,MARKET_RATES,MARKET_DESCRIPTION,EVENT,RUNNER_DESCRIPTION,RUNNER_STATE,RUNNER_EXCHANGE_PRICES_BEST,RUNNER_METADATA,MARKET_LICENCE';

  var options = {
    url: url,
    method: 'GET',
    json: true,
    headers: {
      'Accept': 'application/json',
      'Content-type': 'application/json',
      'X-Application': 'nzIFcwyWhrlwYMrh'
    }
  };
  request(options, function (err, header, data) {
    if (err) {
      return res.json(500, err);
    }

    var runners = data.eventTypes[0].eventNodes[0].marketNodes[0].runners;
    res.json(runners);
  });
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});
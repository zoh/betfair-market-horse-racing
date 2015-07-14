/**
 * Created by zoh on 13.07.15.
 */

(function (exports) {
  var delay = 5000;
  var imageWidth = 350; // == container for images on canvas.
  var imageHeight = 255;
  var loadingMain = document.getElementById('loading-main');
  var canvas = document.getElementById('canvasCharts');

  function ajaxJson(url, success, fail) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.send();

    xhr.onreadystatechange = function () {
      if (xhr.readyState != 4) return;
      if (xhr.status != 200) {
        fail(xhr);
      } else {
        try {
          var data = JSON.parse(xhr.responseText);
          success(data);
        } catch (e) {
          fail(e, xhr);
        }
      }
    };
  }

  function imageChartUrl(marketId, selectionId) {
    marketId = marketId.slice(2);
    return 'https://sportsiteexweb.betfair.com/betting/LoadRunnerInfoChartAction.do?marketId=' + marketId +
      '&selectionId=' + selectionId;
  }

  function removeNode(node) {
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
  }

  function resizeCanvas(canvas) {
    canvas.width = document.getElementById('charts').clientWidth - 15;
    if (canvas.width < imageWidth) {
      canvas.size = imageWidth;
    }
    canvas.height = 500;
  }

  window.addEventListener('resize', function (e) {
    resizeCanvas(canvas);
  }, true);


  function loadingComplete() {
    loadingMain.style.display = 'none';
  }

  function loadingCompleteWithError() {
    loadingMain.querySelector('.spinner').style.display = 'none';
    loadingMain.querySelector('.error').style.display = 'block';
  }

  /**
   * @param data
   * @constructor
   */
  function MarketsNavView(data) {
    resizeCanvas(canvas);
    this.marketsNav = document.querySelector('#markets-nav');
    this.context = canvas.getContext('2d');

    textInfoOnCanvas(this.context);

    this.data = data;
    // make menu
    var html = '<ul class="nav nav-sidebar countries">';
    (data || []).forEach(function (el, i) {
      html += '<li><a data-set-id="' + i + '" href="#">' + el.country + '</a></li>';
    });
    html += '</ul>';
    this.marketsNav.innerHTML = html;
    this.delegation();
  }

  function textInfoOnCanvas(context) {
    var x = canvas.width / 2;
    var y = canvas.height / 2;
    context.font = '30pt Calibri';
    // textAlign aligns text horizontally relative to placement
    context.textAlign = 'center';
    // textBaseline aligns text vertically relative to font style
    context.textBaseline = 'middle';
    context.fillStyle = 'grey';
    context.fillText('Select a market from the menu to the left!', x, y);
  }

  MarketsNavView.prototype.delegation = function () {
    this.marketsNav.addEventListener('click', function (e) {
      var classes = Array.prototype.slice.call(e.target.parentNode.parentNode.classList);
      if (classes.indexOf('countries') >= 0) {
        this.showMenuTracks(e.target.dataset.setId);
      }
      if (classes.indexOf('tracks') >= 0) {
        this.showMenuRaces(e.target.dataset.parentId, e.target.dataset.setId);
      }
      if (classes.indexOf('races') >= 0) {
        var marketId = e.target.dataset.marketId;
        this.getRunnersByMarket(marketId);
      }
      e.preventDefault();
    }.bind(this), false);
  };

  MarketsNavView.prototype.showMenuTracks = function (index) {
    var tracks = this.data[index].tracks;
    var ul = this.marketsNav.querySelector('ul');

    var node = ul.children[index].querySelector('ul');
    if (node) {
      removeNode(node);
      return;
    }

    var html = '<ul class="nav submenu tracks">';
    (tracks || []).forEach(function (el, i) {
      html += '<li><a data-parent-id="' + index + '" data-set-id="' + i + '" href="#">' + el.track + '</a></li>';
    });
    html += '</ul>';

    ul.children[index].innerHTML += html;
  };

  MarketsNavView.prototype.showMenuRaces = function (parentId, index) {
    var races = this.data[parentId].tracks[index].races;
    var track = this.data[parentId].tracks[index].track.trim();
    var ul = this.marketsNav.querySelector('ul');

    var node = ul.children[parentId].querySelector('[data-race="' + track + '"]');
    if (node) {
      removeNode(node);
      return;
    }

    var html = '<ul data-race="' + track + '" class="nav submenu races">';
    (races || []).forEach(function (el, i) {
      var title = el.date + ': ' + el.title;
      html += '<li><a data-market-id="' + el.marketId + '" href="#">' + title + '</a></li>';
    });
    html += '</ul>';

    ul.children[parentId].querySelector('.tracks').children[index].innerHTML += html;
  };

  MarketsNavView.prototype.getRunnersByMarket = function (marketId) {
    var loader = document.getElementById('charts').querySelector('.spinner');
    loader.style.display = 'block';
    ajaxJson('/markets/' + marketId, function (data) {
      loader.style.display = 'none';
      this.stopRender();
      this.renderImages(marketId, (data || []).map(function (item) {
        return {
          selectionId: item.selectionId,
          name: item.description.runnerName
        }
      }));
    }.bind(this), console.log.bind(console));
  };

  /**
   * Load images with charts, crop & draw on canvas.
   * @param marketId
   * @param images
   */
  MarketsNavView.prototype.renderImages = function (marketId, images) {
    var $this = this;
    var imagesArr = images.map(function (image, index) {
      var url = imageChartUrl(marketId, image.selectionId);
      var imageObj = new Image();
      imageObj.onload = function () {
        console.log("let's go to draw.", image.name, imageObj.width);
        $this.drawImage(imageObj, index, image);
      };
      imageObj.src = url;
      return {img: imageObj, url: url};
    });

    clearCanvas(this.context);
    resizeHeightCanvasByCount(imagesArr.length);

    function run() {
      // load all images
      imagesArr.forEach(function (img) {
        img.img.src = img.url;
      });
      $this.$timeout = setTimeout(run, delay);
    }

    run();
  };

  function clearCanvas(context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function resizeHeightCanvasByCount(count) {
    var canvasWidth = canvas.width;
    var columns = parseInt(+canvasWidth / +imageWidth, 10);

    var row = parseInt((count - 1) / columns);
    canvas.height = (row + 1) * imageHeight;
  }

  MarketsNavView.prototype.stopRender = function () {
    clearTimeout(this.$timeout);
  };

  /**
   * Crop & draw.
   * @param imageObj
   * @param index
   * @param imageParams
   */
  MarketsNavView.prototype.drawImage = function (imageObj, index, imageParams) {
    var cnt = getContainerSize(index);
    //console.log(cnt);
    // clear current container
    this.context.clearRect(cnt.x, cnt.y, imageWidth, imageHeight);
    this.context.drawImage(imageObj,
      10, 30, 310, 225,
      cnt.x, cnt.y + 20, 310, 225);

    var context = this.context;
    context.font = '16px Arial';
    context.textAlign = 'center';
    // do by center the label.
    context.fillText(imageParams.name, (cnt.x + imageWidth / 2 - 10), cnt.y + 15);
  };

  function getContainerSize(index) {
    var canvasWidth = canvas.width;
    //var canvasHeight = canvas.height;
    var columns = parseInt(+canvasWidth / +imageWidth, 10);
    //var columns = parseInt(+canvasHeight / +imageHeight, 10);

    // current row and column
    var curr = {
      row: parseInt(index / columns),
      column: index % columns
    };
    return {
      x: curr.column * imageWidth,
      y: curr.row * imageHeight
    };
  }

  ajaxJson('/markets', function (data) {
    exports.marketView = new MarketsNavView(data);
    loadingComplete();
  }, function (e, xhr) {
    loadingCompleteWithError();
  });

})(window);
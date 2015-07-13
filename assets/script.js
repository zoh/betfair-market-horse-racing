/**
 * Created by zoh on 13.07.15.
 */

(function (exports) {
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

  function removeNode(node) {
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
  }


  function MarketsNavView(data) {
    this.marketsNav = document.querySelector('#markets-nav');
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
    ajaxJson('/markets/' + marketId, function (data) {
      console.log(data);
    }, console.log.bind(console));
  };

  ajaxJson('/markets', function (data) {
    exports.marketView = new MarketsNavView(data);
  }, console.log.bind(console));

})(window);
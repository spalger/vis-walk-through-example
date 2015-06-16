define(function (require) {

  require('css!plugins/wiki_example/wiki_example.css');
  require('components/timefilter/timefilter');

  var apps = require('registry/apps');
  apps.register(function VisualizeAppModule() {
    return {
      id: 'wiki-example',
      name: 'Wiki Exaxmple',
      order: 10
    };
  });

  require('routes')
  .when('/wiki-example/:indexPattern?', {
    template: require('text!plugins/wiki_example/wiki_example.html'),
    resolve: {
      indexPattern: function (indexPatterns, $route) {
        return indexPatterns.get($route.current.params.indexPattern || 'logstash-*')
        .catch(function (e) {
          if (e.savedObjectType === 'index-pattern') {
            throw new Error(
              'Unable to load the "logstash-*" index pattern. Try adding your index pattern as a route param.'
            );
          }
        });
      }
    }
  });

  require('modules')
  .get('kibana')
  .controller('WikiExampleController', function (Private, $scope, es, $route, timefilter) {
    var self = this;

    var Vis = Private(require('components/vis/Vis'));
    var visTypes = Private(require('registry/vis_types'));

    timefilter.enabled = true;
    $scope.$listen(timefilter, 'fetch', function () {
      self.fetch();
    });

    self.visType = visTypes.byName.line;
    self.indexPattern = $route.current.locals.indexPattern;
    self.vis = new Vis(self.indexPattern, {
      type: self.visType,
      aggs:  [
        {
          type: 'avg',
          schema: 'metric',
          params: {
            field: 'bytes'
          }
        },
        {
          type: 'date_histogram',
          schema: 'segment',
          params: {
            field: '@timestamp'
          }
        }
      ]
    });

    self.fetch = function () {
      es.msearch({
        pretty: true,
        body: [
          { index: self.indexPattern.id },
          {
            size: 0,
            query: {
              filtered: {
                filter: {
                  range: {
                    '@timestamp': {
                      gte: timefilter.time.from,
                      lte: timefilter.time.to
                    }
                  }
                }
              }
            },
            aggs: self.vis.aggs.toDsl()
          }
        ]
      })
      .then(function (responses) {
        var resp = responses.responses[0];
        self.error = resp.error;
        self.resp = !resp.error && resp;
      });
    };

    self.fetch();
  });

});

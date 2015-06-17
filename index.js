define(function (require) {

  require('css!plugins/vis-walk-through-example/vis-walk-through-example.css');
  require('components/timefilter/timefilter');

  var apps = require('registry/apps');
  apps.register(function VisualizeAppModule() {
    return {
      id: 'vis-walk-through-example',
      name: 'Vis Walk-Through Example',
      order: 10
    };
  });

  require('routes')
  .when('/vis-walk-through-example/:indexPattern?', {
    template: require('text!plugins/vis-walk-through-example/vis-walk-through-example.html'),
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
  .controller('WikiExampleController', function (Private, $scope, courier, $route, timefilter) {
    var self = this;

    // read the indexPattern from the route
    self.indexPattern = $route.current.locals.indexPattern;

    // build our vis
    var visTypes = Private(require('registry/vis_types'));
    var Vis = Private(require('components/vis/Vis'));
    self.visType = visTypes.byName.line;
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

    // build our searchSource
    self.searchSource = new courier.SearchSource()
    .set('index', self.indexPattern)
    .set('size', 0)
    .set('aggs', function () {
      // rather than pass in the dsl when creating the
      // searchSource, we pass a function that will be called
      // per request to create the dsl. This way, we can change things
      // based on the environment in which we a exectuing the query
      return self.vis.aggs.toDsl();
    });

    // handle when the searchsource gets a response, set it on the controller
    self.searchSource
    .onResults(function (resp) {
      self.error = null;
      self.resp = resp;
    });

    // also handle request failures
    self.searchSource.onError(function (err) {
      self.error = err.message;
      self.resp = null;
    });

    // enable the time filter
    timefilter.enabled = true;

    // tell the searchsource to update when the timefilter changes
    $scope.$listen(timefilter, 'fetch', function () {
      searchSource.fetch();
    });

    // alert kibana that our "application" has finished loading
    $scope.$emit('application.load');
  });

});

define(function (require) {
  // This controller is bound in vis-example-view.html
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
            field: '@timestamp',
            interval: 'auto'
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

      self.vis.requesting(); // see https://github.com/elastic/kibana/issues/4264
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
      self.searchSource.fetch();
    });

    // alert kibana that our "application" has finished loading
    $scope.$emit('application.load');
  });

});
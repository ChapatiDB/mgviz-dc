// Time series chart

//histogram button

var buildTimeChart = function(dataset, group, accessor, target, navigation, dateDimension) {

  var precision = ['days',d3.time.days];

  var symptomsTimeChart = dc.compositeChart(target);
  var symptomsNavChart = dc.barChart(navigation);

  var volumeByHour = dateDimension;

  var volumeByHourGroup = volumeByHour.group(
    function(the_date){
      return d3.time.day(the_date); // TODO make the granularity easier to see
    }
  );

  var symptomGroupsTimeSeries =
    volumeByHour
    .group(function(date){
        return d3.time.day(date); // TODO make the granularity easier to see
    })
    .reduce(
      function(p, d){
        p[d[accessor]] = (p[d[accessor]] || 0) + 1;
        return p;
      },
      function(p, d) {
        --p[d[accessor]];
        return p;
      },
      function() { return {}; }
    );

  var observed_symptoms = group.all().map(function(obj){ return obj.key; });

  symptomsTimeChart
    .width(950)
    .height(300)
    .margins({top: 10, right: 120, bottom: 20, left: 40})
    .rangeChart(symptomsNavChart)
    .shareTitle(false)
    .transitionDuration(100)
    .elasticY(true)
    .x(d3.time.scale())
    .xUnits(d3.time.days)
    //.xAxisLabel('date (' + precision[0] + ')') // (optional) render an axis label below the x axis
    .yAxisLabel('no. cases')
    .xAxis();

  var theLines = [];
  observed_symptoms.forEach(function(field, i){
    theLines.push(
      dc.lineChart(symptomsTimeChart)
        .dimension(volumeByHour)
        .colors(classesColorScale(i))
        .group(symptomGroupsTimeSeries, observed_symptoms[i], function(d){
          return d.value[field] || null;
        })
        .defined(function(d){
          return !isNaN(d.y)
        })
        .interpolate("monotone")
    );
  });

  symptomsTimeChart
  .compose(theLines)
  .brushOn(false)

  symptomsTimeChart
    .rangeChart(symptomsNavChart)
    .transitionDuration(100)
    .x(d3.time.scale().domain([minDate, maxDate]))
    .xUnits(d3.time.days)
    .xAxis()

  symptomsNavChart.width(850)
    .height(60)
    .margins({top: 10, right: 20, bottom: 20, left: 50})
    .dimension(volumeByHour)
    .group(volumeByHourGroup)
    .centerBar(true)
    .gap(1)
    .x(d3.time.scale().domain([minDate, maxDate]))
    .round(d3.time.days.round)
    .alwaysUseRounding(true)
    .xUnits(d3.time.days)
    .yAxis().ticks(0);

  return symptomsTimeChart;

/*

OLD STACKED CHARTS, DO NOT REMOVE AT THE MOMEN


  var symptomsTimeChart = dc.lineChart(target);
  var symptomsNavChart = dc.barChart(navigation);

  var volumeByHour = dataset.dimension(function(d) {
    return new Date(d.date_onset);
  });

  var volumeByHourGroup = volumeByHour.group(
    function(the_date){
      return d3.time.day(the_date); // TODO make the granularity easier to see
    }
  );

  //For some very strange reason reduceCount is not working - it is simply never
  //called when group().reduceCount() is run on a set -
  // - could this be because we are using a bleeding edge version of dc.js?
  //So instead we just do some hacking - using reduceSum as a reduceCount alternative

  var symptomGroupsTimeSeries =
    volumeByHour
    .group(function(date){
        return d3.time.day(date); // TODO make the granularity easier to see
    })
    .reduce(
      function(p, d){
        p[d[accessor]] = (p[d[accessor]] || 0) + 1;
        return p;
      },
      function(p, d) {
        --p[d[accessor]];
        return p;
      },
      function() { return {}; }
    );

  //inspired by this hack, which was actually wrongly implemented?
  //http://stackoverflow.com/questions/24415665/dc-js-stacked-area-chart-using-reducecount-method

  //This extracts all the symptoms we have seen!
  //We have to extract the first element here because we can't modify the array
  // as everything here is lazy and computed asynchronously!
  var observed_symptoms = group.top(Infinity).map(function(obj){ return obj.key; });
  var first_symptom = observed_symptoms[0];
  observed_symptoms.shift();


  symptomsTimeChart
    .width(1100)
    .height(300)
    .renderArea(true)
    .margins({top: 10, right: 10, bottom: 20, left: 40})
    .dimension(volumeByHour)
    .group(symptomGroupsTimeSeries, first_symptom, function(d){
      return d.value[first_symptom] || null;
    })
    .brushOn(false) // we need this for the clickable hack haha
    .defined(function(d){
      console.log(d.y);
      return !isNaN(d.y)
    })
    .mouseZoomable(true)



  observed_symptoms.forEach(function(field, i){
    symptomsTimeChart.stack(symptomGroupsTimeSeries, observed_symptoms[i], function(d){
      return d.value[field] || null;
    });
  });

  symptomsTimeChart
    .rangeChart(symptomsNavChart)
    .transitionDuration(100)
    .elasticY(true)
    .x(d3.time.scale().domain([new Date(2015, 5, 1), new Date(2015, 5, 19)]))
    .xUnits(d3.time.days)
    .xAxis();

  //This hack is terrible but dives into d3 to find the area entities in the
  //svg and makes them clickable.
  symptomsTimeChart.on('renderlet.timechart.' + accessor, function(chart, filter) {
      chart.selectAll("path.area").on("click.timechart" + accessor, (
        function(d) {
          window[accessor+ "sChart"].filter([d.name]);
          dc.redrawAll();
        }
      ))
      .style("fill", function(d,index) {
        console.log(d);
        console.log(index);
        return classesColorScale(index);
      })
      .style("stroke", function(d,index) {
        return 'gray';
      })
    });

  //onclick issue maybe fixed here https://github.com/dc-js/dc.js/issues/168

  return symptomsNavChart.width(1140)
    .height(60)
    .margins({top: 0, right: 50, bottom: 20, left: 40})
    .dimension(volumeByHour)
    .group(volumeByHourGroup)
    .centerBar(true)
    .gap(1)
    //.elasticX(true)
    .x(d3.time.scale().domain([new Date(2015, 5, 1), new Date(2015, 5, 19)]))
    .round(d3.time.days.round)
    .alwaysUseRounding(true)
    .xUnits(d3.time.days)
    .yAxis().ticks(0);
*/
};

var syndromesNavTimeChart = buildTimeChart(syndromesDataset, syndromesGroup, 'syndrome', '#syndromesTimeSeries', '#syndromesTimeNavigation', syndromesDateDimension);
var symptomsNavTimeChart = buildTimeChart(symptomsDataset, symptomsGroup, 'symptom', '#symptomsTimeSeries', '#symptomsTimeNavigation', symptomsDateDimension);

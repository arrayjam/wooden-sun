var app = {};
app.templates = {};
d3.selectAll("[type='text/template']")
  .each(function() { app.templates[this.id] = strip(this.innerHTML); });


function strip(text) {
  return text.replace(/\n/g, "").replace(/\s+/g, " ");
}

d3.selectAll(".chart")
    .classed("nochart", true)
    .html(app.templates.nochart)
    .on("click", function() {
      var chartEl = this;
      d3.json("/props", function (err, data) {
        d3.select(chartEl)
            .on("click", null)
            .html(app.templates.choose)
            .classed("nochart", false)
            .classed("choose", true)
          .select("select").selectAll("option")
            .data(data.sort())
          .enter().append("option")
            .attr("value", function(d, i) { return i; })
            .text(String);

      });
    });





function barChart() {
  if (!barChart.id) barChart.id = 0;

  var margin = {top: 10, right: 10, bottom: 20, left: 10},
    x,
    y = d3.scale.linear().range([75, 0]),
    id = barChart.id++,
    axis = d3.svg.axis().orient("bottom"),
    brush = d3.svg.brush(),
    brushDirty,
    dimension,
    group,
    round,
    selected,
    linear = d3.scale.linear();

  function chart(div) {
    var width = x.range()[1],
      height = y.range()[0];

    y.domain([0, group.top(1)[0].value]);

    div.each(function() {
      var div = d3.select(this),
        g = div.select("g");

      // Create the skeletal chart.
      if (g.empty()) {
        div.select(".description").append("a")
        .attr("href", "javascript:reset(" + id + ")")
        .attr("class", "reset")
        .text("Reset")
        .style("display", "none");

        g = div.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        g.append("clipPath")
        .attr("id", "clip-" + id)
        .append("rect")
        .attr("width", width)
        .attr("height", height);

        g.selectAll(".bar")
        .data(["background", "foreground"])
        .enter().append("g")
        .attr("class", function(d) { return d + " bar"; })
        .datum(group.all());

        g.selectAll(".foreground.bar")
        .attr("clip-path", "url(#clip-" + id + ")");

        g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .call(axis);

        // Initialize the brush component with pretty resize handles.
        var gBrush = g.append("g").attr("class", "brush").call(brush);
        gBrush.selectAll("rect").attr("height", height);
        gBrush.selectAll(".resize").append("path").attr("d", resizePath);
      }

      // Only redraw the brush if set externally.
      if (brushDirty) {
        brushDirty = false;
        g.selectAll(".brush").call(brush);
        div.select(".description a").style("display", brush.empty() ? "none" : null);
        if (brush.empty()) {
          g.selectAll("#clip-" + id + " rect")
          .attr("x", 0)
          .attr("width", width);
        } else {
          var extent = brush.extent();
          g.selectAll("#clip-" + id + " rect")
          .attr("x", x(extent[0]))
          .attr("width", x(extent[1]) - x(extent[0]));
        }
      }

      g.selectAll(".bar").each(function(d) {
        var bar = d3.select(this).selectAll("path")
          .data(d, function(x) { return x.key; });

        bar.enter().append("path")
        .attr("d", barPath);

        bar.attr("d", barPath);
      });

      g.selectAll(".foreground path")
        .style("fill", function(d, i) { return selected ? linear(i) : "steelblue"; });
    });

    function barPath(d) {
      return "M" + x(d.key) + "," + height + "V" + y(d.value) + "h9V" + height + "z";
    }

    function resizePath(d) {
      var e = +(d === "e"),
        x = e ? 1 : -1,
        y = height / 3;
      return "M" + (0.5 * x) + "," + y +
        "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6) +
        "V" + (2 * y - 6) +
        "A6,6 0 0 " + e + " " + (0.5 * x) + "," + (2 * y) +
        "Z" +
        "M" + (2.5 * x) + "," + (y + 8) +
        "V" + (2 * y - 8) +
        "M" + (4.5 * x) + "," + (y + 8) +
        "V" + (2 * y - 8);
    }
  }

  brush.on("brushstart.chart", function() {
    var div = d3.select(this.parentNode.parentNode.parentNode);
    div.select(".description a").style("display", null);
  });

  brush.on("brush.chart", function() {
    var g = d3.select(this.parentNode),
      extent = brush.extent();
    if (round) g.select(".brush")
      .call(brush.extent(extent = extent.map(round)))
    .selectAll(".resize")
    .style("display", null);
    g.select("#clip-" + id + " rect")
    .attr("x", x(extent[0]))
    .attr("width", x(extent[1]) - x(extent[0]));
    dimension.filterRange(extent);
  });

  brush.on("brushend.chart", function() {
    if (brush.empty()) {
      var div = d3.select(this.parentNode.parentNode.parentNode);
      div.select(".description a").style("display", "none");
      div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
      dimension.filterAll();
    }
  });

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin = _;
    return chart;
  };

  chart.x = function(_) {
    if (!arguments.length) return x;
    x = _;
    axis.scale(x);
    brush.x(x);
    return chart;
  };

  chart.y = function(_) {
    if (!arguments.length) return y;
    y = _;
    return chart;
  };

  chart.dimension = function(_) {
    if (!arguments.length) return dimension;
    dimension = _;
    return chart;
  };

  chart.filter = function(_) {
    if (_) {
      brush.extent(_);
      dimension.filterRange(_);
    } else {
      brush.clear();
      dimension.filterAll();
    }
    brushDirty = true;
    return chart;
  };

  chart.group = function(_) {
    if (!arguments.length) return group;
    group = _;
    return chart;
  };

  chart.round = function(_) {
    if (!arguments.length) return round;
    round = _;
    return chart;
  };

  chart.selected = function(_) {
    if (!arguments.length) return selected;
    selected = _;
    return chart;
  };

  return d3.rebind(chart, brush, "on");
}
/*jslint browser:true, unparam:true */
/*globals $, console, d3, tangelo */


var color = null;

var graph = null;
var svg = null;
var width = 0;
var height = 0;
var transition_time;
var translate = [0, 0];

var entityAlign = {};
entityAlign.force1 = null;
entityAlign.force2 = null;
entityAlign.host = null;
entityAlign.ac = null;
entityAlign.textmode = false;


//var LoggingLocation = "http://xd-draper.xdata.data-tactics-corp.com:1337"
var LoggingLocation = "http://10.1.90.46:1337/";
// testmode = false means logging is on
entityAlign.testMode = true;
entityAlign.echoLogsToConsole = false;
entityAlign.ac = new activityLogger().echo(entityAlign.echoLogsToConsole).testing(entityAlign.testMode);
ac = entityAlign.ac;
entityAlign.ac.registerActivityLogger(LoggingLocation, "Kitware_Entity_Alignment", "0.8");

entityAlign.dayColor = d3.scale.category10();
entityAlign.monthColor = d3.scale.category20();
entityAlign.dayName = d3.time.format("%a");
entityAlign.monthName = d3.time.format("%b");
entityAlign.dateformat = d3.time.format("%a %b %e, %Y (%H:%M:%S)");

// add globals for current collections to use.  Allows collection to be initialized at
// startup time from a defaults.json file.   A pointer to the global datastructures for each graph, are initialized empty as well.

entityAlign.graphsDatabase= null
entityAlign.showMatchesEnabled = false
entityAlign.runsCollection = null
entityAlign.graphA = null
entityAlign.graphB = null

// a backup copy of the files as read from the datastore is kept to send to the SGM algortihm.  The regular .graphA and .graphB entries 
// are operated-on by D3, so the datastructures don't work passed back to networkX directly anymore.  So a backup is kepts and this pristine
// copy is used to initialize the SGM algorithm executed as a tangelo service.

entityAlign.SavedGraphA = null
entityAlign.SavedGraphB = null

// there is a global array corresponding to the current matches known between the two loaded graphs.  The matches are an array of JSON objects, each with a 
// "ga" and "gb" attribute, whose corresponding values are integers that match the node IDs. 
entityAlign.currentMatches = []


entityAlign.monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
];

entityAlign.dayNames = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat"
];

// make alternating blue and tan colors gradually fading to background to add color gradient to network
// see http://en.wikipedia.org/wiki/Web_colors
entityAlign.nodeColorArray = [
        "#ff2f0e","#1f77b4","#cd853f","#1e90b4", "#f5deb3","#add8e6","#fff8dc",
        "#b0e0e6","#faf0e6","#e0ffff","#fff5e0","#f0fff0"
];



function stringifyDate(d) {
    "use strict";

    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}

function displayDate(d) {
    "use strict";

    return entityAlign.monthNames[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
}



// This function is attached to the hover event for displayed d3 entities.  This means each rendered tweet has
// a logger installed so if a hover event occurs, a log of the user's visit to this entity is sent to the activity log

function loggedVisitToEntry(d) {
        //console.log("mouseover of entry for ",d.user)
        //entityAlign.ac.logUserActivity("hover over entity: "+d.tweet, "hover", entityAlign.ac.WF_EXPLORE);
     
}

function loggedDragVisitToEntry(d) {
        //console.log("mouseover of entry for ",d.user)
        //entityAlign.ac.logUserActivity("drag entity: "+d.tweet, "hover", entityAlign.ac.WF_EXPLORE);
}



function updateGraph1() {
    //updateGraph1_d3()
    initGraph1FromDatastore()

}


function updateGraph2() {
    initGraph2FromDatastore()
    // this rendering call below is the old style rendering, which doesn't update.  comment this out in favor of using
     updateGraph2_d3_afterLoad() 
    //updateGraph2_d3()
}

// define a key return function that makes sre nodes are matched up using their ID values.  Otherwise D3 might
// color the wrong nodes if the access order changes
function nodeKeyFunction(d) {
    return d.id
}


function updateGraph2_vega() {
    "use strict";
     //entityAlign.ac.logUserActivity("Update Rendering.", "render", entityAlign.ac.WF_SEARCH);
     entityAlign.ac.logSystemActivity('entityAlign - updateGraph 2 display executed');
    var center,
        data,
        end_date,
        hops,
        change_button,
        start_date,
        update;


    d3.select("#nodes2").selectAll("*").remove();
    d3.select("#links2").selectAll("*").remove();

    // Get the name of the graph dataset to render
    var graphPathname = d3.select("#graph2-selector").node();
    var selectedDataset = graphPathname.options[graphPathname.selectedIndex].text;

     var logText = "dataset2 select: start="+graphPathname;
     entityAlign.ac.logSystemActivity('Kitware entityAlign - '+logText);

    $.ajax({
        // generalized collection definition
        url: "service/loadgraph/" + entityAlign.host + "/"+ entityAlign.graphsDatabase + "/" + selectedDataset,
        data: data,
        dataType: "json",
        success: function (response) {
            var angle,
                enter,
                svg,
                svg2,
                link,
                map,
                newidx,
                node,
                tau;


            if (response.error ) {
                console.log("error: " + response.error);
                return;
            }
            console.log('data returned:',response.result)
            graph = {}
            graph.edges = response.result.links
            graph.nodes = response.result.nodes

            var width = 500
            var height = 500

            parseVegaSpec("#graph2","force.json",graph)
        }
         
    });
}

 // bind data  with the vega spec and render in the element passed as a parameter.  This routine reads the
 // vega spec and connects to dynamic data. It can be repeatedly called during execution to change the rendering
 // driven by vega

    function parseVegaSpec(element, spec, dynamicData) {
            console.log("parsing vega spec"); 
       vg.parse.spec(spec, function(chart) { 
            vegaview = chart({
                    el: element, 
                    data: {links: dynamicData.links, nodes: dynamicData.nodes}
                })
                .update()
                .on("mouseover", function(event, item) {
                        console.log('item',item.mark.marktype,' detected')
                        if (item.mark.marktype === 'symbol') {
                            vegaview.update({
                                props: 'hover0',
                                items: item.cousin(1)
                            });
                        } 
                })
                .on("mouseout", function(event, item) {
                        if (item.mark.marktype === 'symbol') {
                            vegaview.update({
                                props: 'update0',
                                items: item.cousin(1)
                            });
                        }
                 })
                 });
   }

// used in the pack function to traverse through different data
function pack_children(d) {
  return d.results;
}

function pack_value(d) {
  return d.size/2.0;
}
// The InitGraph functions are called the first time a graph is loaded from the graph datastore.  The ajax call to load from the store
// is included here.  Globals variables are filled with the graph nodes and links.  No rendering is done in this method.  A method is 
// written for graph1 and graph2.  The only difference between the graph1 and graph2 methods is that they fill different global variables.


// Returns a flattened hierarchy containing all leaf nodes under the root.
function listworlds(root) {
  var worlds = [];
  var entry;
  console.log(root)
    for  (entry in root['results']) {
      console.log('found :',entry)
      worlds.push({relations: entry.relations, className: entry.name, color: 1, size: 40});
    }
    console.log('results list:',worlds)
  return {results: worlds};
}

function   initGraph1FromDatastore()
{
 
  "use strict";
     //entityAlign.ac.logUserActivity("Update Rendering.", "render", entityAlign.ac.WF_SEARCH);
     entityAlign.ac.logSystemActivity('entityAlign - initialize graph A executed');
    var center,
        data,
        end_date,
        hops,
        change_button,
        start_date,
        update;


    d3.select("#graph1").selectAll("*").remove();

    // Get the name of the graph dataset to render
    var graphPathname = d3.select("#graph1-selector").node();
    var selectedDataset = graphPathname.options[graphPathname.selectedIndex].text;

   var diameter = 650,
    format = d3.format(",d"),
    color = d3.scale.category20c();

    var bubble = d3.layout.pack()
    .sort(null)
    .children(pack_children)
    .value(pack_value)
    .size([diameter, diameter])
    .padding(1.5);

    var svg = d3.select("#graph1").append("svg")
    .attr("width", diameter)
    .attr("height", diameter)
    .attr("class", "bubble");

    $.ajax({
        // generalized collection definition
        url: "service/loadinference/" + entityAlign.host + "/"+ entityAlign.graphsDatabase + "/" + entityAlign.runsCollection + "/" + selectedDataset,
        data: data,
        dataType: "json",
        success: function (response) {

            console.log('root:',response)
            var node = svg.selectAll(".node")
              .data(bubble.nodes(response))
              .enter().append("g")
              .attr("class", "node")
              .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
              .on("mouseover", function(d) {
                    console.log(d)
                    displayOccurrenceAttributes(d)
                })
               .on('mouseout',function(d) {
                    console.log(d)
                    clearOccurrenceAttributes()
                });

            node.append("title")
              .text(function(d) { return d.name + ": " + format(d.value); });

            node.append("circle")
              .style("fill", function(d) { return color(d.date); })
              .transition()
              .duration(200)
              .delay(function(d,i) {return i*100})
              .attr("r", function(d) { return d.size; });


            node.append("text")
              .attr("dy", ".3em")
              .style("text-anchor", "middle")
              .style("font-size","24px")
              .transition()
              .delay(function(d,i) {return i*100+300})
              .text(function(d) { return d.name });

        }

    });
    d3.select(self.frameElement).style("height", diameter + "px");
}


function firstTimeInitialize() {
    "use strict";

    // make the panel open & close over data content
    //$('#control-panel').controlPanel();

    d3.json("defaults.json", function (err, defaults) {
        defaults = defaults || {};

        // read default data collection names from config file
        entityAlign.host = defaults.mongoHost || "localhost";
        entityAlign.graphsDatabase = defaults.graphsDatabase || "etc"
        entityAlign.runsCollection = defaults.runsCollection || "runs"
        console.log('set graphs database: ',entityAlign.graphsDatabase)

        fillDatassetList('#graph1-selector')
        //fillDatassetList('#graph2-selector')
        //fillSeedList('#seed-selector')

        width = $(window).width();
       height = $(window).height();

        color = d3.scale.category20();
        //color = entityAlignDistanceFunction;

        // set a watcher on the dataset selector so datasets are filled in
        // automatically when the user selects it via UI selector elements. 

        d3.select("#graph1-selector")
            .on("change", updateGraph1);
        d3.select("#graph2-selector")
            .on("change", updateGraph2);
        //d3.select("#align-button")
        //    .on("click", runSeededGraphMatching);
        d3.select("#show-matches-toggle")
            .attr("disabled", true)
            .on("click",  function () { entityAlign.showMatchesEnabled = !entityAlign.showMatchesEnabled; 
                                        conole.log(entityAlign.showMatchesEnabled);
                                       });

        // block the contextmenu from coming up (often attached to right clicks). Since many 
        // of the right clicks will be on the graph, this has to be at the document level so newly
        // added graph nodes are all covered by this handler.

        $(document).bind('contextmenu', function(e){
            e.preventDefault();
            return false;
            });

    });
}


// *** initialization.  What do we do the first time the app is opened and the document is ready?

window.onload = function ()  {

        firstTimeInitialize();    // Fill out the dataset selectors with graph datasets that we can choose from  
};


// use a python service to search the datastore and return a list of available networks to pick from.  This fills a GUI selector, so the user
// can see what datasets are available.

function fillDatassetList(element) {
  d3.select(element).selectAll("a").remove();
        d3.json("service/listdatasets/"+ entityAlign.host + "/" + entityAlign.graphsDatabase + "/" 
                        + entityAlign.runsCollection, function (error, entities) {
            console.log(entities,"\n");
            // save in a temporary list so we can refer back during a click event
            d3.select(element).selectAll("option")
            .data(entities.result)
            .enter().append("option")
            .text(function (d) { return d; });
        });
}



function displayOccurrenceAttributes(entry) {

    // add other attributes to display tag if they are present in the observation table

    // use the prettier Bootstrap list group instead of the old style output list
        d3.select("#attributes").selectAll("a").remove();
        var datasetTable = []
         for (var count =0; count< entry.relations.length; ++count) {
            attribtext =  ' <b>[' + entry.relations[count].type +']: </b>' + entry.relations[count].from + ',' +  entry.relations[count].to
           datasetTable.push(attribtext)
        };
        
        //attempt to reset so second list is draggable, but it doesn't work
        //d3.select("#currentdatasetlist").attr("ondragstart","dragStartHandler(event)");   
      
      for (var i = 0; i < datasetTable.length; ++i) {
           // create drag-and-drop elements here
           var myurl = datasetTable[i]
           $("#attributes")
                .append('<a href="'+myurl+'" class="list-group-item class="form-control" draggable="false" data-value="'+datasetTable[i]+'">'+ datasetTable[i] + '</a>');
      } 
}

function clearOccurrenceAttributes() {
    d3.select("#attributes").selectAll("a").remove();
}



// change the status of the global show matches 
function toggleShowMatches() {

}


// this function is called after a new set of seeds are loaded.  Assuming there are graphs present, we traverse through the graphs and set
// the "matched" attribute to have the ID of the node in the opposing graph, which matches it. 

function updateMatchingStatusInGraphs() {
    clearMatchedStatusForGraph(entityAlign.graphA)
    clearMatchedStatusForGraph(entityAlign.graphB)
    for (match in  entityAlign.currentMatches) {
        // set matched attributes
        var match_record = entityAlign.currentMatches[match]
        //console.log('match',match,'match_record',match_record)
        var ga_index = match_record.ga
        var gb_index = match_record.gb
        //console.log('match',match,'ga',ga_index)
        var ga_node = entityAlign.graphA.nodes[ga_index]
        var gb_node = entityAlign.graphB.nodes[gb_index]
        ga_node.matched = match_record.gb
        gb_node.matched = match_record.ga
    }
}


function clearMatchedStatusForGraph(graph) {

}



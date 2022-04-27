(function($) {
 $("<div id='ldr'>Loading...</div>").prependTo("#content");
 var debugMode = !!window.debug,sevice=debugMode?"raw.githack.com":"rawcdn.githack.com",
 gH="https://"+sevice+"/yurasidorets",br=debugMode?"test":"master";
 $.ajax(gH+"/redmine-autofiller/master/autofill.css").done(function(css){
  $("<style type='text/css'>"+css+"</style>").insertBefore($("head")[0].firstChild);
  $.getScript("https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.6/jquery-ui.min.js",function(){
  $.getScript("https://code.jquery.com/jquery-migrate-1.4.1.js",function(){    
   $.getScript(gH+"/Multiple-Dates-Picker-for-jQuery-UI/master/jquery-ui.multidatespicker.js",function(){
    $.getScript(gH+"/redmine-autofiller/"+br+"/setup.js",function(){
     var d=new Date(),c="ukr";
     $.getScript("https://kayaposoft.com/enrico/json/v1.0/?action=getPublicHolidaysForMonth&jsonp=holidaysLoaded"+
     "&month="+(d.getMonth()+1)+"&year="+d.getFullYear()+"&country="+c).always(function(){
      $("#ldr").hide();
      setup();
     });
    });
   });
  });
 });
});
}(jQuery));

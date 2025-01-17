﻿(function($) {
    var issueNumberHTML = 
       '<p><label for="time_entry_issue_id">Issue</label><select id="time_entry_issue_id">' +
       '<option value="" data-proj-identifier="">--- Please select ---</option>' +
       '</select></p>';

    var selectorHTML = 
       '<p><label for="time_entry_activity_id">Activity</label><select id="time_entry_activity_id">' +
       '<option value="">--- Please select ---</option>' +
       '<option value="9">Development</option>' +
       '<option value="16">Testing</option>' +
       '<option value="20">Graphic Design</option>' +
       '<option value="18">Management</option>' +
       '<option value="31">Administration</option>' +
       '<option value="53">Administrative time</option>' +
       '<option value="56">Sick leave</option>' +
       '<option value="57">Vacation</option>' +
       '</select></p>';

    var hoursHTML = 
        '<p><label for="hours_per_day_id">Hours per day</label>' +
        '<input id="hours_per_day_id" type="text" value="8" size="2"></p>';

    var projectHTML = 
        '<p><label for="project_id">Project ID</label>' +
        '<input id="project_id" type="text" value="" size="15" readonly class="readonly"></p>';

    var progressHTML = 
       '<h2>Please wait...</h2><p id="randomQuote"><p><p id="randomAuthor"></p><progress id="progressBar"></progress>';

    var convertToUtc = function(dd) {
        var date = dd.getDate(), month = dd.getMonth(), year = dd.getFullYear();
        dd.setUTCDate(date); dd.setUTCMonth(month); dd.setUTCFullYear(year);
        return dd;
    };

    var postDates = function(debugMode, activityId, issueId, hours, projectId, entriesToPost) {
        if (entriesToPost.length === 0) {
            var maxVal = $("#progressBar").attr('max');
            $("#progressBar").val(maxVal);
            alert("Days were logged successfully!\n\nPlease send feedback to iaroshenko@gm" + "ail.com");
            $("#progressWrapper").hide();
            $("#fillWrapper").show();
        } else {
            var oldVal = $("#progressBar").val();
            $("#progressBar").val(oldVal + 1);
            var strDate = entriesToPost[0];
            var slicedArray = entriesToPost.slice(1);
            var nextCall = postDates.bind(null, debugMode, activityId, issueId, hours, projectId, slicedArray);
            var entryToLog = {
                "time_entry[activity_id]": activityId,
                "time_entry[comments]": "",
                "time_entry[hours]": ("" + hours),
                "time_entry[issue_id]": issueId,
                "time_entry[spent_on]": strDate
            };
            if (debugMode) {
                console.log(entryToLog);
                setTimeout(nextCall, 1000);
            } else {
                $.post("/time_entries", entryToLog, nextCall);
            }
        }
    };

    var isNumeric = function(value) {
        return /^\d+$/.test(value);
    };

    var isFloatNumber = function(value) {
        return /^(\d*[.])?\d+$/.test(value);
    };

    var clickOnFill = function() {
        var dates = $("#calendarPH").multiDatesPicker("getDates", "object");

        var activityId = $("#time_entry_activity_id").val();
        var issueId = $("#time_entry_issue_id").val();
        var hoursPerDay = $("#hours_per_day_id").val();
        var projectId = $("#project_id").val();
        var totalTime = 0;
        var hours = parseFloat(hoursPerDay);
        var entriesToPost = [];
        if (issueId == "") {
            alert("Please select Issue");
        } else if (!isNumeric(issueId)) {
            alert("Issue number is not a valid number");
        } else if (hoursPerDay == "") {
            alert("Please fill Hours per day");
        } else if (!isFloatNumber(hoursPerDay)) {
            alert("Hours per day is not a valid float number");
        } else if (hours < 0.5 || hours > 8) {
            alert("Hours per day should be between 0.5. and 8");
        } else if (activityId == "") {
            alert("Please select Activity");
        } else if (projectId == "") {
            alert("Please enter Project ID");
        } else if (dates.length === 0) {
            alert("No date selected!");
        } else {
                var originMonth = new Date().getMonth();
                for(var i = 0; i < dates.length; ++i) {
                    var dd = new Date(dates[i].valueOf());
                    dd = convertToUtc(dd);
                    var strDate = dd.toISOString().slice(0, 10);
                    if (parseInt(strDate.slice(5, 7), 10) !== (originMonth + 1)) {
                        console.log("Error in month:" + strDate + " " + (originMonth + 1));
                    } else {
                        entriesToPost.push(strDate);
                        totalTime += hours;
                    }
                }
                var questionMessage = "Are you sure you want to log " + totalTime.toFixed(2) + " hours?\n";
                var debugMode = !!window.debug;
                if (debugMode) {
                   questionMessage += "(Don't worry, it's in debug mode. No real logging will be done)";
                } else {
                    questionMessage += "(CAUTION! Real logging will be done!)";
                }
                if (confirm(questionMessage)) {
                    $("#fillWrapper").hide();
                    if ($("#progressWrapper").length === 0) {
                        var progressWrapper = $("<div id='progressWrapper' class='progressWrapper'></div>");
                        var progressBar = $(progressHTML);
                        progressBar.attr('max', entriesToPost.length);
                        progressWrapper.append(progressBar);
                        $("#mainHolder").prepend(progressWrapper);
                    } else {
                        $("#progressWrapper").show();
                    }
                    $("#progressBar").val(0);
                    $.getScript("https://api.forismatic.com/api/1.0/?method=getQuote&format=jsonp&lang=en&jsonp=showQuote");
                    postDates(debugMode, activityId, issueId, hours, projectId, entriesToPost);
            }
        }
    };

    window.showQuote = function(data) {
        $("#randomQuote").text(data.quoteText);
        $("#randomAuthor").text(data.quoteAuthor)
    };

    var clearDates = function() {
        $("#calendarPH").multiDatesPicker('resetDates', 'picked');
    };

    var holidays = [];
    var prjList = [];

    var setWorkingDates = function() {
        $("#calendarPH").multiDatesPicker('resetDates', 'picked');
        var dates = getWorkingDates();
        $("#calendarPH").multiDatesPicker('addDates', dates);
    };

    window.holidaysLoaded = function(data) {
         holidays = data;
    };

    var getWorkingDates = function() {
        var originMonth = new Date().getMonth();
        var dates = [];
        for (var i = 1; i <= 31; ++i) {        
            var dd = new Date();
            dd.setUTCDate(i);
            dd = convertToUtc(dd);
            if (dd.getMonth() !== originMonth) {
                break;
            }
            var isHoliday = false;
            var isWeekEnd = dd.getDay() === 6 || dd.getDay() === 0;
            for(var j = 0; j < holidays.length; ++j) {
                if ((holidays[j].date.day === i) 
                    && (holidays[j].englishName !== "Extra Working Day")
                    && (holidays[j].englishName !== "Holiday")
                    && (holidays[j].localName !== "\u0421\u0432\u044f\u0442\u043e")) {
                    isHoliday = true;
                    break;
                }
            }
            if (!isHoliday && !isWeekEnd) {
                dates.push(dd);
            }
        }
        return dates;
    };

    var fillIssueNumbers = function() {
        $.get("/projects.xml", function(projects) {
            var text = new XMLSerializer().serializeToString(projects);
            var xmlDoc = $.parseXML(text);
            var xml = $(xmlDoc);
            prjList = xml.find("project");
            $.get("/issues?assigned_to_id=me&set_filter=1&format=json", function(myIssues) {
                myIssues = myIssues.issues;
                for(var i = 0; i < myIssues.length; ++i) {
                    var projectIdentifier = "UNKNOWN";
                    for(var j = 0; j < prjList.length; ++j) {
                        var idStr = prjList.eq(j).find("id").text();
                        if (+idStr === myIssues[i].project.id) {
                            projectIdentifier = prjList.eq(j).find("identifier").text()
                            break;
                        }
                    }
                    var issueDisplayName = "#" + myIssues[i].id + ": " + myIssues[i].subject + " [" + projectIdentifier + "]";
                    $("#time_entry_issue_id").append("<option value='" + myIssues[i].id + "' data-proj-identifier='" + projectIdentifier + 
                                                     "'>"+ issueDisplayName  + "</option>");
                }
            });
        });
    };

    var setProjectIdentifier = function(a, b, c) {
        var projIdentifier = $("#time_entry_issue_id option:selected").attr("data-proj-identifier");
        $("#project_id").val(projIdentifier);
    };

    var showCalendar = function() {
        $("#calendarPH").multiDatesPicker({ firstDay: 1 });
        setWorkingDates();

        $('.ui-datepicker').show();
        $('.ui-datepicker-prev, .ui-datepicker-next').show();

        var actionWrapper = $("<div id='actionWrapper' class='actionWrapper'></div>");
        $("#fillWrapper").append(actionWrapper);

        var button = $("<button class='main_button'/>").text("Fill").click(clickOnFill);
        actionWrapper.append(button);
        button = $("<button/>").text("Select working days").click(setWorkingDates);
        actionWrapper.append(button);
        button = $("<button/>").text("Clear selection").click(clearDates);
        actionWrapper.append(button);

        var el;
        el = $(projectHTML);
        $("#fillWrapper").prepend(el);
        el = $(hoursHTML);
        $("#fillWrapper").prepend(el);
        el = $(selectorHTML);
        $("#fillWrapper").prepend(el);
        el = $(issueNumberHTML);
        $("#fillWrapper").prepend(el);
        el = $("<h2>Autofill script</h2>");
        $("#fillWrapper").prepend(el);

        fillIssueNumbers();
        $("#time_entry_issue_id").change(setProjectIdentifier);
    };

    window.setup = function() {
        if ($("#calendarPH").length === 0) {
            var mainHolder = $("<div id='mainHolder'></div>");
            $("#content").prepend(mainHolder);

            var fillWrapper = $("<div id='fillWrapper' class='fillWrapper'></div>");
            mainHolder.append(fillWrapper);

            var calendarPlaceholder = $("<div id='calendarPH'></div>");
            fillWrapper.append(calendarPlaceholder);
            showCalendar();
        }
    };
}(jQuery));
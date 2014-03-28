

$(function () {

    // set the login & password to use simple authenticaiton to github; otherwise it'll use oath

    var repo = "https://api.github.com/repositories/6926580/contents/src/docs"; // have to use repo ID instead of name?
    var login = "";
    var password = "";
    var currentpage;
    var pages = [];
    var qs = getQueryString();
    var access_token = qs.access_token;
   
    if (!access_token && login=="") location.href = "https://github.com/login/oauth/authorize?client_id=100124859d2b615ed99a";
    

    console.log("loading...");

    loadContents();

    
    function setHeaders(xhr) {
        if(login!="") xhr.setRequestHeader('Authorization', "Basic " + btoa(login + ":" + password));
        else xhr.setRequestHeader('Authorization', "token " + access_token);
    }



    function loadContents() {

        $.ajax({

            url: repo,
            beforeSend: setHeaders

        }).done(function (response) {

            $.each(response, function (idx, page) {
                if (page.type == "file") {

                    $.ajax({
                        url: page.git_url,
                        dataType: "text",
                        accepts: {
                            text: "application/vnd.github.raw"
                        },
                        beforeSend: setHeaders

                    }).done(function (data) {

                        var pagex = {
                            id: page.name,
                            title: getProperty(data, "title"),
                            shortTitle: getProperty(data, "shortTitle"),
                            quote: getProperty(data, "quote"),
                            summary: getProperty(data, "summary"),
                            toc: getProperty(data, "toc") == "true"
                        };

                        var match = /(^---\n[\S\s]*\n---\n)([\S\s]*)/.exec(data);
                        if (match) {
                            data = match[2];
                        }

                        pagex.content = data;
                        pagex.sections = [];


                        var re = /(\n[#]{2,3}[ ]?)([A-Za-z0-9].*)/g;
                        var m;
                        var lastSection = null;
                        var lastIndex = 0;

                        while (m = re.exec(data)) {

                            var hdr = m[1].trim();
                            var name = m[2].trim();
                            if (hdr.length == 3) {
                                lastSection.sections.push({
                                    name: name,
                                    content: ""
                                });
                            }
                            else {

                                if (lastSection) {

                                    lastSection.content = data.substring(lastIndex + lastSection.anchor.length, m.index - m[0].length - lastIndex);
                                    pagex.sections.push(lastSection);
                                }
                                lastIndex = m.index;
                                lastSection = {
                                    name: name,
                                    anchor: m[0],
                                    sections: []
                                };
                            }
                        }

                        if (lastSection) {
                            lastSection.content = data.substring(lastIndex + lastSection.anchor.length);
                            pagex.sections.push(lastSection);
                        }

                        pages.push(pagex);



                    });
                }

            });

            $(document).ajaxStop(function () {
                console.log("loaded");
                buildNav();
                console.log(pages);
            });


        }).fail(function (jqXHR, textStatus, errorThrown) {
            alert("Error requesting contents of folder from Github: " + textStatus + " " + errorThrown);
        });

    }


    function buildNav()
    {
        var n = "";

        var pc = pages.length;
        for(var pn=0; pn<pc; pn++)
        {
            var page = pages[pn];
            var pc2 = page.sections.length;


            n += "<div class='panel panel-default'><div class='panel-heading'><h4 class='panel-title level1'>";
            n += "<a data-page=" + pn + " data-toggle='collapse' data-parent='#browse' href='#section" + pn + "'>" + page.title + "</a></h4></div>";

            if(pc2>0) {
                n += "<div id='section" + pn + "' class='panel-collapse collapse'>";
                n += "<div class='panel-body' id='navpage" + pn + "'>";

                for (var pn2 = 0; pn2 < pc2; pn2++) {
                    var page2 = page.sections[pn2];
                    var pc3 = page2.sections.length;

                    n += "<div class='panel panel-default'><div class='panel-heading'><h4 class='panel-title'>";
                    n += "<a data-page=" + pn + " data-section=" + pn2 + " data-toggle='collapse' data-parent='#navpage" + pn + "' href='#section" + pn + "-" + pn2 + "'>" + page2.name + "</a></h4></div>";

                    if (pc3 > 0) {

                        n += "<div id='section" + pn + "-" + pn2 + "' class='panel-collapse collapse'>";
                        n += "<div class='panel-body'>";

                        for (var pn3 = 0; pn3 < pc3; pn3++) {
                            var page3 = page2.sections[pn3];
                            n += "<div><a data-page=" + pn + " data-section=" + pn2 + " data-subsection=" + pn3 + ">" + page3.name + "</a></div>";
                        }

                        n += "</div></div>";
                    }

                    n += "</div>";
                }


                n += "</div></div>";
            
            }
            
            n += "</div>";


        }
      
        $("#browse").html(n);


    }



    $("#browse").on("click", "a", function (event) {

        loadPage($(this));

    });


    function loadPage(a)
    {
  
        var p1 = a.data("page");
        var p2 = a.data("section");
        var p3 = a.data("subsection");
        var query = a.data("query");

        var html = convert(pages[p1].content);
        if (query != undefined)
        {
            var rx = new RegExp(query, "gi");
            html = html.replace(rx, "<span class=searchhighlight>" + query + "</span>");
        }
        $("#content").html("<h1>" + pages[p1].title + "</h1>" + html);
        currentpage = p1;

        $("#content")[0].scrollTop = 0;

        var section = "";

        if (p3 != undefined) section = pages[p1].sections[p2].sections[p3].name;
        else if (p2 != undefined) section = pages[p1].sections[p2].name;

        if (section != "") {
            section = section.toLowerCase().replace(/[^\w]+/g, '-');
            location.href = "#" + section;
        }
    }



    // search stuff

    var searchbox = $("#search");
    var browseresults = $("#browse");
    var searchresults = $("#searchresults");
    var searchclear = $("#searchclear");

    function search(q) {

        if (q == undefined) q = searchbox.val();

        if (q == "") {
            browseresults.show();
            searchresults.html("").hide();
            searchclear.hide();
        }
        else {
            browseresults.hide();
            searchresults.show();
            searchclear.show();

            var s = "";
            var s2 = "";

            var rx = new RegExp(q, "i");

            var pc = pages.length;
            for (var pn = 0; pn < pc; pn++) {
                var page = pages[pn];

                var added1 = rx.test(page.title);

                if (added1) s += buildItem(page.title, true, 1, pn);

                var pc2 = page.sections.length;
                for (var pn2 = 0; pn2 < pc2; pn2++) {
                    var page2 = page.sections[pn2];

                    var added2 = rx.test(page2.name);

                    if (added2) {
                        if (!added1) s += buildItem(page.title, false, 1, pn);
                        s += buildItem(page2.name, true, 2, pn, pn2);
                    }

                    var added2x = rx.test(page2.content);
                    if (added2x) {
                        s2 += buildTextItem(page.title + " - " + page2.name, true, 1, pn, pn2, undefined, q);
                    }

                    var pc3 = page2.sections.length;
                    for (var pn3 = 0; pn3 < pc3; pn3++) {
                        var page3 = page2.sections[pn3];

                        var added3 = rx.test(page3.name);


                        if (added3) {
                            if (!added2)
                            {
                                if (!added1) s += buildItem(page.title, false, 1, pn);
                                s += buildItem(page2.name, false, 2, pn, pn2);
                            }
                            s += buildItem(page3.name, true, 3, pn, pn2, pn3);
                        }


                    }
                }

            }


            if (s == "") s = "No title matches";
            if (s2 == "") s2 = "No body matches";

            searchresults.html(s + "<hr>" + s2);

        }


        function buildItem(title, live, level, page1, page2, page3) {
            var s = "<div class='level" + level;
            if (!live) s += " placeholder";
            s += "' data-page=" + page1;
            if (page2 != undefined) s += " data-section=" + page2;
            if (page3 != undefined) s += " data-subsection=" + page3;
            s += ">";

            s += title + "</div>";
            return s;

        }
        function buildTextItem(title, live, level, page1, page2, page3, q) {
            var s = "<div class='level" + level;
            if (!live) s += " placeholder";
            s += "' data-page=" + page1;
            if (page2 != undefined) s += " data-section=" + page2;
            if (page3 != undefined) s += " data-subsection=" + page3;
            s += " data-query='" + q + "'"
            s += ">";

            s += title + "</div>";
            return s;

        }

    }

    searchclear.on("click", function () {
        searchbox.val("");
        search();

    });


    $("#search").on("keyup", function (event, data) {
        if (event.which == 40) {
            // down
            var pick;
            var first = searchresults.find(".active");
            if (first.length == 0) pick = searchresults.find("div:first");
            else pick = first.next();
            if (pick.length == 1) select(pick);

        }
        else if (event.which == 38) {
            // up
            var pick;
            var first = searchresults.find(".active");
            if (first.length == 0) pick = searchresults.find("div:last");
            else pick = first.prev();
            if (pick.length == 1) select(pick);
        }
        else {
            window.setTimeout(search, 1);
        }

    });

    $("#searchresults").on("click", "div", function (event, data) {
        select($(this));
    });

    function select(x) {
        x.addClass("active");
       
        loadPage(x);

        // load content

        searchresults.find(".active").not(x).removeClass("active");


    }









    function convert(markdown)
    {

        // sections with the same name (most likely subsections/h3s) could trip up the anchor names...

        var renderer = new marked.Renderer();

        renderer.heading = function (text, level) {
            var escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');

            return '<h' + level + '><a name="' +
                          escapedText +
                           '" class="anchor" href="#' +
                           escapedText +
                           '"><span class="header-link"></span></a>' +
                            text + '</h' + level + '>';
        };

        return marked(markdown, { renderer: renderer });
    }

    function getProperty(data, name)
    {
        var value = "";
        var rx = new RegExp('(\n' + name + ': ["]?)(.*?)(["]?\n)', "i");
        var match = rx.exec(data);
        if (match) value = match[2];
        return value;
    }


});


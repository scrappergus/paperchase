// Config
if (Meteor.isServer) {
    WebApp.connectHandlers.use(function(req, res, next) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        return next();
    });
}


//Redirects 
// Redirect to the ROOT_URL if it doesn't match where we're at
if (Meteor.isServer) {
    WebApp.connectHandlers
    .use(function(req, res, next) {
            if(Meteor.absoluteUrl().match(req.headers.host) ) {
                return next();
            }
            else {
                res.writeHead(307, { 'Location': Meteor.absoluteUrl() });
                res.end();
            }
        });
}

// async loader for fonts
// https://github.com/typekit/webfontloader
if (Meteor.isClient) {
    WebFontConfig = {
        google: { families: [ 'Lora:400,400italic,700,700italic:latin' , 'Open Sans'] }
    };
    (function() {
            var wf = document.createElement('script');
            wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
                '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
            wf.type = 'text/javascript';
            wf.async = 'true';
            var s = document.getElementsByTagName('script')[0];
            s.parentNode.insertBefore(wf, s);
            //console.log("async fonts loaded", WebFontConfig);
    })();
    // var journal = journalConfig.findOne();
    // Session.setDefault('journal',journal);
}
Router.configure({
    loadingTemplate: 'Loading'
});

if (Meteor.isClient) {
    Router.onBeforeAction(function() {
        // Site Settings
        // ------------------------
        Meteor.subscribe('journalConfig', function(){
            Session.set('journal', journalConfig.findOne());
        });

        Meteor.call('getListWithData', 'sections', function(error,result){
            if(result){
                Session.set('sectionNav',result);
            }
        });

        this.next();
    });
}

Meteor.startup(function () {
    // Email
    // ------------------------
    if (Meteor.isServer) {
        var emailSettings = Meteor.call('getConfigRecommendationEmail');
        if(emailSettings){
            process.env.MAIL_URL = 'smtp://' + emailSettings['address'] +':' + emailSettings['pw'] + '@smtp.gmail.com:465/';
        }
    }
});


institutionUpdateInsertHook = function(userId, doc, fieldNames, modifier, options) {
    var iprnew = [];
    var iprid = ipranges.find({institutionID: doc._id});
    iprid.forEach(function(rec) {
            ipranges.remove({_id: rec._id});
    });

    if(doc.IPRanges){
        doc.IPRanges.forEach(function(ipr) {
                ipranges.insert({
                        institutionID: doc._id
                        ,startIP: ipr.startIP
                        ,endIP: ipr.endIP
                        ,startNum: dot2num(ipr.startIP)
                        ,endNum: dot2num(ipr.endIP)
                    });
            });
    }
}

institutions.after.insert(institutionUpdateInsertHook);
institutions.after.update(institutionUpdateInsertHook);
institutions.after.remove(function(userId, doc) {
    var iprid = ipranges.find({institutionID: doc._id});
    iprid.forEach(function(rec) {
        ipranges.remove({_id: rec._id});
    });
});


// DOWNLOAD ROUTES
// Router.route('/pdf/:_filename',{
//  where: 'server',
//  action: function(){
//      var name = this.params._filename;
//      var filePath = process.env.PWD + '/uploads/pdf/' + name;
//      var fs = Meteor.npmRequire('fs');
//      var data = fs.readFileSync(filePath);
//      this.response.writeHead(200, {
//        'Content-Type': 'application/pdf',
//        'Content-Disposition': 'attachment; filename=' + name
//      });
//      this.response.write(data);
//      this.response.end();
//  }
// });
Router.route('/xml-cite-set/:_filename',{
    where: 'server',
    action: function(){
        var name = this.params._filename;
        var filePath = process.env.PWD + '/xml-sets/' + name;
        // console.log(filePath);
        var fs = Meteor.npmRequire('fs');
        var data = fs.readFileSync(filePath);
        var headers = {'Content-type': 'application/xml','Content-Disposition': 'attachment'};
        this.response.writeHead(200, headers);
        this.response.write(data);
        this.response.end();
    }
});

// INTAKE ROUTES
Router.route('/admin/add-legacy-platform-article/',{
    where: 'server',
    name: 'AddLegacyAdvanceArticle',
    action: function(){
        if(this.request && this.request.connection && this.request.connection._peername && this.request.connection._peername.address){
            this.params.query.ip = this.request.connection._peername.address;
        }
        var response = this.response;
        Meteor.call('legacyArticleIntake', this.params.query, function(err, res) {
            if(err) {
                response.setHeader('Content-Type', 'application/json');
                response.end(JSON.stringify({'success':false}));
            } else {
                response.setHeader('Content-Type', 'application/json');
                response.end(JSON.stringify({'success':true}));
            }
        });
    }
});

//cache crossref doi query responses
Router.route('/admin/add-crossref-record/',{
        name: 'AddCrossRefRecord',
        where: 'server'
    }).post(function (a,b,c) {
            console.log('we posting');
            console.log(a,b,c);

            var response = this.response;
            var request = this.request;
            var aricleDoi = this.request.body;

            console.log(articleDoi);

//            Meteor.call('crossrefRecordIntake', this.params, function(err, res) {
//                    console.log(this.params);
//                    if(err) {
//                        response.setHeader('Content-Type', 'application/json');
//                        response.end(JSON.stringify({'success':false}));
//                    } else {
//                        response.setHeader('Content-Type', 'application/json');
//                        response.end(JSON.stringify({'success':true}));
//                    }
//                });

        });


// OUTTAKE ROUTES
Router.route('/get-advance-articles/',{
    where: 'server',
    waitOn: function(){
        return[
            Meteor.subscribe('publish'),
        ]
    },
    action: function(){
        // var htmlString = '<head><meta charset="UTF-8"></head><body>';
        var htmlString = "<html><head><meta name=\"robots\" content=\"noindex\"><meta name=\"google-site-verification\" content=\"63uPoFYXoHVMKO4Sp4sx5nmxlbDH0fBgMyk9rMiB68A\" /></head><body>";
        var advance = publish.findOne({name: 'advance'}, {sort:{'pubtime':-1}});
        if(advance){
            var advanceList = advance.data;
            var prevSection;
            var last_index;

            if(this.params.query.rangeStart !== undefined) {
                var rangeSize = this.params.query.rangeSize*1 || 3;
                var rangeStart = this.params.query.rangeStart*rangeSize
                var rangeEnd = rangeStart + rangeSize;
                if(rangeEnd > advanceList.length) rangeEnd = advanceList.length;
            }
            else {
                var rangeStart = 0;
                var rangeEnd = advanceList.length;
            }

            var parity=0;
            for(var i = rangeStart ; i < rangeEnd; i++){
                parity++;
                var articleInfo = advanceList[i];
                last_index = i-1
                if(i > 0) {
                    prevSection = advanceList[last_index]['section_name'];
                }
                if(articleInfo['section_start']){
                    // if(prevSection){
                    //  htmlString += '</div>';
                    // }

                    // htmlString += '<h4 class="tocSectionTitle" style="width:100%;clear:both;float:left;font-family:Arial, sans-serif;margin-top: 1em;padding-left: 1.5em;color: #FFF;background-color: #999;margin-bottom: 1em;border-left-width: thick;border-left-style: solid;border-left-color: #666;border-bottom-width: thin;border-bottom-style: solid;border-bottom-color: #666;text-transform: none !important; ">' + articleInfo['section_name'] + '</h4>';
                    // htmlString += '<div class="articlewrapper">';
                }


                if(articleInfo['section_name'] != prevSection) {
                    if(i != 0) {
                        htmlString += '</div>';
                    }

                    if(i<40 && articleInfo['section_name'] == 'Research Papers') {
                        htmlString += "<h4 id=\"recent_"+articleInfo['section_name']+"\" class=\"tocSectionTitle\">Recent "+articleInfo['section_name']+"</h4>";
                    }
                    else {
                        htmlString += "<h4 id=\""+articleInfo['section_name']+"\" class=\"tocSectionTitle\">"+articleInfo['section_name']+"</h4>";
                    }

                    htmlString += "<div style=\"margin-bottom:30px;\" class=\"clearfix\">";
                    parity = 1;
                }
                else if(parity%2==1) {
                    htmlString += "<div style=\"margin-bottom:30px;\" class=\"clearfix\">";

                }

                htmlString += "<div style=\"width:360px; margin-right:15px; float:left;\" class=\"clearfix\">";
                htmlString += '<span class="tocTitle">' + articleInfo['title'] + '</span>';

                if(articleInfo.authors && articleInfo.authors.length > 0){
                    // htmlString += '<tr>';
                    // htmlString += '<td class="tocAuthors">';

                    htmlString += '<span class="tocAuthors">';

                    if(articleInfo['ids']['doi']){
                        htmlString += '<p><b>DOI: 10.18632/oncotarget.' + articleInfo['ids']['pii'] + '</b></p>';
                    }
                    var authors = articleInfo.authors;
                    var authorsCount = authors.length;
                    htmlString += '<p>';
                    for(var a = 0 ; a < authorsCount ; a++){
                        if(authors[a]['name_first']){
                            htmlString += ' ' + authors[a]['name_first'];
                        }
                        if(authors[a]['name_middle']){
                            htmlString += ' ' + authors[a]['name_middle'];
                        }
                        if(authors[a]['name_last']){
                            htmlString += ' ' + authors[a]['name_last'];
                        }
                        if(a != parseInt(authorsCount - 1)){
                            if(authors[a]['name_first'] || authors[a]['name_middle'] || authors[a]['name_last']){
                                htmlString += ', ';
                            }
                        }
                    }
                    htmlString += '</p>';
                    htmlString += '</span>';
                }

                // LINKS
                htmlString += '<span class="tocGalleys">';
                // Abstract
                if(articleInfo.legacy_files){
                    // if(articleInfo.legacy_files.abstract && articleInfo.legacy_files.abstract != ''){
                    if([2,10,12,14,16,20,21,34,35,40,36,30].indexOf(articleInfo.section_id) == -1) {
                        htmlString += '<a href="http://www.impactjournals.com/oncotarget/index.php?journal=oncotarget&amp;page=article&amp;op=view&amp;path[]='+ articleInfo.ids.pii +'" class="file">Abstract</a>';
                        htmlString += '&nbsp;';
                    }
                    // HTML
                    if(articleInfo.legacy_files.html_galley_id){
                        htmlString += '<a href="http://www.impactjournals.com/oncotarget/index.php?journal=oncotarget&amp;page=article&amp;op=view&amp;path[]=' + articleInfo.ids.pii + '&amp;path%5B%5D=' + articleInfo.legacy_files.html_galley_id + '" class="file">HTML</a>';
                        htmlString += '&nbsp;';
                    }
                    // PDF
                    if(articleInfo.legacy_files.pdf_galley_id){
                        htmlString += '<a href="http://www.impactjournals.com/oncotarget/index.php?journal=oncotarget&amp;page=article&amp;op=view&amp;path[]=' + articleInfo.ids.pii + '&amp;path%5B%5D=' + articleInfo.legacy_files.pdf_galley_id + '" class="file">PDF</a>';
                        htmlString += '&nbsp;';
                    }
                    // Supplemental
                    if(articleInfo.legacy_files.has_supps){
                        htmlString += '<a href="javascript:openRTWindow(\'http://www.impactjournals.com/oncotarget/index.php?journal=oncotarget&amp;page=rt&amp;op=suppFiles&amp;path[]=' + articleInfo.ids.pii + '&amp;path%5B%5D=\');" class="file">Supplementary Information</a>';
                        htmlString += '&nbsp;';
                    }
                }

                htmlString += '</span>';

                htmlString += '</div>';

                if(parity%2==0) {
                    htmlString += '</div>';
                }
            }

            htmlString += '</body></html>';
            var headers = {'Content-type': 'text/html', 'charset' : 'UTF-8'};
            this.response.writeHead(200, headers);
            this.response.end(htmlString);
        }
    }
});


Router.route('/article/:_id/doi', {
        where: 'server',
        action: function() {
            htmlString = "";

            var articleExistsExists = articles.findOne({'ids.pii': this.params._id});
            if(articleExistsExists){
                htmlString = articleExistsExists.ids.doi || '';
            }


            var headers = {'Content-type': 'text/html', 'charset' : 'UTF-8'};
            this.response.writeHead(200, headers);
            this.response.end(htmlString);

        }
    });



Router.route('/get-interviews/',{
    where: 'server',
    action: function(){
        var interviews = newsList.find({display: true, interview: true},{sort: {'date':-1}}).fetch();
        var htmlString = '<html><head><meta name="robots" content="noindex"></head><body>';
        for(var i=0; i< interviews.length; i++){
            var interview = interviews[i];
            htmlString+= '<div style="float:left;">';
            if(interview.title){
                htmlString+= '<h3>' + interview.title + '</h3>';
            }
            if(interview.youTube){
                htmlString+= '<iframe width="470" height="265" src="https://www.youtube.com/embed/' + interview.youTube + '" frameborder="0" allowfullscreen></iframe>';
            }
            if(interview.content){
                htmlString+= '<p>' + interview.content + '</p>';
            }
            if(interview.tags){
                var tags = interview.tags;
                for(var tag=0 ; tag < tags.length ; tag++){
                    htmlString+= '<span class="interview-tag" style="padding:5px;margin:0px 10px 10px 0px;border:1px solid;float:left;display:block;width:auto;">' + interview.tags[tag] + '</span>';
                }
            }

            htmlString+='</div>';
        };
        htmlString += '</body></html>';
        var headers = {'Content-type': 'text/html', 'charset' : 'UTF-8'};
        this.response.writeHead(200, headers);
        this.response.end(htmlString);
    }
});

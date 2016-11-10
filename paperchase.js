// Config
if (Meteor.isServer) {
    WebApp.connectHandlers.use(function(req, res, next) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        return next();
    });
}

// async loader for fonts
// https://github.com/typekit/webfontloader
if (Meteor.isClient) {
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
}


// Redirects
// Global redirect for pre-launch
if (Meteor.isServer) {
    WebApp.connectHandlers
    .use(function(req, res, next) {
            if(req.headers.host.match('paperchase.impactaging.com') ) {
                res.writeHead(307, { 'Location': "http://www.aging-us.com" });
                res.end();
            }
            else {
                return next();
            }
        });
}


Router.configure({
    loadingTemplate: 'Loading',
    trackPageView: true
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
            process.env.MAIL_URL = 'smtp://' + emailSettings.address +':' + emailSettings.pw + '@smtp.gmail.com:465/';
        }
    }

});

// Altmetric
// ---------
if (Meteor.isClient) {
    // Session.set('altmetric-ready', false);
    Meteor.startup(function () {
        // $.getScript('https://d1bxh8uas1mnw7.cloudfront.net/assets/embed.js', function(a, b, c){
        //     if(b == 'success') {
        //         Session.set('altmetric-ready', true);
        //     }
        // });
        // Get top articles
        Meteor.call('getAltmetricTop', 50, function(altmetricError, altmetricResult){
            if (altmetricError) {
                console.error('altmetricError', altmetricError);
            } else if (altmetricResult) {
                Session.set('altmetric-count', altmetricResult.length);
                Session.set('altmetric-top', altmetricResult);
            }
        });
    });
}



institutionUpdateInsertHook = function(userId, doc, fieldNames, modifier, options) {
    var iprnew = [];
    var iprid = ipranges.find({institutionID: doc._id});
    iprid.forEach(function(rec) {
            ipranges.remove({_id: rec._id});
    });

    if(doc.IPRanges){
        doc.IPRanges.forEach(function(ipr) {
                ipranges.insert({
                        institutionID: doc._id,
                        startIP: ipr.startIP,
                        endIP: ipr.endIP,
                        startNum: dot2num(ipr.startIP),
                        endNum: dot2num(ipr.endIP)
                    });
            });
    }
};

institutions.after.insert(institutionUpdateInsertHook);
institutions.after.update(institutionUpdateInsertHook);
institutions.after.remove(function(userId, doc) {
    var iprid = ipranges.find({institutionID: doc._id});
    iprid.forEach(function(rec) {
        ipranges.remove({_id: rec._id});
    });
});


// DOWNLOAD ROUTES
// ---------------
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
            var rangeStart,
                rangeEnd;

            if(this.params.query.rangeStart !== undefined) {
                var rangeSize = this.params.query.rangeSize*1 || 3;
                rangeStart = this.params.query.rangeStart*rangeSize;
                rangeEnd = rangeStart + rangeSize;
                if(rangeEnd > advanceList.length) rangeEnd = advanceList.length;
            }
            else {
                rangeStart = 0;
                rangeEnd = advanceList.length;
            }

            var parity=0;
            for(var i = rangeStart ; i < rangeEnd; i++){
                parity++;
                var articleInfo = advanceList[i];
                last_index = i-1;
                if(i > 0) {
                    prevSection = advanceList[last_index].section_name;
                }
                if(articleInfo.section_start){
                    // if(prevSection){
                    //  htmlString += '</div>';
                    // }

                    // htmlString += '<h4 class="tocSectionTitle" style="width:100%;clear:both;float:left;font-family:Arial, sans-serif;margin-top: 1em;padding-left: 1.5em;color: #FFF;background-color: #999;margin-bottom: 1em;border-left-width: thick;border-left-style: solid;border-left-color: #666;border-bottom-width: thin;border-bottom-style: solid;border-bottom-color: #666;text-transform: none !important; ">' + articleInfo.section_name + '</h4>';
                    // htmlString += '<div class="articlewrapper">';
                }


                if(articleInfo.section_name != prevSection) {
                    if(i !== 0) {
                        htmlString += '</div>';
                    }

                    if(i<40 && articleInfo.section_name == 'Research Papers') {
                        htmlString += "<h4 id=\"recent_"+articleInfo.section_name+"\" class=\"tocSectionTitle\">Recent "+articleInfo.section_name+"</h4>";
                    }
                    else {
                        htmlString += "<h4 id=\""+articleInfo.section_name+"\" class=\"tocSectionTitle\">"+articleInfo.section_name+"</h4>";
                    }

                    htmlString += "<div style=\"margin-bottom:30px;\" class=\"clearfix\">";
                    parity = 1;
                }
                else if(parity%2==1) {
                    htmlString += "<div style=\"margin-bottom:30px;\" class=\"clearfix\">";

                }

                htmlString += "<div style=\"width:360px; margin-right:15px; float:left;\" class=\"clearfix\">";
                htmlString += '<span class="tocTitle">' + articleInfo.title + '</span>';

                if(articleInfo.authors){
                    // htmlString += '<tr>';
                    // htmlString += '<td class="tocAuthors">';

                    htmlString += '<span class="tocAuthors">';

                    if(articleInfo.ids.doi){
                        htmlString += '<p><b>DOI: 10.18632/oncotarget.' + articleInfo.ids.pii + '</b></p>';
                    }
                    var authors = articleInfo.authors;
                    var authorsCount = authors.length;
                    htmlString += '<p>';
                    for(var a = 0 ; a < authorsCount ; a++){
                        if(authors[a].name_first){
                            htmlString += ' ' + authors[a].name_first;
                        }
                        if(authors[a].name_middle){
                            htmlString += ' ' + authors[a].name_middle;
                        }
                        if(authors[a].name_last){
                            htmlString += ' ' + authors[a].name_last;
                        }
                        if(a != parseInt(authorsCount - 1)){
                            if(authors[a].name_first || authors[a].name_middle || authors[a].name_last){
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

                if(parity%2===0) {
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
        }
        htmlString += '</body></html>';
        var headers = {'Content-type': 'text/html', 'charset' : 'UTF-8'};
        this.response.writeHead(200, headers);
        this.response.end(htmlString);
    }
});

if (Meteor.isClient) {
    Session.setDefault('formMethod','');
    Session.setDefault('fileNameXML',''); //LIVE
    // Session.setDefault('fileNameXML','PMC2815766.xml'); //LOCAL TESTING
    Session.setDefault('error',false);
    Session.setDefault('errorMessages',null);
    Session.setDefault('articleData',null);
    Session.setDefault('article-id',null);// Article Overview, Article Full Text, Article Purchase
    Session.setDefault('article-files',null);
    Session.setDefault('article-text',null);
    Session.setDefault('article-text-modified',null);
    Session.setDefault('affIndex',null);
    Session.setDefault('missingPii',null);
    Session.setDefault('preprocess-article',false);
    Session.setDefault('issue',null);
    Session.setDefault('issueMeta',null);
    Session.setDefault('issueParams',null);
    // for side navigation
    Session.setDefault('sectionNav',null);
    // for section papers list
    Session.setDefault('article-list',null);
    // for archive.
    Session.setDefault('archive',null);
    Session.setDefault('article-visitor',null);
    // altmetrics badge
    // Session.setDefault('altmetric-ready', false);
    // Session.setDefault('badge-visible', false);
    Session.setDefault('altmetric-top', null);
    Session.setDefault('altmetric-count', 50);
    Session.setDefault('article-altmetric', null); // for single article
    // conferences
    Session.setDefault('conferences', false);

    // Redirects
    // Currently making this the section for puttincg all redirect code. If there's a better way to do this, let's try it out.
    Router.route('/index.html', function() {
            Router.go('/');
        });
    Router.route('/editors.html', function() {
            Router.go('/editorial-board');
        });
    Router.route('/ethics.html', function() {
            Router.go('/ethics');
        });
    Router.route('/forAuthors.html', function() {
            Router.go('/for-authors');
        });

    Router.route('/contact.html', function() {
            Router.go('/contact');
        });

    Router.route('/contacts.html', function() {
            Router.go('/contact');
        });
    Router.route('/about.html', function() {
            Router.go('/about');
        });
    // End Redirects


    Router.route('/contents', {
        onBeforeAction: function(){
            Meteor.impact.redirectForAlt();
            this.next();
        },
        waitOn: function(){
            return[
                Meteor.subscribe('issueByVolNum', this.params.query.volumeId, this.params.query.issueId),
            ];
        },
        action: function() {
            var issue = issues.find().fetch();
            issue = issue[0];
            var route = "/issue/v"+issue.volume+"i"+issue.issue;
            Router.go(route);
        }
    });

    // Begin Legacy LinkOut
    Router.route('/papers/:v/:n/:full/:pii', function() {
        if (this.params.pii.match('.html')) {
            Meteor.impact.redirectForAlt();
            var pii = this.params.pii.replace('.html', '').replace('a', '');
            if(Meteor.subscribe('articleByPii', pii)) {
                var articleByPii = articles.findOne({"ids.pii": pii});
                // check if :_id is a pii and not Mongo ID
                if(articleByPii){
                    Router.go("/article/"+articleByPii._id+"/text");
                }
            }
        } else {
            Meteor.impact.redirectForAlt();
        }
    });

    Router.route('/papers/:v/:n/:full/:pii/:file', function() {
        window.location.href = "http://archive.impactaging.com"+document.location.pathname;
    });

    Router.route('/full/:pii', function() {
        Meteor.impact.redirectForAlt();
        var pii = this.params.pii;
        Meteor.subscribe('articleByPii', pii, function() {
            var articleByPii = articles.findOne({"ids.pii": pii});
            if(articleByPii){
                Router.go("/article/"+articleByPii._id+"/text");
            }
        });
    });

    Router.route('/full/:volume/:page_start', function() {
        Meteor.impact.redirectForAlt();
        var volume = parseInt(this.params.volume);
        var page_start = parseInt(this.params.page_start);

        Meteor.subscribe('articleByVolumePage', volume, page_start, function() {
            var article = articles.findOne({'volume': volume, page_start: page_start});

            if(article){
                Router.go("/article/"+article._id+"/text");
            }
        });
    });
    // End Legacy LinkOut

    Router.route('/current', {
        name: 'Current',
        onBeforeAction: function(){
            Meteor.impact.redirectForAlt();
            this.next();
        },
        waitOn: function() {
            return [
                Meteor.subscribe('currentIssue'),
            ];
        },
        action: function() {
            var current = issues.findOne();
            if(current){
                Router.go("/issue/v" + current.volume + "i" + current.issue);
            }
        }
    });

    Router.route('/', {
        name: 'Home',
        layoutTemplate: 'Visitor',
        onBeforeAction: function(){
            Meteor.impact.redirectForAlt();
            this.next();
        },
        waitOn: function(){
            Meteor.impact.redirectForAlt();
            return[
                Meteor.subscribe('homePagePublic'),
                Meteor.subscribe('sortedList','homePage'),
                Meteor.subscribe('feature'),
                Meteor.subscribe('eic'),
                Meteor.subscribe('eb'),
                Meteor.subscribe('newsListDisplay'),
                Meteor.subscribe('currentIssue'),
                Meteor.subscribe('mostRecentInterview')
            ];
        },
        data: function(){
            if(this.ready()){
                var featureList = articles.find({'feature':true},{sort:{'_id':1}}).fetch();

                var sections = homePage.find().fetch();
                var sorted  = sorters.findOne();

                var mostRecentInterview = newsList.findOne({display:true, interview:true},{sort : {date: -1}});

                return {
                    feature : featureList,
                    eic: edboard.find({role: 'Editor-in-Chief'}) ,
                    eb: edboard.find({role: 'Founding Editorial Board'}),
                    news:  newsList.find({display:true, interview:false},{sort : {date: -1}}).fetch(),
                    sections : sorted.ordered,
                    interview : mostRecentInterview
                };
            }
        },
        onAfterAction: function() {
            if (!Meteor.isClient) {
                return;
            }
            var title = Meteor.settings.public.journal.name;

            SEO.set({
                title: title
            });
        }
    });

    Router.route('/advance', {
        name: 'Advance',
        layoutTemplate: 'Visitor',
        onBeforeAction: function(){
            Meteor.impact.redirectForAlt();
            this.next();
        },
        waitOn: function(){
            Meteor.impact.redirectForAlt();
            return [
                Meteor.subscribe('journalConfig'),
                Meteor.subscribe('advance'),
                Meteor.subscribe('sortedList','advance')
            ];
        },
        data: function(){
            if (this.ready()) {
                var sorted  = sorters.findOne({'name':'advance'});
                return {
                    articles : sorted.ordered
                };
            }
        },
        onAfterAction: function() {
            if (!Meteor.isClient) {
                return;
            }
            var title = Meteor.settings.public.journal.name + ' | Advance Articles';

            SEO.set({
                title: title
            });
        }
    });

    Router.route('/account', {
        name: 'Account',
        layoutTemplate: 'Visitor',
        onBeforeAction: function(){
            Meteor.impact.redirectForAlt();
            this.next();
        },
        onAfterAction: function() {
            if (!Meteor.isClient) {
                return;
            }
            var title = Meteor.settings.public.journal.name + ' | Account';

            SEO.set({
                title: title
            });
        }
    });

    Router.route('/conferences', {
        name: 'Conferences',
        layoutTemplate: 'Visitor',
        waitOn: function(){
            return [
                Meteor.subscribe('currentIssue')
            ];
        },
        onBeforeAction: function(){
            Meteor.impact.redirectForAlt();
            Meteor.call('conferencesPastAndFuture', function(error, result){
                if (error) {
                    console.error(error);
                } else {
                    Session.set('conferences', result);
                }
            });
            this.next();
        },
        onAfterAction: function() {
            if (!Meteor.isClient) {
                return;
            }
            var title = Meteor.settings.public.journal.name + ' | Conferences';

            SEO.set({
                title: title
            });
        }
    });

    Router.route('/top-articles', {
        name: 'TopArticles',
        layoutTemplate: 'Visitor',
        onBeforeAction: function(){
            Meteor.impact.redirectForAlt();
            this.next();
        },
        waitOn: function(){
            Meteor.impact.redirectForAlt();
            return[
                Meteor.subscribe('currentIssue'),
            ];
        },
        title: function() {
            var pageTitle = '';
            if(Session.get('journal')){
                pageTitle = Session.get('journal').journal.name + ' | ';
            }
            return pageTitle + 'Top Articles';
        },
    });

    Router.route('/archive', {
        name: 'Archive',
        layoutTemplate: 'Visitor',
        onBeforeAction: function(){
            Meteor.impact.redirectForAlt();
            Meteor.call('archive',function(error,result){
                if(error){
                    console.error('Archive Error', error);
                }else if(result){
                    Session.set('archive',result);
                }
            });
            this.next();
        },
        onAfterAction: function() {
            if (!Meteor.isClient) {
                return;
            }
            var title = Meteor.settings.public.journal.name + ' | Archive';

            SEO.set({
                title: title
            });
        }
    });

    Router.route('/editorial-board', {
        name: 'EdBoard',
        layoutTemplate: 'Visitor',
        onBeforeAction: function(){
            Meteor.impact.redirectForAlt();
            this.next();
        },
        waitOn: function(){
            return[
                Meteor.subscribe('eic'),
                Meteor.subscribe('fullBoard')
            ];
        },
        data: function(){
            return {
                eic: edboard.find({role:"Editor-in-Chief"},{sort : {name_last:-1}}),
                fullBoard: edboard.find({$or: [{role:"Founding Editorial Board"}, {role:"Editorial Board"}]},{sort : {name_last:1}})
            };
        },
        onAfterAction: function() {
            if (!Meteor.isClient) {
                return;
            }
            var title = Meteor.settings.public.journal.name + ' | Editorial Board';

            SEO.set({
                title: title
            });
        }
    });

    Router.route('/for-authors', {
        name: 'ForAuthors',
        layoutTemplate: 'Visitor',
        onBeforeAction: function(){
            Meteor.impact.redirectForAlt();
            this.next();
        },
        waitOn: function(){
            return[
                Meteor.subscribe('forAuthorsPublic'),
                Meteor.subscribe('sortedList','forAuthors')
            ];
        },
        data: function(){
            if(this.ready()){
                var sections = forAuthors.find().fetch();
                var sorted  = sorters.findOne();
                return {
                    sections : sorted.ordered
                };
            }
        },
        onAfterAction: function() {
            if (!Meteor.isClient) {
                return;
            }
            var title = Meteor.settings.public.journal.name + ' | For Authors';

            SEO.set({
                title: title
            });
        }
    });

    Router.route('/about', {
        name: 'About',
        layoutTemplate: 'Visitor',
        onBeforeAction: function(){
            Meteor.impact.redirectForAlt();
            this.next();
        },
        waitOn: function(){
            return[
                Meteor.subscribe('aboutPublic'),
                Meteor.subscribe('sortedList','about')
            ];
        },
        data: function(){
            if(this.ready()){
                var sections = about.find().fetch();
                var sorted  = sorters.findOne();
                return {
                    sections : sorted.ordered
                };
            }
        },
        onAfterAction: function() {
            if (!Meteor.isClient) {
                return;
            }
            var title = Meteor.settings.public.journal.name + ' | About the Journal';

            SEO.set({
                title: title
            });
        }
    });

    Router.route('/ethics', {
        name: 'Ethics',
        layoutTemplate: 'Visitor',
        onBeforeAction: function(){
            Meteor.impact.redirectForAlt();
            this.next();
        },
        waitOn: function(){
            return[
                Meteor.subscribe('ethicsPublic'),
                Meteor.subscribe('sortedList','ethics')
            ];
        },
        data: function(){
            if(this.ready()){
                var sections = ethics.find().fetch();
                var sorted  = sorters.findOne();
                return {
                    sections : sorted.ordered
                };
            }
        },
        onAfterAction: function() {
            if (!Meteor.isClient) {
                return;
            }
            var title = Meteor.settings.public.journal.name + ' | Publication Ethics and Publication Malpractice Statements';

            SEO.set({
                title: title
            });
        }
    });

    Router.route('/contact', {
        name: 'Contact',
        layoutTemplate: 'Visitor',
        onBeforeAction: function(){
            Meteor.impact.redirectForAlt();
            this.next();
        },
        waitOn: function(){
            return[
                Meteor.subscribe('contact')
            ];
        },
        data: function(){
            if(this.ready()){
                var contactInfo = contact.findOne();
                return {
                    contact: contactInfo
                };
            }
        },
        onAfterAction: function() {
            if (!Meteor.isClient) {
                return;
            }
            var title = Meteor.settings.public.journal.name + ' | Contact';

            SEO.set({
                title: title
            });
        }
    });

    Router.route('/recent-breakthroughs', {
        name: 'RecentBreakthroughs',
        layoutTemplate: 'Visitor',
        onBeforeAction: function(){
            Meteor.impact.redirectForAlt();
            this.next();
        },
        onAfterAction: function() {
            if (!Meteor.isClient) {
                return;
            }
            var title = Meteor.settings.public.journal.name + ' | Recent Breakthroughs';

            SEO.set({
                title: title
            });
        }
    });

    Router.route('/issue/:vi', {
        name: 'Issue',
        parent: 'Archive',
        layoutTemplate: 'Visitor',
        title: function() {
            var pageTitle = '';
            var pieces = {};

            if(this.data && this.data () && this.data().article && this.data().article.volume && this.data().article){
                // for article breadcrumbs, which will try to use the issue mongo ID as the param, but we use vol/issue
                pieces.volume = this.data().article.volume;
                pieces.issue = this.data().article.issue;
            }else{
                pieces = Meteor.issue.urlPieces(this.params.vi);
            }

            if(Session.get('journal')){
                pageTitle = Session.get('journal').journal.name + ' | ';
            }

            if(pieces && pieces.volume){
                pageTitle += 'Volume ' + pieces.volume + ', Issue ' + pieces.issue;
            }

            return pageTitle;
        },
        onBeforeAction: function(){
            Meteor.impact.redirectForAlt();
            var pieces = Meteor.issue.urlPieces(this.params.vi);
            // TODO: add redirect if no issue
            if(pieces && pieces.volume){
                Session.set('issueParams', {volume: parseInt(pieces.volume), issue: pieces.issue.toString()});
                Meteor.call('getIssueMeta', pieces.volume, pieces.issue, function(error, issueMeta){
                    if(error){
                        console.error('ERROR - getIssueAndFiles',error);
                    }
                    else if(issueMeta){
                        Session.set('issueMeta', issueMeta);
                    }
                });



                if( !Session.get('issue') || Session.get('issue') && Session.get('issue').issue != pieces.issue || Session.get('issue') && Session.get('issue').volume != pieces.volume){
                    Meteor.call('getIssueAndFiles', pieces.volume, pieces.issue, false, function(error,result){
                        if(error){
                            console.error('ERROR - getIssueAndFiles',error);
                        }
                        else if(result){
                            Session.set('issue',result);
                        }
                    });
                }
            }

            this.next();
        },
        onAfterAction: function() {
            if (!Meteor.isClient) {
                return;
            }
            var title = Meteor.settings.public.journal.name;

            var pieces = {};

            if(this.data && this.data () && this.data().article && this.data().article.volume && this.data().article){
                // for article breadcrumbs, which will try to use the issue mongo ID as the param, but we use vol/issue
                pieces.volume = this.data().article.volume;
                pieces.issue = this.data().article.issue;
            }else{
                pieces = Meteor.issue.urlPieces(this.params.vi);
            }


            if(pieces && pieces.volume){
                title += ' | Volume ' + pieces.volume + ', Issue ' + pieces.issue;
            }

            SEO.set({
                title: title
            });
        }
    });

    // Begin Article
    Router.route('/article/:_id', {
        name: 'Article',
        parent: function() {
            return Meteor.article.breadcrumbParent(this.data());
        },
        layoutTemplate: 'Visitor',
        onBeforeAction: function(){
            Meteor.impact.redirectForAlt();
            // check if article exists
            var articleExistsExists = articles.findOne({'_id': this.params._id});

            // Redirect if not set to display
            // if(!articleExistsExists){
            //     Router.go('ArticleNotFound');
            // } else if (!articleExistsExists.display){
            //     Router.go('Home');
            // } else{
            //     Meteor.article.altmetric(articleExistsExists);
            // }

            // DO NOT Redirect if not set to display. Uncomment above & remove below when ready
            if(!articleExistsExists){
                Router.go('ArticleNotFound');
            } else{
                Meteor.article.altmetric(articleExistsExists);
            }

            Meteor.article.readyFullText(this.params._id);


            this.next();
        },
        onAfterAction: function() {
            if (!Meteor.isClient) {
                return;
            }
            var meta = {};
            var title = Meteor.settings.public.journal.name;
            var doi;

            if (this.data() && this.data().article) {
                if (this.data().article.ids && this.data().article.ids.doi){
                    doi = this.data().article.ids.doi.replace('http://dx.doi.org/', '');
                    meta.citation_doi = 'doi:' + doi;
                }

                if (this.data().article.title) {
                    title += ' | ' +  Meteor.article.pageTitle(this.params._id, null);
                }
            }

            SEO.set({
                title: title,
                meta: meta
            });
        },
        waitOn: function(){
            return[
                Meteor.subscribe('articleInfo',this.params._id),
                Meteor.subscribe('articleIssue',this.params._id),
                Meteor.subscribe('articleTypes'),
                Meteor.subscribe('journalConfig')
            ];
        },
        data: function(){
            if(this.ready()){
                var article = articles.findOne({'_id': this.params._id});
                if(article){
                    article = Meteor.article.readyData(article);
                    return {
                        article: article
                    };
                }
            }
        }
    });

    Router.route('/article/:_id/text', {
        name: 'ArticleText',
        parent: function() {
            return Meteor.article.breadcrumbParent(this.data());
        },
        layoutTemplate: 'Visitor',
        onBeforeAction: function() {
            Meteor.impact.redirectForAlt();
            // check if article exists
            var articleExistsExists = articles.findOne({'_id': this.params._id});

            // Redirect if not set to display
            // if(!articleExistsExists){
            //     Router.go('ArticleNotFound');
            // } else if (!articleExistsExists.display){
            //     Router.go('Home');
            // } else{
            //     Meteor.article.altmetric(articleExistsExists);
            // }

            // DO NOT Redirect if not set to display. Uncomment above & remove below when ready
            if(!articleExistsExists){
                Router.go('ArticleNotFound');
            } else{
                Meteor.article.altmetric(articleExistsExists);
            }

            Meteor.article.readyFullText(this.params._id);

            Session.set('article-id',this.params._id);
            this.next();
        },
        waitOn: function() {
            return [
                Meteor.subscribe('articleInfo', this.params._id),
                Meteor.subscribe('articleIssue', this.params._id),
                Meteor.subscribe('articleTypes'),
                Meteor.subscribe('journalConfig')
            ];
        },
        data: function() {
            if (this.ready()) {
                var article = articles.findOne({
                    '_id': this.params._id
                });
                if (article) {
                    article = Meteor.article.readyData(article);
                    if(article && article.files && article.files.xml && !article.files.xml.display){
                        Router.go('Article', {_id : this.params._id});
                    }
                    return {
                        article: article
                    };
                }
            }
        },
        onAfterAction: function() {
            if (!Meteor.isClient) {
                return;
            }
            var meta = {};
            var title = Meteor.settings.public.journal.name;
            var doi;

            if (this.data() && this.data().article) {
                if (this.data().article.ids && this.data().article.ids.doi){
                    doi = this.data().article.ids.doi.replace('http://dx.doi.org/', '');
                    meta.citation_doi = 'doi:' + doi;
                }

                if (this.data().article.title) {
                    title += ' | ' +  Meteor.article.pageTitle(this.params._id, ' - Full Text');
                }
            }

            SEO.set({
                title: title,
                meta: meta
            });
        }
    });

    Router.route('/article/:_id/purchase', {
        name: 'PurchaseArticle',
        layoutTemplate: 'Visitor',
        waitOn: function(){
            Meteor.impact.redirectForAlt();
            return[
                Meteor.subscribe('articleInfo',this.params._id)
            ];
        },
        onBeforeAction: function() {
            Meteor.impact.redirectForAlt();
            // check if article exists
            var articleExistsExists = articles.findOne({'_id': this.params._id});
            if(!articleExistsExists){
                Router.go('ArticleNotFound');
            } else if (!articleExistsExists.display){
                Router.go('Home');
            }

            Session.set('article-id',this.params._id);
            this.next();
        },
        data: function(){
            if(this.ready()){
                var id = this.params._id;
                Session.set('article-id',this.params._id);
                var article = articles.findOne({'_id': id});
                return {
                    article: article,
                };
            }
        },
        onAfterAction: function() {
            if (!Meteor.isClient) {
                return;
            }
            var meta = {};
            var title = Meteor.settings.public.journal.name;
            var doi;

            if (this.data() && this.data().article) {
                if (this.data().article.ids && this.data().article.ids.doi){
                    doi = this.data().article.ids.doi.replace('http://dx.doi.org/', '');
                    meta.citation_doi = 'doi:' + doi;
                }

                if (this.data().article.title) {
                    title += ' | ' +  Meteor.article.pageTitle(this.params._id, ' - Purchase');
                }
            }

            SEO.set({
                title: title,
                meta: meta
            });
        }
    });

    Router.route('/figure/:article/:figureId', {
        name: 'ArticleFigureViewer',
        layoutTemplate: 'ArticleFigureViewer',
        waitOn: function(){
            Meteor.impact.redirectForAlt();
            return[
                Meteor.subscribe('articleInfo', this.params.article),
                Meteor.subscribe('articleTypes')
            ];
        },
        data: function(){
            if(this.ready()){
                var article,
                    figure;
                var articleId = this.params.article;
                var figureId = this.params.figureId;


                article = articles.findOne({'_id': articleId});

                if (article) {
                    article = Meteor.article.readyData(article);

                    Session.set('article',article);
                    Session.set('article-id',articleId);

                    if(article && figureId && article.files && article.files.figures){
                        article.files.figures.forEach(function(fig){
                            if(fig.id.toLowerCase() === figureId.toLowerCase()){
                                figure = fig;
                            }
                        });
                    } else if(articleId){
                         Router.go('Article',{_id : articleId});
                    }

                    if(!figure && articleId){
                        Router.go('Article',{_id : articleId});
                    }
                } else {
                    Router.go('ArticleNotFound')
                }


                return {
                    article: article,
                    figure: figure
                };
            }
        },
        onBeforeAction: function() {
            Meteor.impact.redirectForAlt();
            // check if article exists
            var articleExistsExists = articles.findOne({'_id': this.params.article});
            // Redirect if not set to display
            // if(!articleExistsExists){
            //     Router.go('ArticleNotFound');
            // } else if (!articleExistsExists.display){
            //     Router.go('Home');
            // } else{
            //     Meteor.article.altmetric(articleExistsExists);
            // }

            // DO NOT Redirect if not set to display. Uncomment above & remove below when ready
            if(!articleExistsExists){
                Router.go('ArticleNotFound');
            } else{
                Meteor.article.altmetric(articleExistsExists);
            }

            Session.set('article-id',this.params._id);
            this.next();
        },
        onAfterAction: function() {
            if (!Meteor.isClient) {
                return;
            }
            var articleId = this.params.query.article;
            var meta = {};
            var title = Meteor.settings.public.journal.name;
            var doi;

            if (this.data() && this.data().article) {
                if (this.data().article.ids && this.data().article.ids.doi){
                    doi = this.data().article.ids.doi.replace('http://dx.doi.org/', '');
                    meta.citation_doi = 'doi:' + doi;
                }

                if (this.data().article.title) {
                    title += ' | ' +  Meteor.article.pageTitle(articleId, ' - Figure');
                }
            }

            SEO.set({
                title: title,
                meta: meta
            });
        }
    });

    Router.route('/404/article', {
        name: 'ArticleNotFound',
        layoutTemplate: 'Visitor',
        onBeforeAction: function(){
            Meteor.impact.redirectForAlt();
            this.next();
        },
        onAfterAction: function() {
            if (!Meteor.isClient) {
                return;
            }
            var title = Meteor.settings.public.journal.name + ' | 404: Article Not Found';

            SEO.set({
                title: title
            });
        }
    });
    // End Article

    // Recommend template does not exist
    Router.route('/recommend', {
        name: 'Recommend',
        layoutTemplate: 'Visitor',
        onBeforeAction: function(){
            Meteor.impact.redirectForAlt();
            this.next();
        },
        waitOn: function(){
            Meteor.subscribe('currentUser');
        },
        data: function(){
            if(Meteor.user()){
                var u =  Meteor.users.findOne();
                return {
                    user: u
                };
            }
        },
        onAfterAction: function() {
            if (!Meteor.isClient) {
                return;
            }
            var title = Meteor.settings.public.journal.name + ' | Recommend';

            SEO.set({
                title: title
            });
        }
    });

    Router.route('/section/:_section_dash_name', {
        name: 'SectionPapers',
        layoutTemplate: 'Visitor',
        onBeforeAction: function(){
            Meteor.impact.redirectForAlt();
            Meteor.call('preprocessSectionArticles',articles.find().fetch(), function(error,result){
                if(error){
                    console.log('ERROR - preprocessSectionArticles');
                    console.log(error);
                }
                if(result){
                    Session.set('article-list',result);
                }
            });
            this.next();
        },
        waitOn: function(){
            Meteor.impact.redirectForAlt();
            return [
                Meteor.subscribe('sectionPapersByDashName', this.params._section_dash_name)
            ];
        },
        data: function(){
            if(this.ready()){
                // TODO: this route forever loads. Currently it is not in use
                // more data set in helpersData.js, articles
                return {
                    section : sections.findOne({dash_name : this.params._section_dash_name})
                };
            }
        },
        onAfterAction: function() {
            if (!Meteor.isClient) {
                return;
            }
            var title = Meteor.settings.public.journal.name;

            var section = sections.findOne({dash_name : this.params._section_dash_name});
            if (section) {
                title += ' | ' + section.name;
            }

            SEO.set({
                title: title
            });
        }
    });

    Router.route('/subscribe', {
        name: 'Subscribe',
        layoutTemplate: 'Visitor',
        onBeforeAction: function(){
            Meteor.impact.redirectForAlt();
            this.next();
        },
        waitOn: function(){
            return[
                Meteor.subscribe('currentIssue')
            ];
        },
        data: function(){
            if(this.ready()){
                return{
                    issue: issues.findOne(),
                    today: new Date(),
                    nextYear: new Date(new Date().setYear(new Date().getFullYear() + 1))
                };
            }
        },
        onAfterAction: function() {
            if (!Meteor.isClient) {
                return;
            }
            var title = Meteor.settings.public.journal.name + ' | Subscribe';

            SEO.set({
                title: title
            });
        }
    });

    Router.route('/search', {
        name: 'Search',
        layoutTemplate: 'Visitor',
        onBeforeAction: function(){
            Meteor.impact.redirectForAlt();
            this.next();
        },
        onAfterAction: function(e) {
            Meteor.search.searchLoad(e,{generalTerm:this.params.query.terms, primaryIndex:Session.get('journal').elasticsearch.primaryIndex});
            var title = Meteor.settings.public.journal.name + ' | Search';

            SEO.set({
                title: title
            });
        },
        waitOn: function(){
            return[
                Meteor.subscribe('journalConfig')
            ];
        },
        data: function() {
            if(this.ready()){
                return {
                    terms:this.params.query.terms,
                    indexes: Session.get('journal').elasticsearch.indexes,
                    primaryIndex: Session.get('journal').elasticsearch.primaryIndex
                };
            }
        }
    });

    Router.route('/search-alt', {
        name: 'SearchAlt',
        layoutTemplate: 'SearchAlt',
        onAfterAction: function(e) {
            Meteor.search.searchLoad(e,{generalTerm:this.params.query.terms, primaryIndex:Session.get('journal').elasticsearch.primaryIndex});

            var title = Meteor.settings.public.journal.name + ' | Search';

            SEO.set({
                title: title
            });
        },
        waitOn: function(){
            return[
                Meteor.subscribe('journalConfig')
            ];
        },
        data: function() {
            if(this.ready()){
                return {
                    terms:this.params.query.terms,
                    indexes: Session.get('journal').elasticsearch.indexes,
                    primaryIndex: Session.get('journal').elasticsearch.primaryIndex
                };
            }
        }
    });

    // INTERVIEWS PAGE
    Router.route('/interviews', {
        name: 'Interviews',
        layoutTemplate: 'Visitor',
        onBeforeAction: function(){
            Meteor.impact.redirectForAlt();
            this.next();
        },
        waitOn: function() {
            return [
                Meteor.subscribe('interviews'),
                Meteor.subscribe('currentIssue')
            ];
        },
        data: function() {
            return {
                interviews: newsList.find({display: true, interview: true},{sort: {'date':-1}}).fetch()
            };
        },
        onAfterAction: function() {
            if (!Meteor.isClient) {
                return;
            }
            var title = Meteor.settings.public.journal.name + ' | Interviews';

            SEO.set({
                title: title
            });
        }
    });
}

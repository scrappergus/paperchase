Meteor.organize = {
    arrDiff: function(a1,a2){
        // Find anything different b/w arrays
        var a=[], diff=[];
        for(var i=0 ; i < a1.length ; i++){
            a[a1[i]]=true;
        }
        for(var i=0 ; i<a2.length ; i++){
            if(a[a2[i]]) delete a[a2[i]];
            else a[a2[i]]=true;
        }
        for(var k in a){
            diff.push(k);

        }
        return diff;
    },
    groupArticles: function(articles) {
        var grouped = [];
        for(var i = 0 ; i < articles.length ; i++){
            var type = ''; //for articles without a type
            if(articles[i]['article_type']){
                type = articles[i]['article_type']['short_name'];
            }

            if(!grouped[type]){
                grouped[type] = [];
                articles[i]['start_group'] = true;
            }
            //grouped[type].push(articles[i]);
        }
        return articles;
    }
}

Meteor.article = {
    readyData: function(article){
        if(!article.volume && article.issue_id){
            // for display purposes
            var issueInfo = issues.findOne();
            article.volume = issueInfo.volume;
            article.issue = issueInfo.issue;
        }
        if(article.files){
            article.files = Meteor.article.linkFiles(article.files, article._id);
        }
        return article;
    },
    linkFiles:function(files,articleMongoId){
        for(var file in files){
            if(file != 'figures'){
                files[file].url =  journalConfig.findOne({}).assets + file + '/' + files[file].file;
            }else{
                for(var fig in files[file]){
                    files[file][fig].url =  journalConfig.findOne({}).assets + 'paper_figures/' + files[file][fig].file;
                }
            }
        }
        files.journal = journalConfig.findOne({}).journal.short_name;
        files._id = articleMongoId;
        return files;
    },
    pageTitle: function(articleId){
        var articleTitle = '',
            articleTitlePlain = '',
            article,
            tmp;
        article = articles.findOne({'_id': articleId});
        if(article){
            articleTitle = article.title
            tmp = document.createElement('DIV');
            tmp.innerHTML = articleTitle;
            articleTitlePlain = tmp.textContent || tmp.innerText || '';
        }
        return articleTitlePlain;
    },
    affiliationsNumbers: function(article){
        if(article['authors']){
            var authorsList = article['authors'];
            var affiliationsList = article['affiliations'];
            for(var i = 0 ; i < authorsList.length ; i++){
                if(article['authors'][i]['affiliations_numbers']){
                    article['authors'][i]['affiliations_numbers'] = [];
                    var authorAffiliations = article['authors'][i]['affiliations'];
                    for(var a = 0 ; a < authorAffiliations.length ; a++){
                        article['authors'][i]['affiliations_numbers'].push(parseInt(affiliationsList.indexOf(authorAffiliations[a]) + 1));
                    }
                }
            }
        }
        console.log(article);
        return article;
    },
    subscribeModal: function(e){
        e.preventDefault();
        $("#subscribe-modal").openModal();
        var mongoId = $(e.target).data('id');
        var articleData = articles.findOne({'_id':mongoId});
        Session.set('articleData',articleData);
    },
    downloadPdf: function(e){
        e.preventDefault();
        var mongoId = $(e.target).data('id');
        var articleData = articles.findOne({'_id':mongoId});
        var pmc = articleData.ids.pmc;
        window.open('/pdf/' + pmc + '.pdf');
    }
}

Meteor.formActions = {
    saving: function(message){
        Session.set('statusModalAction','Saving');
        Session.set('statusModalDetails',message);

        // inline messages
        $('.save-btn').addClass('hide');
        $('.saving').removeClass('hide');
        $('.success').addClass('hide');
        $('.error').addClass('hide');
        //sending and saving forms have shared class names

        // invalid notification
        $('fieldset').removeClass('invalid');


        //fixed saved button
        if($('#fixed-save-btn').length){
            $('#fixed-save-btn').find('.show-save').addClass('hide');
            $('#fixed-save-btn').find('.show-wait').removeClass('hide');
        }
        // saved button
        if($('#save-btn').length){
            $('#save-btn').find('.show-save').addClass('hide');
            $('#save-btn').find('.show-wait').removeClass('hide');
        }


        if($('#status-modal').length){
            $('#status-modal').openModal({
                complete: function() {
                    $('.lean-overlay').remove();
                }
            });
        }
        if($('#saving-modal').length){
            $('#saving-modal').openModal({
                dismissible: false
            });
        }


        //reset
        Session.set('errorMessages',null);
        $('input').removeClass('invalid');
        $('textarea').removeClass('invalid');
        $('input').removeClass('valid');
        $('textarea').removeClass('valid');
    },
    processing: function(message){
        Session.set('statusModalAction','Processing');
        Session.set('statusModalDetails',message);

        // inline messages
        $('.save-btn').addClass('hide');
        $('.saving').removeClass('hide');
        $('.success').addClass('hide');
        $('.error').addClass('hide');
        //sending and saving forms have shared class names

        // invalid notification
        $('fieldset').removeClass('invalid');


        //fixed saved button
        if($('#fixed-save-btn').length){
            $('#fixed-save-btn').find('.show-save').addClass('hide');
            $('#fixed-save-btn').find('.show-wait').removeClass('hide');
        }
        // saved button
        if($('#save-btn').length){
            $('#save-btn').find('.show-save').addClass('hide');
            $('#save-btn').find('.show-wait').removeClass('hide');
        }


        if($('#status-modal').length){
            $('#status-modal').openModal({
                complete: function() {
                    $('.lean-overlay').remove();
                }
            });
        }

        if($('#saving-modal').length){
            $('#saving-modal').openModal({
                dismissible: false
            });
        }


        //reset
        Session.set('errorMessages',null);
        $('input').removeClass('invalid');
        $('textarea').removeClass('invalid');
        $('input').removeClass('valid');
        $('textarea').removeClass('valid');
    },
    updating: function(message){
        Session.set('statusModalAction','Updated');
        Session.set('statusModalDetails',message);

        // inline messages
        $('.save-btn').addClass('hide');
        $('.saving').removeClass('hide');
        $('.success').addClass('hide');
        $('.error').addClass('hide');
        //sending and saving forms have shared class names

        // invalid notification
        $('fieldset').removeClass('invalid');


        //fixed saved button
        if($('#fixed-save-btn').length){
            $('#fixed-save-btn').find('.show-save').addClass('hide');
            $('#fixed-save-btn').find('.show-wait').removeClass('hide');
        }
        // saved button
        if($('#save-btn').length){
            $('#save-btn').find('.show-save').addClass('hide');
            $('#save-btn').find('.show-wait').removeClass('hide');
        }

        if($('#status-modal').length){
            $('#status-modal').openModal({
                complete: function() {
                    $('.lean-overlay').remove();
                }
            });
        }

        if($('#saving-modal').length){
            $('#saving-modal').openModal({
                dismissible: false
            });
        }

        //reset
        Session.set('errorMessages',null);
        $('input').removeClass('invalid');
        $('textarea').removeClass('invalid');
        $('input').removeClass('valid');
        $('textarea').removeClass('valid');
    },
    searching: function(message){
        Session.set('statusModalAction','Searching');
        Session.set('statusModalDetails',message);

        // inline messages
        $('.save-btn').addClass('hide');
        $('.saving').removeClass('hide');
        $('.success').addClass('hide');
        $('.error').addClass('hide');
        //sending and saving forms have shared class names

        // invalid notification
        $('fieldset').removeClass('invalid');


        //fixed saved button
        if($('#fixed-save-btn').length){
            $('#fixed-save-btn').find('.show-save').addClass('hide');
            $('#fixed-save-btn').find('.show-wait').removeClass('hide');
        }
        // saved button
        if($('#save-btn').length){
            $('#save-btn').find('.show-save').addClass('hide');
            $('#save-btn').find('.show-wait').removeClass('hide');
        }

        if($('#status-modal').length){
            $('#status-modal').openModal({
                complete: function() {
                    $('.lean-overlay').remove();
                }
            });
        }

        if($('#saving-modal').length){
            $('#saving-modal').openModal({
                dismissible: false
            });
        }

        //reset
        Session.set('errorMessages',null);
        $('input').removeClass('invalid');
        $('textarea').removeClass('invalid');
        $('input').removeClass('valid');
        $('textarea').removeClass('valid');
    },
    invalid: function(invalidData){
        var invalidString = '';
        for(var i=0 ; i < invalidData.length ; i++){
            $('#' + invalidData[i].fieldset_id).addClass('invalid');

            invalidString += invalidData[i].message + '    ';
            if(i === 0){
                var scrollToEl = 'body';
                if(invalidData[i].fieldset_id && $('#' + invalidData[i].fieldset_id).length > 0){
                    scrollToEl = '#' + invalidData[i].fieldset_id; // I believe this is deprecated, but lets leave it here for now and check for existence
                }else if(invalidData[i].input_id && $('#' + invalidData[i].input_id).length > 0){
                    scrollToEl = '#' + invalidData[i].input_id;
                }
                // console.log('scrollToEl = ', scrollToEl);
                $('html, body').animate({
                    scrollTop: $(scrollToEl).position().top
                }, 500);
            }
        }

        $('.save-btn').removeClass('hide');
        $('.saving').addClass('hide');
        $('.success').addClass('hide');
        $('.error').removeClass('hide');

        // fixed save button
        if($('#fixed-save-btn').length){
            $('#fixed-save-btn').find('.show-save').removeClass('hide');
            $('#fixed-save-btn').find('.show-wait').addClass('hide');
        }
        // save button
        if($('#save-btn').length){
            $('#save-btn').find('.show-save').removeClass('hide');
            $('#save-btn').find('.show-wait').addClass('hide');
        }

        Session.set('statusModalAction','Invalid');
        Session.set('statusModalDetails',invalidString);
    },
    invalidMessage: function(message, invalidList){
        Session.set('statusModalAction','<i class="material-icons">&#xE000;</i> Error');
        Session.set('statusModalDetails',message);

        $('.save-btn').removeClass('hide');
        $('.saving').addClass('hide');
        $('.success').addClass('hide');
        $('.error').removeClass('hide');

        // add message to template
        $('.error-message').html(message);

        // fixed saved button
        if($('#fixed-save-btn').length){
            $('#fixed-save-btn').find('.show-save').removeClass('hide');
            $('#fixed-save-btn').find('.show-wait').addClass('hide');
        }
        // saved button
        if($('#save-btn').length){
            $('#save-btn').find('.show-save').removeClass('hide');
            $('#save-btn').find('.show-wait').addClass('hide');
        }

        // add invalid to inputs
        invalidList.forEach(function(invalidObj){
            var className = '',
                keySplit;
            if(invalidObj.name.indexOf('.') != -1){
                // nested object is invalid
                keySplit = invalidObj.name.split('.');
                className = keySplit[1]; // 2nd item in array will be the nested key
            }else{
                className = invalidObj.name;
            }
            $('.form-' + className).addClass('invalid');
        });

        // modals
        if($('#saving-modal').length){
            $('#saving-modal').closeModal();
        }
        if($('#error-modal').length){
            $('#error-modal').openModal({
                dismissible: true
            });
        }
    },
    error: function(){
        $('.save-btn').removeClass('hide');
        $('.saving').addClass('hide');
        $('.success').addClass('hide');
        $('.error').removeClass('hide');

        // fixed saved button
        if($('#fixed-save-btn').length){
            $('#fixed-save-btn').find('.show-save').removeClass('hide');
            $('#fixed-save-btn').find('.show-wait').addClass('hide');
        }
        // saved button
        if($('#save-btn').length){
            $('#save-btn').find('.show-save').removeClass('hide');
            $('#save-btn').find('.show-wait').addClass('hide');
        }
    },
    errorMessage: function(message){
        Session.set('statusModalAction','<i class="material-icons">&#xE000;</i> Error');
        Session.set('statusModalDetails',message);

        $('.save-btn').removeClass('hide');
        $('.saving').addClass('hide');
        $('.success').addClass('hide');
        $('.error').removeClass('hide');

        // add message to template
        $('.error-message').html(message);

        // fixed saved button
        if($('#fixed-save-btn').length){
            $('#fixed-save-btn').find('.show-save').removeClass('hide');
            $('#fixed-save-btn').find('.show-wait').addClass('hide');
        }
        // saved button
        if($('#save-btn').length){
            $('#save-btn').find('.show-save').removeClass('hide');
            $('#save-btn').find('.show-wait').addClass('hide');
        }

        // modals
        if($('#saving-modal').length){
            $('#saving-modal').closeModal();
        }
        if($('#error-modal').length){
            $('#error-modal').openModal({
                dismissible: true
            });
        }
    },
    success: function(){
        // inline messages
        $('.save-btn').removeClass('hide');
        $('.saving').addClass('hide');
        $('.success').removeClass('hide');
        $('.error').addClass('hide');


        // fixed saved button
        if($('#fixed-save-btn').length){
            $('#fixed-save-btn').find('.show-save').removeClass('hide');
            $('#fixed-save-btn').find('.show-wait').addClass('hide');
        }
        // saved button
        if($('#save-btn').length){
            $('#save-btn').find('.show-save').removeClass('hide');
            $('#save-btn').find('.show-wait').addClass('hide');
        }

        // modals
        if($('#success-modal').length){
            $('#success-modal').openModal({
                dismissible: true
            });
        }
        if($('#saving-modal').length){
            $('#saving-modal').closeModal();
        }
    },
    resultMessage: function(message){
        Session.set('statusModalAction','Result');
        Session.set('statusModalDetails',message);
        // inline messages
        $('.save-btn').removeClass('hide');
        $('.saving').addClass('hide');
        $('.success').removeClass('hide');
        $('.error').addClass('hide');

        $('.success-message').text(message);

        // fixed saved button
        if($('#fixed-save-btn').length){
            $('#fixed-save-btn').find('.show-save').removeClass('hide');
            $('#fixed-save-btn').find('.show-wait').addClass('hide');
        }
        // saved button
        if($('#save-btn').length){
            $('#save-btn').find('.show-save').removeClass('hide');
            $('#save-btn').find('.show-wait').addClass('hide');
        }

        // modals
        if($('#status-modal').length){
            $('#status-modal').openModal({
                complete: function() {
                    $('.lean-overlay').remove();
                }
            });
        }
        if($('#saving-modal').length){
            $('#saving-modal').closeModal({
                complete: function(){
                    if($('#success-modal').length){
                        $('#success-modal').openModal({
                            ready: function(){
                            }
                        });
                    }
                }
            });
        }else if($('#success-modal').length){
            $('#success-modal').openModal();
        }
    },
    successMessage: function(message){
        Session.set('statusModalAction','<i class="material-icons">&#xE86C;</i> Saved');
        Session.set('statusModalDetails',message);
        // inline messages
        $('.save-btn').removeClass('hide');
        $('.saving').addClass('hide');
        $('.success').removeClass('hide');
        $('.error').addClass('hide');

        $('.success-message').text(message);

        // fixed saved button
        if($('#fixed-save-btn').length){
            $('#fixed-save-btn').find('.show-save').removeClass('hide');
            $('#fixed-save-btn').find('.show-wait').addClass('hide');
        }
        // saved button
        if($('#save-btn').length){
            $('#save-btn').find('.show-save').removeClass('hide');
            $('#save-btn').find('.show-wait').addClass('hide');
        }

        // modals
        if($('#status-modal').length){
            $('#status-modal').openModal({
                complete: function() {
                    $('.lean-overlay').remove();
                }
            });
        }
        if($('#saving-modal').length){
            $('#saving-modal').closeModal({
                complete: function(){
                    if($('#success-modal').length){
                        $('#success-modal').openModal({
                            ready: function(){
                            }
                        });
                    }
                }
            });
        }else if($('#success-modal').length){
            $('#success-modal').openModal();
        }
    },
    updatedMessage: function(message){
        Session.set('statusModalAction','<i class="material-icons">&#xE86C;</i> Updated');
        Session.set('statusModalDetails',message);
        // inline messages
        $('.save-btn').removeClass('hide');
        $('.saving').addClass('hide');
        $('.success').removeClass('hide');
        $('.error').addClass('hide');

        $('.success-message').text(message);

        // fixed saved button
        if($('#fixed-save-btn').length){
            $('#fixed-save-btn').find('.show-save').removeClass('hide');
            $('#fixed-save-btn').find('.show-wait').addClass('hide');
        }
        // saved button
        if($('#save-btn').length){
            $('#save-btn').find('.show-save').removeClass('hide');
            $('#save-btn').find('.show-wait').addClass('hide');
        }

        // modals
        if($('#status-modal').length){
            $('#status-modal').openModal({
                complete: function() {
                    $('.lean-overlay').remove();
                }
            });
        }
        if($('#saving-modal').length){
            $('#saving-modal').closeModal({
                complete: function(){
                    if($('#success-modal').length){
                        $('#success-modal').openModal({
                            ready: function(){
                            }
                        });
                    }
                }
            });
        }else if($('#success-modal').length){
            $('#success-modal').openModal();
        }
    },
    removePastedStyle: function(e){
        e.preventDefault();
        // console.log('..removePastedStyle');
        // for Wysiwyg
        //remove styling. paste as plain text. avoid problems when pasting from word or with font sizes.
        var bufferText = ((e.originalEvent || e).clipboardData || window.clipboardData).getData('Text');
        document.execCommand('insertText', false, bufferText);
    },
    closeModal: function(){
        $('.save-btn').removeClass('hide');
        $('.saving').addClass('hide');
        $('.success').removeClass('hide');
        $('.error').addClass('hide');
        if($('#status-modal').length){
            $('#status-modal').closeModal({
                complete: function() {
                    $('.lean-overlay').remove();
                }
            });
        }
    }
}

Meteor.ip = {
    dot2num: function(dot){
        var d = dot.split('.');
        return ((((((+d[0])*256)+(+d[1]))*256)+(+d[2]))*256)+(+d[3]);
    },
    num2dot: function(num) {
        var d = num%256;
        for (var i = 3; i > 0; i--) {
            num = Math.floor(num/256);
            d = num%256 + '.' + d;
        }
        return d;
    }
}

Meteor.clean = {
    cleanString: function(string){
        if(string){
            string = string.replace(/<italic>/g,'<i>').replace(/<\/italic>/g,'</i>');
            string = string.replace(/(\r\n|\n|\r)/gm,''); // line breaks
            if(string.charAt(string.length - 1) === '.'){
                string = string.substring(0, string.length-1);
            }
            string = string.trim();
        }
        return string;
    },
    cleanWysiwyg: function(input){
        return input.replace(/&nbsp;/g,' ').replace(/<br>/g,'').replace(/<p[^>]*>/g,'').replace(/<\/p[^>]*>/g,'').trim();
    },
    removeSpaces: function(string){
        return string.replace(/\s+/g,'');
    }
}

Meteor.general = {
    navHeight: function(){
        return $('nav').height();
    },
    footerHeight: function(){
        return $('footer').height();
    },
    scrollAnchor: function(e){
        e.preventDefault();
        var anchor = $(e.target).closest('a').attr('href');
        if(anchor){
            anchor = anchor.replace('#','');
            Meteor.general.scrollTo(anchor);
        }
    },
    scrollTo: function(anchorId){
        var navTop = Meteor.general.navHeight();
        $('html, body').animate({
            scrollTop: $('#' + anchorId).position().top - navTop
        }, 500);
    },
    isStringEmpty: function(string){
        // console.log('isStringEmpty',string);
        string = string.replace(/\r?\n|\r(^\s+|\s+$)+/g,'').replace(/\s/g, '');
        if(string === ''){
            return true;
        }else{
            return false;
        }
    }
}

Meteor.sorter = {
    sort: function(unordered,order){
        // console.log('..SORT');
        // console.log(order);
        // for when we have the array of Mongo IDs and array of items to sort
        var ordered = [];
        for(var i = 0 ; i < order.length ; i++){
          // console.log(order[i]);
          for(var a = 0 ; a < unordered.length ; a++){
            if(unordered[a]['_id'] == order[i]){
              ordered.push(unordered[a]);
            }
          }
        }
        // console.log(ordered);
        return ordered;
    }
}

Meteor.dates = {
    article: function(date){
        // console.log('Article Date:', typeof date, date);
        var date = new Date(date);
        // console.log(date);
        // console.log(moment(utcDate,'ddd, DD MMM YYYY HH:mm:ss ZZ'));
        return moment(date).utc().format('MMMM D, YYYY');
    },
    articleCsv: function(date){
        var date = new Date(date);
        return moment(date).utc().format('MM-D-YYYY'); // cannot use commas for csv date. they will be considered as new columns.
    },
    inputForm: function(date){
      return moment(date).utc().format('YYYY/MM/DD');
    },
    wordDate: function(date){
        return moment(date).tz('America/New_York').format('MMMM D, YYYY');
    },
    dashedToWord: function(date){
        date = Meteor.dates.dashedToDate(date);
        return moment(date).tz('America/New_York').format('MMMM D, YYYY');
    },
    dashedToDate: function(date){
        var datePieces = date.split('-');
        for(var piece=0 ; piece < datePieces.length ; piece++){
            if(datePieces[piece].length == 1){
                datePieces[piece] = '0' + datePieces[piece];
            }
        }
        dateFixed = datePieces.join('-');
        var d = new Date(dateFixed + 'T06:00:00.000Z');
        return d;
    },
    initiateDatesInput: function(){
        $('.datepicker').each(function(i){
            var datePlaceholderFormat = 'mmmm d, yyyy';
            var placeholder = $(this).attr('placeholder');
            var pick = $(this).pickadate({
                format: datePlaceholderFormat
            });
            var picker = pick.pickadate('picker');
            picker.set('select', $(this).data('value'), { format: 'yyyy/mm/dd' });
        });
    },
    zeroBasedMonth: function(month){
        return parseInt(month - 1);
    }
}

Meteor.issue = {
    urlPieces: function(vi){
        var pieces = vi.match('v([0-9]+)i(.*)');
        if(pieces){
            var res = {volume : pieces[1], issue : pieces[2]};
            return res;
        }
        return;
    },
    coverPath : function(assetUrl,fileName){
        return assetUrl + 'covers/' + fileName;
    },
    linkeableIssue: function(issue){
        return issue.replace(/\//g,'_');
    },
    createIssueParam: function(volume,issue){
        return 'v' + volume + 'i' + issue;
    }
}

Meteor.advance = {
    articlesBySection: function(articlesList){
        var articlesBySection = {};
        articlesList.forEach(function(article){
            if(!articlesBySection[article.section_name]){
                articlesBySection[article.section_name] = [];
            }
            articlesBySection[article.section_name].push(article);
        });
        return articlesBySection;
    },
    dataForSectionsPage: function(){
        var sorted  = sorters.findOne({name:'advance'});
        var res = [];
        var advanceSections = Meteor.advance.articlesBySection(sorted.articles);
        for(var section in advanceSections){
            res.push({section: section, articles_count: advanceSections[section].length, articles: advanceSections[section]});
        }
        return res;
    },
    orderViaAdmin: function(){
        var order = [];
        $('.article').each(function(){
            order.push($(this).attr('data-article-id'));
        });
        return order;
    },
    getSectionsOrderViaAdmin: function(){
        var sectionsOrder = [];
        $('.advance-section').each(function(){
            sectionsOrder.push($(this).attr('data-name'));
        });
        return sectionsOrder;
    }
}
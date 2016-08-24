Meteor.admin = {
    titleInTable: function(title){
        var result = '';
        if(title){
            var txt = document.createElement('textarea');
            txt.innerHTML = title.substring(0,40);
            if(title.length > 40){
                txt.innerHTML += '...';

            }
            result = txt.value;
        }

        return result;
    },
    clone: function(obj) {
        //http://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object
        if (null === obj || 'object' != typeof obj) return obj;
        var copy = obj.constructor();
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) copy[key] = obj[key];
        }
        return copy;
    }
};


Meteor.adminAdvance = {
    formGetData: function(e){
        e.preventDefault();
        var articleIdList = [];
        $('.advance-order li').each(function(i, article){
            articleIdList.push($(article).data('id'));
        });
        Meteor.call('updateList', 'advance', articleIdList, function(error, result){
            if(error){
                console.error('updateList', error);
                Meteor.formActions.errorMessage('Could not update advance order');
            }
            else if(result){
                Meteor.formActions.successMessage('Advance Order Updated');
            }
        });
    }
};

Meteor.adminSite = {
    formGetData: function(e){
        // console.log('..adminSite formGetData');
        e.preventDefault();
        var success,
            updateObj = {};
        updateObj.side_nav = [];
        updateObj.section_side_nav = [];
        Meteor.formActions.saving();
        $('input').removeClass('invalid');

        // Main Side Navigation
        // ----------------------
        var sideNavList = []; // Rebuild entire array and objects before inserting into db. because we are using the order of objects to set the order of links when displaying.
        $('.side-nav-option').each(function(){
            var sideNavOption = {};
            // console.log($(this).attr('id'));
            var routeOptionName = $(this).attr('id').replace('-checkbox','');
            // console.log(routeOptionName);
            sideNavOption.route_name = routeOptionName;
            // console.log($('#' + routeOptionName + '-label'));
            sideNavOption.name = $('#' + routeOptionName + '-label')[0].innerText;
            if($(this).is(':checked')){
                sideNavOption.display = true;
            }
            else{
                sideNavOption.display = false;
            }
            updateObj.side_nav.push(sideNavOption);
        });

        // Section Side Navigation
        // ----------------------
        var sectionSideNavList = []; // Rebuild entire array and objects before inserting into db. because we are using the order of objects to set the order of links when displaying.
        $('.section-nav-option').each(function(){
            var sectionSideNavOption = {};
            // console.log($(this).attr('id'));
            sectionSideNavOption._id = $(this).attr('id');
            if($(this).is(':checked')){
                sectionSideNavOption.display = true;
            }
            else{
                sectionSideNavOption.display = false;
            }
            updateObj.section_side_nav.push(sectionSideNavOption);
        });

        // console.log(updateObj);
        Meteor.call('siteControlUpdate',updateObj,function(error,result){
            if(error){
                console.log('ERROR - siteControlUpdate');
                console.log(error);
                Meteor.formActions.error();
            }
            if(result){
                Meteor.formActions.success();
            }
        });
        // success = journalConfig.update({_id : Session.get('journal')._id} , {$set: {site : updateObj}});
        // // console.log(success);
        // if(success){
        //  Meteor.formActions.success();
        // }
    },
};

Meteor.adminNews = {
    readyForm: function(){
        // Date
        // ------
        var pick = $('#news-date').pickadate();
        var picker = pick.pickadate('picker');
        picker.set('select', $('#news-date').data('value'), { format: 'yyyy/mm/dd' });

        // Conference
        // ------
        var pickConferenceStart= $('#conference-date-start').pickadate();
        var pickerConferenceStart= pickConferenceStart.pickadate('picker');
        pickerConferenceStart.set('select', $('#conference-date-start').data('value'), { format: 'yyyy/mm/dd' });

        var pickConferenceEnd = $('#conference-date-end').pickadate();
        var pickerConferenceEnd = pickConferenceEnd.pickadate('picker');
        pickerConferenceEnd.set('select', $('#conference-date-end').data('value'), { format: 'yyyy/mm/dd' });

        // Content
        // ------
        $('.news-content').materialnote({
            onPaste: function(e){
                Meteor.formActions.removePastedStyle(e);
            },
            toolbar: [
                ['style', ['style', 'bold', 'italic', 'underline', 'strikethrough', 'clear']],
                ['undo', ['undo', 'redo', 'help']],
                ['misc', ['codeview','link']]
            ]
        });

        // New Tag
        // --------
        $('.news-tag-input').materialnote({
            onPaste: function(e){
                Meteor.formActions.removePastedStyle(e);
            },
            toolbar: [
                ['style', ['italic','superscript','subscript']],
                ['undo', ['undo', 'redo', 'help']]
            ]
        });
    },
    formGetData: function(e){
        // console.log('..news formGetData');
        e.preventDefault();
        var invalidData = [];
        var newsObj = {},
            newsMongoId,
            success;

        newsObj.title = null;
        newsObj.content = null;
        newsObj.date = null;
        newsObj.date_display = null;
        newsObj.conference = null;
        newsObj.conference_date_start = null;
        newsObj.conference_date_end = null;
        newsObj.youTube = null;
        newsObj.tags = null;
        newsObj.interview = null;
        newsObj.display = null;

        Meteor.formActions.saving();
        $('input').removeClass('invalid');

        newsMongoId = $('#news-mongo-id').val();

        // Title
        // ------
        newsObj.title = $('#news-title').val();

        // Content
        // ------
        var newsContent = $('.news-content').code();
        newsContent = Meteor.clean.cleanWysiwyg(newsContent);
        if(newsContent !== ''){
            newsObj.content = newsContent;
        }

        // Date
        // ------
        newsObj.date_display = $('#news-date-display').is(':checked');
        var newsDate = $('#news-date').val();
        if(newsDate){
            newsDate = new Date(newsDate);
            newsObj.date = newsDate;
        }

        // Conference Date
        // ------
        newsObj.conference = $('#news-conference').is(':checked');
        var conferenceDateStart = $('#conference-date-start').val();
        if(conferenceDateStart){
            conferenceDateStart = new Date(conferenceDateStart);
            newsObj.conference_date_start = conferenceDateStart;
        }
        var conferenceDateEnd = $('#conference-date-end').val();
        if(conferenceDateEnd){
            conferenceDateEnd = new Date(conferenceDateEnd);
            newsObj.conference_date_end = conferenceDateEnd;
        }

        // YouTube
        // ------
        var youTube = $('#news-youtube').val();
        if(youTube.indexOf('http') != -1){
            invalidData.push({
                'input_id' : 'news-youtube',
                'message' : 'YouTube ID cannot include http. Please only include the ID, for ex: eEp7km4t4Qk'
            });
        }
        else{
            newsObj.youTube = youTube;
        }

        // Tags
        // ------
        newsObj.tags = [];
        $('.news-tag-text').each(function(){
            // console.log($(this).html());
            newsObj.tags.push($(this).html());
        });

        // Interview
        // ------
        newsObj.interview = $('#news-interview').is(':checked');

        if(newsObj.interview && newsObj.conference){
            invalidData.push({
                'input_id' : 'news-interview',
                'message' : 'News cannot be both an interview and a conference.'
            });
        }

        // Display
        // ------
        newsObj.display = $('#news-display').is(':checked');

        // console.log(newsObj);

        // Update/Insert/Invalid
        // ------
        if(invalidData.length > 0){
            Meteor.formActions.invalid(invalidData);
        }
        else{
            Meteor.adminNews.save(newsMongoId, newsObj);
        }
    },
    save: function(newsMongoId, newsObj){
        Meteor.call('realYouTubeVideo', newsObj.youTube, function(error,result){
            if(error){
                // console.error('YouTube ID check',error);
                Meteor.formActions.errorMessage('Could not save news.<br>The YouTube ID does not produce a video. Please verify that the ID is correct.');
            }
            else{
                if(!newsMongoId){
                    Meteor.call('addNews',newsObj,function(error,result){
                        if(error){
                            Meteor.formActions.errorMessage('Could not add news', error);
                        }
                        else if(result){
                            // console.log('result',result);
                            $('.lean-overlay').remove();
                            Router.go('AdminNewsOverview', {_id : result});
                            // Meteor.formActions.successMessage('News Added');
                        }
                    });
                }
                else{
                    Meteor.call('updateNews',newsMongoId, newsObj,function(error,result){
                        if(error){
                            Meteor.formActions.errorMessage('Could not update news', error);
                        }
                        else if(result){
                            $('.lean-overlay').remove();
                            Router.go('AdminNewsOverview', {_id : newsMongoId});
                        }
                    });
                }
            }
        });
    },
    showAddNewTag: function(e){
        e.preventDefault();
        $('#row-tag-btn').addClass('hide');
        $('#row-tag-input').removeClass('hide');
    },
    hideAddNewTag: function(e){
        e.preventDefault();
        $('#row-tag-btn').removeClass('hide');
        $('#row-tag-input').addClass('hide');
    }
};

Meteor.adminEdBoard = {
    formPrepareData: function(mongoId){
        var member = {},
            journalInfo,
            edboardRoles;
        if(mongoId){
            member = edboard.findOne({_id : mongoId});
        }
        journalInfo = journalConfig.findOne();
        if(journalInfo){
            edboardRoles = journalInfo.edboard_roles;
            if(edboardRoles){
                var edboardRolesTemp = [];
                for(var r=0 ; r<edboardRoles.length ; r++){
                    var roleObj = {
                        name: edboardRoles[r]
                    };
                    if(member.role && $.inArray(roleObj.name, member.role) > -1){
                        roleObj.selected = true;
                    }
                    edboardRolesTemp.push(roleObj);
                }
                member.roles = edboardRolesTemp.reverse(); // Reversed so that lowest ranked role is listed first in the select option in template
                // console.log(member);
                return member;
            }
        }

        return;
    },
    formGetData: function(e){
        // console.log('..edboard formGetData');
        e.preventDefault();

        var member = {};
        var memberMongoId,
            memberAddress,
            memberBio;

        var formErrors = [],
            formErrorsCount = 0,
            formErrorsMessage = '';

        Meteor.formActions.saving();
        $('input').removeClass('invalid');

        // Name
        // ------
        member.name_first = $('#member-name-first').val();
        member.name_middle = $('#member-name-middle').val();
        member.name_last = $('#member-name-last').val();

        // Address
        // ------
        memberAddress = $('.member-address').code();
        if(memberAddress){
            memberAddress = Meteor.clean.cleanWysiwyg(memberAddress);
            if(memberAddress !== ''){
                member.address = memberAddress;
            }
        }

        // Bio
        // ------
        memberBio = $('.member-bio').code();
        if(memberBio){
            memberBio = Meteor.clean.cleanWysiwyg(memberBio);
            if(memberBio !== ''){
                member.bio = memberBio;
            }
        }

        // Role
        // ------
        member.role = [];
        $('.roles').each(function(){
            if($(this).is(':checked')){
                member.role.push($(this).val());
            }
        });

        // console.log(member);
        memberMongoId = $('#member-mongo-id').val();

        member = Meteor.generalClean.pruneEmpty(member);

        Meteor.call('updateEdboardMember', memberMongoId, member, function(error,result){
            if(error){
                console.error('updateEdboardMember',error);
            }
            if(error && error.error == 'validation-error'){
                error.details.forEach(function(errorDetail){
                    formErrorsCount++;
                    if(errorDetail.name){
                        formErrors.push(' ' + errorDetail.name + ': <i>' + errorDetail.type + '</i>');
                    }
                    if(formErrorsCount > 1){
                        // if just 1 error, it will be in error.reason. Otherwise, list all the keys here for invalid
                        formErrorsMessage = '<br><br>' + formErrorsCount + ' total errors:<br>' + formErrors.toString();
                    }
                });
                Meteor.formActions.invalidMessage(error.reason + formErrorsMessage, error.details);
            }
            else if(error){
                console.error('updateEdboardMember',error);
                Meteor.formActions.errorMessage('Could not update editorial board.');
            }
            else if(result && typeof result != 'boolean'){
                Router.go('AdminEditorialBoardEdit', {_id : result}); // new member added
            }
            else if(result && typeof result === 'boolean'){
                Meteor.formActions.successMessage('Editorial Board Updated');
            }
        });
    },
    readyForm: function(){
        // Address
        // ------
        $('.member-address').materialnote({
            onPaste: function(e){
                Meteor.formActions.removePastedStyle(e);
            },
            toolbar: [
                ['style', ['style', 'bold', 'italic', 'underline', 'strikethrough', 'clear']],
                ['undo', ['undo', 'redo', 'help']],
                ['misc', ['codeview']]
            ]
        });

        // Bio
        // ------
        $('.member-bio').materialnote({
            onPaste: function(e){
                Meteor.formActions.removePastedStyle(e);
            },
            toolbar: [
                ['style', ['style', 'bold', 'italic', 'underline', 'strikethrough', 'clear']],
                ['undo', ['undo', 'redo', 'help']],
                ['misc', ['codeview']]
            ]
        });
    }
};

Meteor.adminIssue = {
    readyIssueForm: function(){
        Meteor.dates.initiateDatesInput();
        // caption
        // ------
        $('.issue-caption').materialnote({
            onPaste: function(e){
                Meteor.formActions.removePastedStyle(e);
            },
            toolbar: [
                ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
                ['undo', ['undo', 'redo', 'help']],
                ['misc', ['codeview', 'link']]
            ]
        });
    }
};


Meteor.adminEthics = {
    readyForm: function(){
        // Section title
        // ---------------
        $('.section-title').materialnote({
            onPaste: function(e){
                Meteor.formActions.removePastedStyle(e);
            },
            toolbar: [
                ['style', ['style', 'bold', 'italic', 'underline', 'strikethrough', 'clear']],
                ['undo', ['undo', 'redo', 'help']],
                ['misc', ['codeview']]
            ]
        });
        // Section content
        // ---------------
        $('.section-content').materialnote({
            onPaste: function(e){
                Meteor.formActions.removePastedStyle(e);
            },
            toolbar: [
                ['style', ['style', 'bold', 'italic', 'underline', 'strikethrough', 'clear']],
                ['undo', ['undo', 'redo', 'help']],
                ['misc', ['codeview','link']],
                ['para', ['ul', 'ol', 'paragraph', 'leftButton', 'centerButton', 'rightButton', 'justifyButton', 'outdentButton', 'indentButton']]
            ]
        });
    },
    formGetData: function(e){
        // console.log('..formGetData Ethis');
        e.preventDefault();

        var forDb = Meteor.adminShared.formGetData();

        // Check if section exists via Mongo ID hidden input
        mongoId = $('#section-mongo-id').val();
        if(!mongoId){
            // Insert
            success = ethics.insert(forDb);
            // Update sorters collection
            Meteor.call('sorterAddItem','ethics',success);
        }
        else{
            // Update
            success = ethics.update({_id : mongoId} , {$set: forDb});
        }
        if(success){
            // Meteor.formActions.success(); // Do not show modal. Problem when changing session variable to hide template, doesn't remove modal overlay
            Session.set('showForm',false);
            Session.set('sectionId',null);
        }
    }
};

Meteor.adminHomePage = {
    readyForm: function(){
        // Section title
        // ---------------
        $('.section-title').materialnote({
            onPaste: function(e){
                Meteor.formActions.removePastedStyle(e);
            },
            toolbar: [
                ['style', ['style', 'bold', 'italic', 'underline', 'strikethrough', 'clear']],
                ['undo', ['undo', 'redo', 'help']],
                ['misc', ['codeview']]
            ]
        });
        // Section content
        // ---------------
        $('.section-content').materialnote({
            onPaste: function(e){
                Meteor.formActions.removePastedStyle(e);
            },
            toolbar: [
                ['style', ['style', 'bold', 'italic', 'underline', 'strikethrough', 'clear']],
                ['undo', ['undo', 'redo', 'help']],
                ['misc', ['codeview','link']],
                ['para', ['ul', 'ol', 'paragraph', 'leftButton', 'centerButton', 'rightButton', 'justifyButton', 'outdentButton', 'indentButton']]
            ]
        });
    },
    formGetData: function(e){
        // console.log('..formGetData Ethis');
        e.preventDefault();

        var forDb = Meteor.adminShared.formGetData();

        // Check if section exists via Mongo ID hidden input
        mongoId = $('#section-mongo-id').val();
        if(!mongoId){
            // Insert
            success = homePage.insert(forDb);
            // Update sorters collection
            Meteor.call('sorterAddItem','homePage',success);
        }
        else{
            // Update
            success = homePage.update({_id : mongoId} , {$set: forDb});
        }
        if(success){
            // Meteor.formActions.success(); // Do not show modal. Problem when changing session variable to hide template, doesn't remove modal overlay
            Session.set('showForm',false);
            Session.set('sectionId',null);
        }
    }
};

Meteor.adminForAuthors = {
    readyForm: function(){
        // Section title
        // ---------------
        $('.section-title').materialnote({
            onPaste: function(e){
                Meteor.formActions.removePastedStyle(e);
            },
            toolbar: [
                ['style', ['style', 'bold', 'italic', 'underline', 'strikethrough', 'clear']],
                ['undo', ['undo', 'redo', 'help']],
                ['misc', ['codeview']]
            ]
        });
        // Section content
        // ---------------
        $('.section-content').materialnote({
            onPaste: function(e){
                Meteor.formActions.removePastedStyle(e);
            },
            toolbar: [
                ['style', ['style', 'bold', 'italic', 'underline', 'strikethrough', 'clear']],
                ['undo', ['undo', 'redo', 'help']],
                ['misc', ['codeview','link']],
                ['para', ['ul', 'ol', 'paragraph', 'leftButton', 'centerButton', 'rightButton', 'justifyButton', 'outdentButton', 'indentButton']]
            ]
        });
    },
    formGetData: function(e){
        // console.log('..formGetData forAuthors');
        e.preventDefault();

        var forDb = Meteor.adminShared.formGetData();

        // Check if section exists via Mongo ID hidden input
        mongoId = $('#section-mongo-id').val();
        if(!mongoId){
            // Insert
            success = forAuthors.insert(forDb);
            // Update sorters collection
            Meteor.call('sorterAddItem','forAuthors',success);
        }
        else{
            // Update
            success = forAuthors.update({_id : mongoId} , {$set: forDb});
        }
        if(success){
            // Meteor.formActions.success(); // Do not show modal. Problem when changing session variable to hide template, doesn't remove modal overlay
            Session.set('showForm',false);
            Session.set('sectionId',null);
        }
    }
};


Meteor.adminSections = {
    formGetData: function(e){
        // console.log('..formGetData adminSection');
        e.preventDefault();
        var forDb = {};
        var invalidData = [];
        forDb.name = $('#section-name').val();
        forDb.display = $('#section-display').is(':checked');

        if(!forDb.name){
            invalidData.push({
                'input_class' : 'section-name',
                'message' : 'Section Name Is Empty'
            });
            Meteor.formActions.invalid(invalidData);
        }
        else{
            forDb.short_name = forDb.name.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
                if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
                return index === 0 ? match.toLowerCase() : match.toUpperCase();
            }); // based on http://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case

            forDb.dash_name = forDb.name.toLowerCase().replace(/\s/g,'-').replace(':','');

            // Check if section exists via Mongo ID hidden input
            mongoId = $('#section-mongo-id').val();
            if(!mongoId){
                // Insert
                success = sections.insert(forDb);
            }
            else{
                // Update
                success = sections.update({_id : mongoId} , {$set: forDb});
            }
            if(success){
                Meteor.formActions.success();
            }
        }
    }
};

Meteor.adminUser = {
    getFormCheckBoxes: function(){
        var roles = {};
        $('.role-checkbox').each(function(){
            if(!roles[$(this).attr('data-role-type')]){
                roles[$(this).attr('data-role-type')] = [];
            }
            if($(this).is(':checked')){
                roles[$(this).attr('data-role-type')].push($(this).attr('data-role'));
            }
        });
        return roles;
    },
    getFormData: function(){
        var user = {};

        // Email
        user.email = $('#email').val();

        // Roles
        user.roles =  Meteor.adminUser.getFormCheckBoxes();

        // Name
        user.name = {};
        user.name.first = Meteor.clean.cleanString($('#name_first').val());
        user.name.middle = Meteor.clean.cleanString($('#name_middle').val());
        user.name.last = Meteor.clean.cleanString($('#name_last').val());
        for(var name_part in user.name){
            if(user.name[name_part] === ''){
                delete user.name[name_part];
            }
        }

        // Update or Insert
        if(Session.get('admin-user')._id){
            user._id = Session.get('admin-user')._id;
        }

        return user;
    }
};

Meteor.dataSubmissions = {
    getPiiList: function(){
        var piiList = [];
        $('.data-submission-pii').each(function(){
            var pii = $(this).attr('data-pii');
            piiList.push(pii);
        });
        return piiList;
    },
    getArticles: function(queryType,queryParams){
        // console.log('... getArticles = ' + queryType + ' / ' + queryParams);
        Meteor.dataSubmissions.processing();
        Meteor.subscribe('submissionSet', queryType, queryParams);
    },
    processing: function(){
        $('.saving').removeClass('hide');
    },
    doneProcessing: function(){
        $('.saving').addClass('hide');
    },
    errorProcessing: function(){
        Session.set('error',true);
        $('.saving').addClass('hide');
    },
    validateXmlSet: function(){
        $('.saving').removeClass('hide');
        var submissionList = articles.find().fetch();
        // console.log(submissionList);
        Meteor.call('articleSetCiteXmlValidation', submissionList, Meteor.userId(), function(error,result){
            $('.saving').addClass('hide');
            if(error){
                console.error('ERROR - articleSetXmlValidation',error);
            }
            else if(result === 'invalid'){
                alert('XML set invalid');
            }
            else{
                //all the articles are valid, now do the download
                window.open('/xml-cite-set/' + result);
            }
        });
    }
};

Meteor.validate = {
    email: function(email){
        //http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
        if(email){
            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        }
        else{
            return;
        }
    }
};

Meteor.generalClean = {
    pruneEmpty: function(obj) {
        for(var key in obj){
            if(!obj[key] || obj[key]  === ''){
                // console.log('DELETE ',obj[key]);
                delete obj[key];
            }
            else if(typeof obj[key] == 'object' && !Array.isArray(obj[key])){
                if(Object.keys(obj[key]).length === 0 && typeof obj[key].getMonth != 'function'){
                    // console.log('DELETE ',obj[key]);
                    delete obj[key];
                }
                else{
                    obj[key] = Meteor.generalClean.pruneEmpty(obj[key]);
                }
            }
            else if(typeof obj[key] == 'object' && Array.isArray(obj[key])){
                var newArray = [];
                for(var i=0 ; i < obj[key].length ; i++){
                    if(typeof obj[key][i] === 'string' && obj[key][i] !== '' || typeof obj[key][i] === 'number' ){
                        newArray.push(obj[key][i]);
                    }
                    else if(typeof obj[key][i] === 'object'){
                        newArray.push(Meteor.generalClean.pruneEmpty(obj[key][i]));
                    }
                }

                if(newArray.length > 0){
                    obj[key] = newArray;
                }
                else{
                    delete obj[key];
                }


            }
        }
        return obj;
    }
};

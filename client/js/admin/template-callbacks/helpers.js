if (Meteor.isClient) {
    // General
    // -------
    Template.registerHelper('adminNotFound', function(bool) {
      return Session.get('admin-not-found');
    });

    // Forms
    // -------
    Template.registerHelper('checked', function(bool) {
      if (bool) {
        return 'checked';
      }
    });
    // Article
    // -------
    Template.registerHelper('articleId', function() {
      return Session.get('articleId');
    });
    Template.registerHelper('affiliationNumber', function(affiliation) {
      return parseInt(parseInt(affiliation) + 1);
    });

    Template.registerHelper('authorNoteNumber', function(affiliation) { //This function is exactly the same as the one above it. Probably unnecessary
        return parseInt(parseInt(affiliation) + 1);
    });

    Template.registerHelper('prettyDoi', function(doi) {
      return doi.replace('http://dx.doi.org/', '');
    });
    Template.registerHelper('showFilesButton', function(xml, pdf) {
      if (xml || pdf) {
        return true;
      } else {
        return false;
      }
    });
    // Dates
    // -----
    Template.registerHelper('placeholderDate', function(date) {
      return moment(date).format('M D, YYYY');
    });
    Template.registerHelper('inputDate', function(date) {
        if (date) {
            return Meteor.dates.inputForm(date);
        } else {
            return;
        }
    });
    Template.registerHelper('formatDate', function(date) {
        if (date) {
            return Meteor.dates.wordDate(date);
        }
        return;
    });
    Template.registerHelper('formatIssueDate',function(date,settings) {
        if(date){
            if(settings.day && settings.month && settings.year){
                return moment(date).format('d MMMM, YYYY');
            }else if(settings.month && settings.year){
                return moment(date).format('MMMM YYYY');
            }else if(settings.day && settings.year){
                return moment(date).format('d YYYY'); //TODO prevent day being selected if no month
            }else if(settings.day && settings.month){
                return moment(date).format('Do MMMM');
            }else if(settings.year){
                return moment(date).format('YYYY');
            }
        }
        return;
    });
    Template.registerHelper('articleDate',function(date) {
        if(date){
            return Meteor.dates.article(date);
        }
        return;
    });
    Template.registerHelper('getYear',function(date) {
        if(date){
            return moment(date).format('YYYY');
        }
        return;
    });
    Template.registerHelper('getMonth',function(date) {
        if(date){
            return moment(date).format('MMMM');
        }
        return;
    });
    Template.registerHelper('getDay',function(date) {
        if(date){
            return moment(date).format('D');
        }
        return;
    });
    Template.registerHelper('dashedDateToWordDate',function(date) {
        if(date){
            return Meteor.dates.dashedToWord(date);
        }
        return;
    });
    // Equals
    // -------
    Template.registerHelper('equals', function (a, b) {
        return a == b;
    });
    Template.registerHelper('equalsArticleId', function(id) {
        if(Session.get('articleId') === id){
            return true;
        }
    });
    Template.registerHelper('editingSection', function (id) {
        // console.log('..editingSection ');
        // for admin editing of for authors
        return id == Session.get('sectionId');
    });
    Template.registerHelper('editingPaperSection', function (id) {
        // for admin editing of section
        return id == Session.get('paperSectionId');
    });
    Template.registerHelper('editingAboutSection', function (id) {
        // for admin editing of about
        return id == Session.get('aboutSectionId');
    });
    // Not equals
    Template.registerHelper('notEmpty', function (a) {
        if(!a){
            return false;
        }else if(a.length > 0){
            return true;
        }else{
            return false;
        }
    });


    // Modify
    // -------
    Template.registerHelper('arrayify',function(obj){
        result = [];
        for (var key in obj) result.push({name:key,value:obj[key]});
        return result;
    });

    // Count
    // --------
    Template.registerHelper('countItems', function(items) {
        if (items) {
            return items.length;
        }
        return;
    });
    Template.registerHelper('countKeys', function(object) {
        var count = 0;
        for(var key in object){
            count++;
        }
        return count;
    });

    // Misc
    // ---------
    Template.registerHelper('actionSaving', function(action){
        if(action){
              if( action.toLowerCase() == 'saving' || action.toLowerCase() == 'searching'  ){
                  return true;
              }
        }
    });

    // Data Submissions
    // ----------
    Template.registerHelper('articleDataReady', function() {
        return Session.get('article-form');
    });
    Template.registerHelper('submittedAndMissingPmid', function(ids) {
        if(!ids.pmid){
            return true;
        }
        return false;
    });
    Template.registerHelper('missingDoi', function(ids) {
        if(ids && !ids.doi){
            return true;
        } else if (!ids) {
            return true;
        }
        return false;
    });
}

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
    return Session.get('article-id');
  })
  Template.registerHelper('getPmid', function(article) {
    // console.log('..getPmid');
    // for references without PMID in XML
    var pmid;
    if (article.title) {
      // console.log(article.number + ' = ' +article.title);
      Meteor.call('getPubMedId', article, function(error, pmid) {
        if (pmid) {
          var fullText = Session.get('article-text');
          var references = fullText.references;
          // Update reference PMID key
          // do not rely on number of reference as index of reference in array.
          for (var ref = 0; ref < references.length; ref++) {
            if (references[ref].number === article.number) {
              fullText.references[ref].pmid = pmid;
              // Update Session variable
              Session.set('article-text', fullText);
            }
          }
        }
      });
    }
  });
  Template.registerHelper('affiliationNumber', function(affiliation) {
    return parseInt(parseInt(affiliation) + 1);
  });
  Template.registerHelper('pubStatusAbbrev', function(number) {
    if (pubStatusTranslate[parseInt(number - 1)]) {
      return pubStatusTranslate[parseInt(number - 1)]['abbrev'];
    }
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
  Template.registerHelper('timestamp', function(date) {
    date = new Date(date);
    return date.getTime();
  });
  Template.registerHelper('dateDayExists', function(date) {
    //if the date object should have a day value associated with it
    if (moment(date).format('HH') == 0) {
      return true;
    } else {
      return false;
    }
  });
  Template.registerHelper('placeholderDate', function(date) {
    return moment(date).format('M D, YYYY');
  });
  Template.registerHelper('getMonthWord', function(month) {
    var d = new Date(month);
    var month = new Array();
    month[0] = 'January';
    month[1] = 'February';
    month[2] = 'March';
    month[3] = 'April';
    month[4] = 'May';
    month[5] = 'June';
    month[6] = 'July';
    month[7] = 'August';
    month[8] = 'September';
    month[9] = 'October';
    month[10] = 'November';
    month[11] = 'December';
    return month[d.getMonth()];
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
  Template.registerHelper('formatDateNumber', function(date) {
    if (date) {
      return moment(date).format('MM/D/YYYY');
    }
    return;
  });
  Template.registerHelper('formatIssueDate', function(date, settings) {
    if (date) {
      if (settings.day && settings.month && settings.year) {
        return moment(date).format('d MMMM, YYYY');
      } else if (settings.month && settings.year) {
        return moment(date).format('MMMM YYYY');
      } else if (settings.day && settings.year) {
        return moment(date).format('d YYYY'); //TODO prevent day being selected if no month
      } else if (settings.day && settings.month) {
        return moment(date).format('Do MMMM');
      } else if (settings.year) {
        return moment(date).format('YYYY');
      }
    }
    return;
  });
  Template.registerHelper('articleDate', function(date) {
    if (date) {
      return Meteor.dates.article(date);
    }
    return;
  });
  Template.registerHelper('collectionDate', function(date) {
    if (date) {
      return moment(date).format('MMMM YYYY');
    }
    return;
  });
  Template.registerHelper('getYear', function(date) {
    if (date) {
      return moment(date).format('YYYY');
    }
    return;
  });
  Template.registerHelper('getMonth', function(date) {
    if (date) {
      return moment(date).format('MMMM');
    }
    return;
  });
  Template.registerHelper('getDay', function(date) {
    if (date) {
      return moment(date).format('D');
    }
    return;
  });
  Template.registerHelper('dashedDateToWordDate', function(date) {
    if (date) {
      return Meteor.dates.dashedToWord(date);
    }
    return;
  });
  // Equals
  // -------
  Template.registerHelper('equals', function(a, b) {
    return a == b;
  });
  Template.registerHelper('equalsArticleId', function(id) {
    if (Session.get('article-id') === id) {
      return true;
    }
  });
  Template.registerHelper('editingSection', function(id) {
    // console.log('..editingSection ');
    // for admin editing of for authors
    return id == Session.get('sectionId');
  });
  Template.registerHelper('editingPaperSection', function(id) {
    // for admin editing of section
    return id == Session.get('paperSectionId');
  });
  Template.registerHelper('editingAboutSection', function(id) {
    // for admin editing of about
    return id == Session.get('aboutSectionId');
  });
  // Not equals
  Template.registerHelper('notEmpty', function(a) {
    if (!a) {
      return false;
    } else if (a.length > 0) {
      return true;
    } else {
      return false;
    }
  });


  // Modify
  // -------
  Template.registerHelper('arrayify', function(obj) {
    result = [];
    for (var key in obj) result.push({
        name: key,
        value: obj[key]
      });
    return result;
  });
  // Count
  // --------
  Template.registerHelper('countItems', function(items) {
    return items.length;
  });
  Template.registerHelper('countKeys', function(object) {
    var count = 0;
    for (var key in object) {
      count++;
    }
    return count;
  });
  // Subscribers
  // -------
  Template.registerHelper('clientIP', function() {
    return headers.getClientIP();
  });
  Template.registerHelper('isSubscribed', function() {
    ip = Meteor.ip.dot2num(headers.getClientIP());

    var match = ipranges.findOne({
      startNum: {
        $lte: ip
      },
      endNum: {
        $gte: ip
      }
    }
    );

    if (match === undefined) {
      userId = Meteor.userId();
      match = Meteor.users.findOne({
        '_id': userId,
        subscribed: true
      });
    }

    return match !== undefined;
  });
  Template.registerHelper('isSubscribedUser', function() {
    userId = Meteor.userId();
    match = Meteor.users.findOne({
      '_id': userId,
      subscribed: true
    });
    return match !== undefined;
  });
  Template.registerHelper('isSubscribedIP', function() {
    ip = Meteor.ipdot2num(headers.getClientIP());

    var match = ipranges.findOne({
      startNum: {
        $lte: ip
      },
      endNum: {
        $gte: ip
      }
    }
    );

    return match !== undefined;
  });
  Template.registerHelper('getInstitutionByIP', function() {
    ip = Meteor.ip.dot2num(headers.getClientIP());

    var match = ipranges.findOne({
      startNum: {
        $lte: ip
      },
      endNum: {
        $gte: ip
      }
    }
    );

    if (match) {
      inst_match = institutions.findOne({
        "_id": match.institutionID
      });
    }

    return inst_match || false;
  });

  Template.registerHelper('actionSaving', function(action) {
    if (action) {
      if (action.toLowerCase() == 'saving' || action.toLowerCase() == 'searching') {
        return true;
      }
    }
  });

  Template.registerHelper('searchResults', function() {
    return Session.get("queryResults");
  });
}

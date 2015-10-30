// Articles
// --------
articles.after.insert(function (userId, doc) {
  // console.log('..before insert article');
  // console.log('doc');console.log(doc.advance);console.log(this._id);

  // Advance
  if(doc.advance){
    Meteor.call('sorterAddArticle','advance',this._id);
  }

  // Volume, Issue
  var doc = Meteor.call('articleIssueVolume',doc);
});
articles.before.update(function (userId, doc, fieldNames, modifier, options) {
  // console.log('..before update article')
  // Advance article. Update sorters colleciton.
  if(modifier['$set']['advance']){
    Meteor.call('sorterAddArticle','advance',doc._id);
  }else{
    Meteor.call('sorterRemoveArticle','advance',doc._id);
  }

  // Affiliations
  //add affiliation number to author
  //might need to adjust this as article updates get added
  if(fieldNames.indexOf('authors') != -1){
    var authorsList = modifier['$set']['authors'];
    var affiliationsList = doc['affiliations'];
    // console.log('affiliationsList');console.log(affiliationsList);
    for(var i = 0 ; i < authorsList.length ; i++){

      if(authorsList[i]['affiliations_names'] && affiliationsList){
        //article update from a batch import of author affiliations
        //affiliations_names is only used to find index of affiliation after batch import
        authorsList[i]['affiliations_numbers'] = [];
        for(var a = 0 ; a < authorsList[i]['affiliations_names'].length ; a++){
          var affiliationIndex = affiliationsList.indexOf(authorsList[i]['affiliations_names'][a]);
          authorsList[i]['affiliations_numbers'].push(parseInt(affiliationIndex));
        }
      }else if(authorsList[i]['affiliations_numbers']){

      }
    }
  }


  // Volume, Issue
  var doc = Meteor.call('articleIssueVolume',doc);
});

// Issues
// -----
issues.after.insert(function (userId, doc) {
  console.log('..before insert issues');

  issueData['doc_updates'] = {};
  issueData['doc_updates']['created_date'] = new Date();
  issueData['doc_updates']['created_by'] = userId;
});
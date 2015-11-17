// Articles
// --------
articles.before.insert(function (userId, doc) {
  // console.log('..articles before insert');
  // Volume, Issue
  if(doc['volume'] && doc['issue']){
    volume = doc['volume'];
    issue = doc['issue'];
    doc['issue_id'] = Meteor.call('articleIssueVolume',volume,issue);
  }
  // console.log(doc['issue_id']);
});
articles.after.insert(function (userId, doc) {
  // console.log('..after insert article');
  //console.log(doc.advance);console.log(this._id);

  // Advance
  if(doc.advance){
    Meteor.call('sorterAddArticle','advance',this._id);
  }
});
articles.before.update(function (userId, doc, fieldNames, modifier, options) {
  var volume,
      issue;
  // console.log('..before update article');
  // console.log(modifier['$set']);
  // Advance article. Update sorters colleciton.
  if(modifier['$set']){
    if(modifier['$set']['advance']){
      Meteor.call('sorterAddArticle','advance',doc._id);
    }else{
      Meteor.call('sorterRemoveArticle','advance',doc._id);
    }
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

  if(modifier['$set']['volume'] && modifier['$set']['issue']){
    volume = modifier['$set']['volume'];
    issue = modifier['$set']['issue'];
    modifier['$set']['issue_id'] = Meteor.call('articleIssueVolume',volume,issue);
  }
});

// Issues
// -----
issues.after.insert(function (userId, doc) {
  // console.log('..before insert issues');
  var issueData = {};
  issueData['doc_updates'] = {};
  issueData['doc_updates']['created_date'] = new Date();
  issueData['doc_updates']['created_by'] = userId;
});


Sorters
 -------
sorters.after.update(function (userId, doc, fieldNames, modifier, options){
  var articlesList,
      diff;
  articlesList = modifier['$set'];
  if(articlesList){
    articlesList = articlesList.order;
    if(articlesList.length < this.previous.order.length){
      // An article was removed. Update the articles collection. Find difference between old and new list.
      diff = Meteor.organize.arrDiff(articlesList,this.previous.order);
      console.log(diff);
      for(var i=0 ; i < diff.length ; i++){
        Meteor.call('updateArticle',diff[i],{advance:false});
      }
    }
  }
  // if new order is greater than original, than articles collection was already updated on OJS intake or via aricles page and the collection hook on articles is triggering the sorters update
});

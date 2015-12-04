// General
// -------------
Template.Visitor.helpers({
	bannerLogo: function(){
		var journalSettings = journalConfig.findOne();
		if(journalSettings){
			return journalSettings['journal']['logo']['banner'];
		}
	},
	submitLink : function(){
		var journalSettings = journalConfig.findOne();
		if(journalSettings){
			return journalSettings['submission']['url'];
		}
	},
	mainColor: function(){
		var journalSettings = journalConfig.findOne();
		if(journalSettings){
			return journalSettings['site']['spec']['color']['main_rgb'];
		}
	},
});
Template.Footer.helpers({
	publisher : function(){
		var journalSettings = journalConfig.findOne();
		if(journalSettings){
			return journalSettings['journal']['publisher']['name'];
		}
	},
	issn : function(){
		var journalSettings = journalConfig.findOne();
		if(journalSettings){
			return journalSettings['journal']['issn'];
		}
	}
});
Template.ErrorMessages.helpers({
	errors: function(){
		return Session.get('errorMessages');
	}
});
Template.SubscribeModal.helpers({
	article: function(){
		return Session.get('articleData');
	}
});
// Navigation
// -------------
Template.LeftNav.helpers({
	links: function(){
		if(Session.get('journal')){
			return Session.get('journal').site.side_nav;
		}
	}
});
Template.MobileMenu.helpers({
	links: function(){
		if(Session.get('journal')){
			return Session.get('journal').site.side_nav;
		}
	}
});
// Contact
// -------------
Template.Contact.helpers({
	submitLink : function(){
		var journalSettings = journalConfig.findOne();
		if(journalSettings){
			return journalSettings['submission']['url'];
		}
	}
});
// Archive
// -------------
Template.Archive.helpers({
	volumes: function(){
		var vol = volumes.find({},{sort : {volume:-1}}).fetch();
		var iss = issues.find({},{sort : {issue:-1}}).fetch();
		var res = Meteor.organize.issuesIntoVolumes(vol,iss);
		return res;
	}
});
// Editorial Board
// -------------
Template.EdBoard.helpers({
	journalName: function(){
		var journalSettings = journalConfig.findOne();
		if(journalSettings){
			return journalSettings['journal']['name'];
		}
	}
});

// Article
// -------
Template.Article.helpers({
	assets: function(){
		return Session.get('article-assets');
	}
});
Template.ArticleButtons.helpers({
	assets: function(){
		return Session.get('article-assets');
	}
});
Template.ArticleText.helpers({
	fullText: function(){
		// console.log(Session.get('article-text'));
		return Session.get('article-text');
	}
});
Template.ArticleSections.helpers({
	fullText: function(){
		return Session.get('article-text');
	}
});

// Issue
// ------
Template.Issue.helpers({
	issueData: function(){
		return Session.get('issue');
	}
});
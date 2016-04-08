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
	configLoaded: function (){
		var journalSettings = journalConfig.findOne();
		if(journalSettings){
			return true;
		}
	}
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

// SubNav
Template.subNav.helpers({
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
	},
	sectionsLinks: function(){
		var sectionsList = sections.find().fetch();
		return sectionsList;
	}
});
Template.MobileMenu.helpers({
	links: function(){
		if(Session.get('journal')){
			return Session.get('journal').site.side_nav;
		}
	},
	sectionsLinks: function(){
		var sectionsList = sections.find().fetch();
		return sectionsList;
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
		return Session.get('archive');
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
Template.AuthorsRefList.helpers({
	tooltipAffiliation: function() {
		var articleData = Template.parentData(2);
		var authorData = Template.parentData(1);
		var num = parseInt(authorData.affiliations_numbers);
		return articleData.affiliations[num];
	}
})

// Issue
// ------
Template.Issue.helpers({
	issueData: function(){
		return Session.get('issue');
	}
});

// Sections
Template.SectionPapers.helpers({
	articles: function(){
		return Session.get('article-list');
	}
})
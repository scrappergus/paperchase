// Aging
var links = [
	{
		'path' : '/',
		'text': 'Home'
	},
	{
		'path' : '/archive',
		'text': 'Archive'
	},
	{
		'path' : '/advance',
		'text': 'Advance online publications'
	},
	{
		'path' : '/recent-breakthroughs',
		'text': 'Recent breakthroughs'
	},
	{
		'path' : '/for-authors',
		'text': 'Information for authors'
	},
	{
		'path' : '/about',
		'text': 'About the journal'
	},
	{
		'path' : '/editorial-board',
		'text': 'Editorial board'
	},
	{
		'path' : '/contact',
		'text': 'Contact'
	}
];

Template.LeftNav.helpers({
	links: function(){
		return links;
	}
});
Template.MobileMenu.helpers({
	links: function(){
		return links;
	}
});
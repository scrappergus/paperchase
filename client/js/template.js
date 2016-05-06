// Visitor
// -------
Template.Visitor.onRendered(function () {
    $('.button-collapse').sideNav();
});

Template.Subscribe.onRendered(function () {
    $('select').material_select();
});

Template.Home.onRendered(function () {
  $('.modal-trigger').leanModal(); // bio modals

  $('.collapsible').collapsible({
    accordion : false // A setting that changes the collapsible behavior to expandable instead of the default accordion style
  });

  $('footer').wrap('<div class="grid"></div>');
  $('.content-yield').addClass('home');
  // $('.sub-nav').addClass('transparent');
});

Template.Home.onDestroyed(function() {
  $('footer').unwrap();
  $('.content-yield').removeClass('home');
  // $('.sub-nav').removeClass('transparent');
});

Template.EdBoard.onRendered(function() {
  $('.modal-trigger').leanModal(); // bio modals
});

Template.scrollspyCard.onRendered(function() {
  new ResizeSensor($('.main'), function(){ 
    $('.fixed-scroll-card').css('width', $('.page-sidebar').width());
  });
});


// Issue
// ------
Template.Issue.onDestroyed(function () {
    Session.set('issue',null);
});

// Section Papers
// ------
Template.SectionPapers.onRendered(function () {
    Session.set('article-list',null)
});

// Article
// --------
Template.Article.onRendered(function() {
	// hacky width workaround for fixed element
	$( window ).resize(function() {
	  $('.fixed-scroll-card').css('width', $('.page-sidebar').width());
	}).resize();
});

Template.ArticleFigures.onRendered(function() {
	$('.owl-carousel').owlCarousel();
});

Template.ArticleFigureViewer.onRendered(function() {
    $('.figure img, .table img').wrap('<div class="container"></div>');
    var $panzoom = $('.figure img, .table img').panzoom({
                    $zoomIn: $('.zoom-in'),
                    $zoomOut: $('.zoom-out'),
                    $zoomRange: $('.zoom-range'),
                    $reset: $(".reset"),
                    maxScale: 3,
                    increment: 0.1
                }).panzoom('zoom', true);
});
Template.ArticleText.onRendered(function() {
    // $('.materialboxed').materialbox();
});
Template.ArticleFullText.onRendered(function() {
    // $('.materialboxed').materialbox(); // popup image
});
Template.ArticleFullText.onDestroyed(function () {
    Session.set('article-text',null)
});

// Scrollspy
// --------
Template.scrollspyCard.onRendered(function() {
    Meteor.general.affix();
    Meteor.general.scrollspy();
});

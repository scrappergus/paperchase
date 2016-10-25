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

  // $('footer').wrap('<div class="grid"></div>');
  // $('.sub-nav').addClass('transparent');
});

Template.EdBoard.onRendered(function() {
  $('.modal-trigger').leanModal(); // bio modals
});

Template.scrollspyCard.onRendered(function() {
  new ResizeSensor($('.main'), function(){
    $('.fixed-scroll-card').css('width', $('.page-sidebar').width());
  });
});

// Section Papers
// ------
Template.SectionPapers.onRendered(function () {
    Session.set('article-list',null);
});

// Article
// --------
Template.ArticleFigures.onRendered(function() {
	$('.owl-carousel').owlCarousel();
});

Template.ArticleFigureViewerViewer.onRendered(function() {
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
// Template.ArticleText.onRendered(function() {
    // _altmetric_embed_init();
    // $('.materialboxed').materialbox();
// });
// Template.ArticleFullText.onRendered(function() {

//     // $('.materialboxed').materialbox();
//     MeteorMathJax.require(function (MathJax) {
//         // this is a force download. The package will download if needed, so this is commented out
//         MeteorMathJax.ready();
//     });
// });
// Template.ArticleFullText.onRendered(function() {
    // $('.materialboxed').materialbox(); // popup image
// });

// Scrollspy
// --------
Template.scrollspyCard.onRendered(function() {
    Meteor.general.affix();
    Meteor.general.scrollspy();
});

Template.AdvancedSearch.onRendered(function() {
    Meteor.general.affix();
});

Template.AdvancedSearch.onRendered(function() {
  new ResizeSensor($('.main'), function(){
    $('.fixed-scroll-card').css('width', $('.page-sidebar').width());
  });
});

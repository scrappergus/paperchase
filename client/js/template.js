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

Template.ArticleFigureViewerFig.onRendered(function() {
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
// Template.AltmetricBadge.onRendered(function() {
    // $('.tooltipped').tooltip({delay: 50});
// });

Template.AltmetricBadgeWithReport.onRendered(function() {
    // var reportLink = Meteor.settings.public.journal.altmetric.reportLink;
    _altmetric_embed_init();

    // Below caused a memory leak because altmetric:show is called multiple times
    // this was used to try to replace the default href
    // $('div.altmetric-embed').on('altmetric:show', function () {
        // // fix href in popover
        // // --------------------
        // $('div.altmetric-embed').each(function(altmetricPopElIdx, altmetricPopEl){
        //     if (altmetricPopEl) {
        //         var altmetricPopLink = $(altmetricPopEl).find('.altmetric_details').attr('href');
        //         if (altmetricPopLink) {
        //             var altmetricPopLinkPieces = altmetricPopLink.split('=');
        //             if (altmetricPopLinkPieces && altmetricPopLinkPieces.length > 0) {
        //                 // check that the last piece is the number, use == because will be different types
        //                 if (parseInt(altmetricPopLinkPieces[altmetricPopLinkPieces.length - 1]) == altmetricPopLinkPieces[altmetricPopLinkPieces.length - 1]) {
        //                     var altmetricId = altmetricPopLinkPieces[altmetricPopLinkPieces.length - 1];
        //                     console.log('altmetricId',altmetricPopElIdx, altmetricId);
        //                     $(this).find('.altmetric_details').attr('href', reportLink + altmetricId).attr('target','_BLANK');
        //                 }
        //             }
        //         }
        //     }
        // });
        //
        // // fix href in badge
        // // -------------------
        // $('.article-altmetric').each(function(altmetricElIdx, altmetricEl){
        //     if (altmetricEl) {
        //         var altmetricLink = $(altmetricEl).find('a').attr('href');
        //         if (altmetricLink) {
        //             var altmetricLinkPieces = altmetricLink.split('=');
        //             if (parseInt(altmetricLinkPieces[altmetricLinkPieces.length - 1]) == altmetricLinkPieces[altmetricLinkPieces.length - 1]) {
        //                 var altmetricId = altmetricLinkPieces[altmetricLinkPieces.length - 1];
        //                 console.log('altmetricId',altmetricElIdx, altmetricId);
        //                 $(this).find('a').attr('href', reportLink + altmetricId).attr('target','_BLANK');
        //             }
        //         }
        //     }
        // });
    // });
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

//Fix the overlapping labels and placeholders on the print request form
Template.PrintRequest.rendered = function(){
    Materialize.updateTextFields();
    $('select').material_select();
}

// Visitor
// -------
Template.Visitor.onRendered(function () {
	$('.button-collapse').sideNav();
});

Template.Subscribe.onRendered(function () {
	$('select').material_select();
});

Template.Home.onRendered(function () {
	$('.edboard-name').click(function() {
		$(this).next().toggle();
	});

	$('.collapsible').collapsible({
		accordion : false // A setting that changes the collapsible behavior to expandable instead of the default accordion style
	});
});

Template.scrollspyCard.onRendered(function() {
	// hacky width workaround for fixed element
	$( window ).resize(function() {
	  $('.fixed-scroll-card').css('width', $('.page-sidebar').width());
}).resize();
});

// Issue
// ------
Template.Issue.onDestroyed(function () {
	Session.set('issue',null)
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
Template.ArticleSectionsList.onRendered(function() {
    // console.log('..ArticleSectionsList');
    var navTop = Meteor.general.navHeight();
    $('.section-nav').sticky({topSpacing: navTop});
});

// Scrollspy
// --------
Template.scrollspyCard.onRendered(function() {
    var sticky = $('.fixed-scroll-card');

    if (sticky.length > 0) {
        var stickyHeight = sticky.height();
        var sidebarTop = parseInt(sticky.offset().top - 105) ;
    }

    // on scroll affix the sidebar
    $(window).scroll(function () {
        if (sticky.length > 0) {
            var scrollTop = $(window).scrollTop();

            if (sidebarTop < scrollTop) {
                sticky.addClass('fixed-active');
            }
            else {
                sticky.removeClass('fixed-active');
            }
        }
    });

    $(window).resize(function () {
        if (sticky.length > 0) {
            stickyHeight = sticky.height();
        }
    });
});

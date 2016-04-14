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

// Scrollspy
// --------
Template.scrollspyCard.onRendered(function() {
    var sticky = $('.fixed-scroll-card');

    if (sticky.length > 0) {
        var stickyHeight = sticky.height();
        var sidebarTop = parseInt(sticky.offset().top - 10) ;
    }

    // on scroll affix the sidebar
    $(window).scroll(function () {
        if (sticky.length > 0) {
            var scrollTop = $(window).scrollTop() + 150;

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


    /*

    Minimalistic Scrollspy | https://jsfiddle.net/mekwall/up4nu/

    */

    // Cache selectors
    var lastId,
        menu = $(".scrollspy"),
        navHeight = 250,

        // All list items
        menuItems = menu.find("a"),

        // Anchors corresponding to menu items
        scrollItems = menuItems.map(function(){
          var item = $($(this).attr("href"));
          if (item.length) { return item; }
        });

    // Bind click handler to menu items
    // so we can get a fancy scroll animation
    menuItems.click(function(e){
      var href = $(this).attr("href"),
          offsetTop = href === "#" ? 0 : $(href).offset().top-navHeight+1;
      $('html, body').stop().animate({
          scrollTop: offsetTop
      }, 300);
      e.preventDefault();
    });

    // Bind to scroll
    $(window).scroll(function(){
       // Get container scroll position
       var fromTop = $(this).scrollTop()+navHeight;

       // Get id of current scroll item
       var cur = scrollItems.map(function(){
         if ($(this).offset().top < fromTop)
           return this;
       });
       // Get the id of the current element
       cur = cur[cur.length-1];
       var id = cur && cur.length ? cur[0].id : "";

       if (lastId !== id) {
           lastId = id;
           // Set/remove active class
           menuItems
             .parent().removeClass("active")
             .end().filter("[href='#"+id+"']").parent().addClass("active");
       }
    });
});

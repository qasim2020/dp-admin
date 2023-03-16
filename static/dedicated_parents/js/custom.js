/*-------------------------------------------------------------------------
 * ICARE - Custom jQuery Scripts
 * ------------------------------------------------------------------------

	1.	Plugins Init
	2.	Site Specific Functions
	3.	Shortcodes
	4.  Other Need Scripts (Plugins config, themes and etc)
	
-------------------------------------------------------------------------*/


(function($) {

	"use strict";
	
/*------------------------------------------------------------------------*/
/*	1.	Plugins Init
/*------------------------------------------------------------------------*/

	// Tooltip
	function toolTipInit() {
	
		$('.social-icon-top ul li a, ul.footer-social li a').tooltip({
			placement: 'bottom'
		});
	}
	
	toolTipInit();


	//Superfish Init (DropDown Menu)
	function initSuperFish(){
		
		$(".sf-menu").superfish({
			 delay:  50,
			 autoArrows: true,
			 animation:   {opacity:'show'}
			 //cssArrows: true
		});
		
		// Replace SuperFish CSS Arrows to Font Awesome Icons
		$('nav > ul.sf-menu > li').each(function(){
			$(this).find('.sf-with-ul').append('<i class="fa fa-angle-down"></i>');
		});
	}
	
	initSuperFish();


	// Flexslider Init
	function initFlexSlider(){
		$('.flexslider').flexslider({
			animation: "fade",
			easing: "swing",
			controlNav: false,
			directionNav: true,
			prevText: '',
			nextText: '',
			start: function(slider){
			  $('body').removeClass('loading');
			}
		});
	}

	initFlexSlider();


	//Urgent Causes with fredcarousel
	jQuery(function() {
	    var _scroll = {
	        delay: 1000,
	        easing: 'linear',
	        items: 1,
	        duration: 0.07,
	        timeoutDuration: 0,
	        pauseOnHover: 'immediate'
	    };
	    jQuery('.inner-carousel').carouFredSel({
	        width: 1000,
	        align: false,
	        items: {
	            width: 'variable',
	            height: 30,
	            visible: 1
	        },
	        scroll: _scroll
	    });

	    //  set carousels to be 100% wide
	    jQuery('.caroufredsel_wrapper').css('width', '100%');
	});



	//Fancybox Init
	function initFancyBox(){
		$('.fancybox').fancybox({
            openEffect  : 'elastic',
            prevEffect: 'fade',
    		nextEffect: 'fade'
		});
	}

	initFancyBox();
	

/*------------------------------------------------------------------------*/
/*	2.	Site Specific Functions
/*------------------------------------------------------------------------*/
	
	//Open menu responsive
	$('a.toggle-menu').click(function(){
        $('.menu-open').stop(true,true).slideToggle();
        return false;
    });

	//Remove urgent cause on click
    $('a.close-u-cause').click(function(){
        $('.u-cause-wrapper').hide(350);
        return false;
    });


	// This function setup a tabed navigation for testimonials element
	function initTestimonialsNav(){
		$('.testi-tabs a').on('click', function(e)  {
			var currentAttrValue = $(this).attr('href');
	 
			// Show/Hide Tabs
			$(currentAttrValue).show().siblings().hide();
		 
			// Change/remove current tab to active
			$(this).parent('li').addClass('active').siblings().removeClass('active');
		 
			e.preventDefault();
		});
	}
	// Call and run the function
	initTestimonialsNav();

	$('.testi-tabs a').on('click', function(e) {
		$('.testi-content').addClass('animated fadeInRight');
	});




	
	$('.gallery-thumb').addClass('closed');

	// Hover Effect for Gallery items
	 $('.gallery-thumb').hover(function(){
        var elem = $(this);
        elem.removeClass('closed');
        elem.css({opacity: 1});
        $('.gallery-wrapper .closed, .footer-gallery .closed').css({opacity: 0.5});
    }, function(){
        var elem = $(this);
        elem.addClass('closed');
        $('.gallery-wrapper .closed, .footer-gallery .closed').css({opacity: 1});
    });




/*------------------------------------------------------------------------*/
/*	3.	Shortcodes
/*------------------------------------------------------------------------*/

//TODO

/*------------------------------------------------------------------------*/
/*	4.	Other Need Scripts (Plugins config, themes and etc)
/*------------------------------------------------------------------------*/

	
	//Do nothing for inactive next and prev on posts
	$('a.go-next.inactive, a.go-prev.inactive').on('click', function(e) {
		return false;
	});

	//Go to top
	jQuery.fn.topLink = function(settings) {
		settings = jQuery.extend({
			min: 1,
			fadeSpeed: 200
		}, settings);
		return this.each(function() {
			//listen for scroll
			var el = $(this);
			el.hide(); //in case the user forgot
			$(window).scroll(function() {
				if($(window).scrollTop() >= settings.min)
				{
					el.fadeIn(settings.fadeSpeed);
				}
				else
				{
					el.fadeOut(settings.fadeSpeed);
				}
			});
		});
	};

	//usage w/ smoothscroll
	$(document).ready(function() {
		//set the link
		$('#top-link').topLink({
			min: 400,
			fadeSpeed: 500
		});
		//smoothscroll
		$('#top-link').click(function(e) {
			e.preventDefault();
			$.scrollTo(0,300);
		});
	});


})(jQuery);

 /* jQuery Pre loader
  -----------------------------------------------*/
$(window).load(function(){
    $('.preloader').fadeOut(1000); // set duration in brackets
});


$(document).ready(function() {

  /* Hide mobile menu after clicking on a link
    -----------------------------------------------*/
    $('.navbar-collapse a').click(function(){
        $(".navbar-collapse").collapse('hide');
    });


  /* Smoothscroll js
  -----------------------------------------------*/
    $(function() {
        $('.navbar-default a').bind('click', function(event) {
            var $anchor = $(this);
            $('html, body').stop().animate({
                scrollTop: $($anchor.attr('href')).offset().top - 49
            }, 1000);
            event.preventDefault();
        });
    });


 /* Home Slideshow Vegas
  -----------------------------------------------*/
  $(function() {
    $('body').vegas({
        slides: [
            { src: '/easy_heal/images/slide-img1.jpg' },
            { src: '/easy_heal/images/slide-img2.jpg' },
            { src: '/easy_heal/images/slide-img3.jpg' }
        ],
        timer: false,
        transition: [ 'zoomIn', ],
        animation: ['kenburns']
    });
  });


  /* Team carousel
  -----------------------------------------------*/
  // $(document).ready(function() {
  //     $("#team-carousel").owlCarousel({
  //         items : 3,
  //         itemsDesktop : [1199,3],
  //         itemsDesktopSmall : [979,3],
  //         slideSpeed: 300,
  //         itemsDesktop : [1199,2],
  //         itemsTablet: [768,1],
  //         itemsTabletSmall: [985,2],
  //         itemsMobile : [479,1],
  //     });
  //   });


    /* Back to Top
    -----------------------------------------------*/
    $(window).scroll(function() {
      if ($(this).scrollTop() > 200) {
          $('.go-top').fadeIn(200);
            } else {
                $('.go-top').fadeOut(200);
           }
        });
          // Animate the scroll to top
        $('.go-top').click(function(event) {
          event.preventDefault();
        $('html, body').animate({scrollTop: 0}, 300);
    });


  /* wow
  -------------------------------*/
  new WOW({ mobile: false }).init();


  $('.general-class').slick({
    slidesToShow: 3,
    slidesToScroll: 3,
    prevArrow:`<svg class="slick-prev" width="20px" height="30px" viewBox="0 0 20 33" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <!-- Generator: Sketch 50.2 (55047) - http://www.bohemiancoding.com/sketch -->
      <desc>Created with Sketch.</desc>
      <defs>
          <linearGradient x1="-27.6808806%" y1="31.9856251%" x2="50%" y2="71.4661177%" id="linearGradient-1">
              <stop stop-color="#888" offset="0%"></stop>
              <stop stop-color="#888" offset="100%"></stop>
          </linearGradient>
      </defs>
      <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
          <g id="Desktop" transform="translate(-6.000000, -389.000000)" fill="url(#linearGradient-1)">
              <polygon id="Path-2-Copy" transform="translate(15.778805, 405.519684) rotate(180.000000) translate(-15.778805, -405.519684) " points="6 389 25.55761 404.413585 6 422.039368"></polygon>
          </g>
      </g>
      </svg>`,
          nextArrow:`<svg class="slick-next" width="20px" height="30px" viewBox="0 0 20 33" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <desc>Created with Sketch.</desc>
              <defs>
                  <linearGradient x1="-27.6808806%" y1="31.9856251%" x2="50%" y2="71.4661177%" id="linearGradient-1">
                      <stop stop-color="#888" offset="0%"></stop>
                      <stop stop-color="#888" offset="100%"></stop>
                  </linearGradient>
              </defs>
              <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                  <g id="Desktop" transform="translate(-992.000000, -389.000000)" fill="url(#linearGradient-1)">
                      <polygon id="Path-2" points="992 389 1011.55761 404.413585 992 422.039368"></polygon>
                  </g>
              </g>
          </svg>`,
          responsive: [
            {
              breakpoint: 3000,
              settings: {
                slidesToShow: 3,
                slidesToScroll: 3,
                dots: true
              }
            },
            {
              breakpoint: 600,
              settings: {
                slidesToShow: 2,
                slidesToScroll: 2,
              }
            },
            {
              breakpoint: 480,
              settings: {
                slidesToShow: 1,
                slidesToScroll: 1,
              }
            }
          ],
        });
});

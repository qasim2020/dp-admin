
      let info = {};

      $(document).ready(function() {


        var url = window.location.hash || 'url_#page_intro';
        var hash = url.split('#page_')[1];
        console.log({hash});
        $('.sidebar').find('li:eq(0)').addClass('active');

        $('#key_0').addClass('active');
        $(`[true_id="#${hash}"]`).trigger('click');

        if (window.innerWidth > 768) return;

        let arrayofli = $(`[linked_with]`);
        $.each(arrayofli, (key,val) => {
          let myposnindiv = $(val).offset().left;
          // let visibitiy = window.innerWidth > myposnindiv + $(val).width();
          let visibitiy = myposnindiv > 0;
          let mywidth = $('.sidebar')[0].scrollWidth;
          let moveleft;
          if (!visibitiy) {
            moveleft = (mywidth + myposnindiv) - $(val).width() - 50;
          } else {
            moveleft = mywidth;
          }
          console.log({myposnindiv,visibitiy,mywidth,moveleft});
          $(val).attr({moveleft});
        })

      })

      $(window).scroll(function () {
          let selected = [];
          // highlighter is in main_text
          $.each($('[highlighter="true"]'),(key,val) => {
            let diff = $(val).offset().top - $(window).scrollTop() - 200;
            if (diff > 0) {
              selected.push(val);
            }
          })
          let highlt = $(selected[0]).prevAll('[highlighter="true"]:eq(0)').attr('id') || $('[highlighter="true"]:eq(-1)').attr('id');
          $(`[linked_with = ${highlt}]`).addClass('active');
          $('li').not(`[linked_with = ${highlt}]`).removeClass('active');
          $(`#${highlt}`).addClass('active');
          $('[highlighter="true"]').not(`#${highlt}`).removeClass('active');

          // console.log($(`#${highlt}`).attr('id'));

          // Get scroll posn and move the ui avg left

          if (window.innerWidth > 768) return;
          if (info.dontmove) return;

          let moveleft = $(`[linked_with = ${highlt}]`).attr('moveleft');

          $('.sidebar').scrollLeft(`${moveleft}`);
          console.log({moveleft});
          // $('.sidebar').css({left: `${moveleft}px`});

      });

      $("a").on('click', function(event) {
          if (this.hash !== "") {
            event.preventDefault();
            var hash = this.hash;
            if (window.innerWidth < 700) {
              info.dontmove = true;
              $('html, body').animate({
                scrollTop: $(hash).offset().top - 119
              },{
                duration: 800,
                complete: function() {
                  info.dontmove = false;
                }
              });
            } else {
              $('html, body').animate({
                scrollTop: $(hash).offset().top - 87
              },{
                duration: 800,
                complete: function() {}
              });
            }

          }
        });

        $('.flag').on('click',function() {
          console.log('flag clicked');
          location.assign($(this).attr('link'));
        })

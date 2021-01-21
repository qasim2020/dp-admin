$(document).on('mouseenter mouseleave', '.info-circle', function() {

  let posn = {
    left: $(this).offset().left,
    top: $(this).offset().top,
    right: $(this).offset().right,
    bottom: $(this).offset().bottom
  };
  let data = $(this).attr('my-data');
  $('.popover').html(data);
  $(this).toggleClass('hovered');
  $('.popover').toggleClass('opacity-1');

  if ((posn.left + $('.popover').width()/2) > $(window).width()) {
    console.log('cond 1');
    return $('.popover').css({
      right: 20,
      top: posn.top - $('.popover').height() - $(this).height() - 20,
    });
  }

  if ((posn.left < $('.popover').width()/2)) {
    console.log('cond 2');
    return $('.popover').css({
      left: posn.left,
      top: posn.top - $('.popover').height() - $(this).height() - 20,
    });
  }

  $('.popover').css({
    left: posn.left - ($('.popover').width()/2),
    top: posn.top - $('.popover').height() - $(this).height() - 20,
  });

});


let showSizeGuide = function(elem) {
    let dataLoaded = /table/.test($(elem).closest('.size-guide').siblings('.show-size-guide').html());
    console.log({dataLoaded});
    if (dataLoaded) {
        $(elem).closest('.size-guide').siblings('.show-size-guide').removeClass('d-none');
        $(elem).closest('.size-guide').children('button').toggleClass('d-none');
        return;
    }
    let brandMix = {
        brand: $(elem).closest('.size-guide').attr('my-brand'),
        category: $(elem).closest('.size-guide').attr('my-category')
    };
    $.get(`/${brandMix.brand}/gen/data/getSizes/${brandMix.category}`, function(data) {
        $(elem).closest('.size-guide').children('button').toggleClass('d-none');
        let headings = Object.keys(data[0]).reduce( (total, val) => total = `<td>${val.charAt(0).toUpperCase() + val.slice(1)}</td>` + total, '' );
        let bodies = data.map( val => Object.values(val).reduce( (total, vall) => total = `<td>${vall}</td>` + total, '' ) );
        let finalHtml = `<table><tr>${headings}</tr>` + bodies.reduce( (total, val) => total = total + `<tr>${val}</tr>`, '' ) + `</table>`;
        $(elem).closest('.size-guide').siblings('.show-size-guide').html(finalHtml);
    });
};

let hideSizeGuide = function(elem) {
    $(elem).closest('.size-guide').children('button').toggleClass('d-none');
    $(elem).closest('.size-guide').siblings('.show-size-guide').addClass('d-none');
};

let toggleMenu = function(elem) {
    $(elem).closest('nav').find('.menuCard').toggleClass('showMenuCard');
    $(elem).find('svg').toggleClass('d-none');
}

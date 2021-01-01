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

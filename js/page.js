define(["jquery"], function($) {
  var mainFrameContents = $(window.frames["main"].document).contents();
  var bottomFrameContents = $(window.frames["lista"].document).contents();

  function $mainFrame(selector) {
    return $(selector, mainFrameContents)
  }

  function $bottomFrame(selector) {
    return $(selector, bottomFrameContents);
  }

  return {
    mainFrameContents: mainFrameContents,
    bottomFrameContents: bottomFrameContents,
    $mainFrame: $mainFrame,
    $bottomFrame: $bottomFrame
  };
})
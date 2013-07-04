define(["jquery"], function($) {
  var mainFrameContents = $(window.frames["main"].document).contents();
  var bottomFrameContents = $(window.frames["lista"].document).contents();

  function $mainFrame(selector) {
    return $(selector, mainFrameContents)
  }

  function $bottomFrame(selector) {
    return $(selector, bottomFrameContents);
  }

  function $project(i) {
    return $mainFrame("#addProj_ID" + i);
  }

  function $grid(row, column) {
    return $mainFrame(["#txt", "Paiva", row, column].join("_"));
  }

  return {
    $mainFrame: $mainFrame,
    $bottomFrame: $bottomFrame,
    $saveButton: $mainFrame("input[class='button']"),
    $project: $project,
    $grid: $grid
  };
})
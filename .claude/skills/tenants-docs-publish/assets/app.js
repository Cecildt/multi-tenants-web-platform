(function(){
  var panels=[].slice.call(document.querySelectorAll('[data-panel]'));
  var tabs=[].slice.call(document.querySelectorAll('[data-tab]'));
  function show(){
    var h=decodeURIComponent((location.hash||'').slice(1));
    var target=h?document.getElementById(h):null;
    var panel=target?target.closest('[data-panel]'):null;
    if(!panel)panel=panels[0];
    panels.forEach(function(p){p.hidden=p!==panel});
    tabs.forEach(function(t){t.setAttribute('aria-selected',t.dataset.tab===panel.id?'true':'false')});
    if(target&&target!==panel)target.scrollIntoView();else window.scrollTo(0,0);
  }
  window.addEventListener('hashchange',show);
  show();
})();

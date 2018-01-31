(function (window) {
    var last = +new Date();
    var delay = 100; // default delay

    // Manage event queue
    var stack = [];

    function callback() { 
        var now = +new Date();
        if (now - last > delay) {
            for (var i = 0; i < stack.length; i++) {
                stack[i]();
            }
            last = now;
        }
    }

    // Public interface
    var onDomChange = function (fn, newdelay) {
        if (newdelay) delay = newdelay;
        stack.push(fn);
    };

    // Naive approach for compatibility
    function naive() {

        var last = document.getElementsByTagName('*');
        var lastlen = last.length;
        var timer = setTimeout(function check() {

            // get current state of the document
            var current = document.getElementsByTagName('*');
            var len = current.length;

            // if the length is different
            // it's fairly obvious
            if (len != lastlen) {
                // just make sure the loop finishes early
                last = [];
            }

            // go check every element in order
            for (var i = 0; i < len; i++) {
                if (current[i] !== last[i]) {
                    callback();
                    last = current;
                    lastlen = len;
                    break;
                }
            }

            // over, and over, and over again
            setTimeout(check, delay);

        }, delay);
    }

    //
    //  Check for mutation events support
    //

    var support = {};

    var el = document.documentElement;
    var remain = 3;

    // callback for the tests
    function decide() {
        if (support.DOMNodeInserted) {
            window.addEventListener("DOMContentLoaded", function () {
                if (support.DOMSubtreeModified) { // for FF 3+, Chrome
                    el.addEventListener('DOMSubtreeModified', callback, false);
                } else { // for FF 2, Safari, Opera 9.6+
                    el.addEventListener('DOMNodeInserted', callback, false);
                    el.addEventListener('DOMNodeRemoved', callback, false);
                }
            }, false);
        } else if (document.onpropertychange) { // for IE 5.5+
            document.onpropertychange = callback;
        } else { // fallback
            naive();
        }
    }

    // checks a particular event
    function test(event) {
        el.addEventListener(event, function fn() {
            support[event] = true;
            el.removeEventListener(event, fn, false);
            if (--remain === 0) decide();
        }, false);
    }

    // attach test events
    if (window.addEventListener) {
        test('DOMSubtreeModified');
        test('DOMNodeInserted');
        test('DOMNodeRemoved');
    } else {
        decide();
    }

    // do the dummy test
    var dummy = document.createElement("div");
    el.appendChild(dummy);
    el.removeChild(dummy);

    // expose
    window.onDomChange = onDomChange;
})(window);

var RapidEventLoader = (function() {
	
  function get_id_to_item_mapping(curr_document){
	var id_to_item_mapping = {};
	var all_elements = curr_document.getElementsByTagName('*');
	for (var i=0; i<all_elements.length; i++){
		var curr_element = all_elements[i];
		if (curr_element.id != ""){
			if (id_to_item_mapping[curr_element.id] == null){
				id_to_item_mapping[curr_element.id] = [];
			}
			id_to_item_mapping[curr_element.id].push(curr_element);
		}
	}
	return id_to_item_mapping;
  }
  
  function eventAttachNow(obj_id, event_key, exec_func){
	var objects = RapidEventLoader.curr_item_mapping[obj_id];
	if (objects != null){
		for (var i=0; i<objects.length; i++){
			objects[i][event_key] = exec_func;
		}
	}
  }
  
  function onMutation(mutations, observer) {
	console.log("mutation!");
	RapidEventLoader.curr_item_mapping = get_id_to_item_mapping(document);
	for (var i=0; i<RapidEventLoader.events_on_dom_mutation.length; i++){
		var event_data = RapidEventLoader.events_on_dom_mutation[i];
		RapidEventLoader.eventAttachNow(event_data[1], event_data[2], event_data[3]);
	}
  }
  
	window.num_called = {};

	function call_it(func, num_called, delay){
		
		setTimeout(function(){
			//console.log("window.num_called = "+window.num_called+ " num_called = "+num_called);
			if (window.num_called[func] == num_called){
				func();
			}
		}, delay);
	}

	function call_once_after_delay(func, delay){
		if (window.num_called[func] == null){
			window.num_called[func] = 0;
		}
		else{
			window.num_called[func] += 1;
		}
		
		call_it(func, window.num_called[func], delay);
	}

  function init(curr_document){
	this.curr_item_mapping = get_id_to_item_mapping(curr_document);
	this.events_on_dom_mutation = [];
	onDomChange(function(){
		call_once_after_delay(onMutation, 100);
	});
  }

  function eventAttach(curr_document, obj_id, event_key, exec_func){
	RapidEventLoader.events_on_dom_mutation.push([curr_document, obj_id, event_key, exec_func]);
	eventAttachNow(obj_id, event_key, exec_func);
  }
  
  return{
	init: init, 
    eventAttach: eventAttach,
	eventAttachNow:eventAttachNow,
  };
})();
var options = (function() {
	var selected_color,
	    color_picker;

    return {
        init: init,
        clear_storage: clear_storage,
        save_options: save_options
    };

	function save_options() {
        chrome.runtime.getBackgroundPage(function(background) {
            var promise = background.options.save({
                color: selected_color,
                thread_removal_time_seconds: $("#frequency").val() * 86400,
                border: $("#border").is(":checked")
            });

            promise.then(function() {
                var status_area = $("#status-message");
                status_area.text("Okay, got it!").fadeIn(function() {
                    setTimeout(function() {
                        status_area.fadeOut();
                    }, 2000);
                });
            });
        });
	}

    function clear_storage() {
        chrome.runtime.getBackgroundPage(function(background) {
            background.storage.clear().then(function() {
                restore_options();
            });
        });
    }

	function restore_options() {
        chrome.runtime.getBackgroundPage(function(background) {
            var color = background.options.get_color();
            color_picker.colpickSetColor(color);

            var seconds = background.options.get_thread_removal_time_secs(),
                frequency = $("#frequency");
            frequency.val(seconds / 86400);
            frequency.trigger("input");

            var border = background.options.get_has_border();
            $("#border").prop("checked", border);
        });
	}

	function init() {
		color_picker = $("#color").colpick({
			flat: true,
			layout: "rgbhex",
			submit: false,
			onChange: function(hsb, hex) {
				selected_color = "#" + hex;
			}
		});

		restore_options();
	}
})();

$(document).ready(function() {
	options.init();

	$("#save-options").click(function() {
        options.save_options();
    });

	$("#clear-options").click(function() {
        options.clear_storage();
    });
});

$("#frequency").on("input", function() {
	var frequency = $(this).val();

	switch (parseInt(frequency)) {
		case 1:
			$("#frequency_number").text(frequency);
			$("#frequency_unit").text("day");
			break;
		case 7:
			$("#frequency_number").text(1);
			$("#frequency_unit").text("week");
			break;
		case 14:
			$("#frequency_number").text(2);
			$("#frequency_unit").text("weeks");
			break;
		default:
			$("#frequency_number").text(frequency);
			$("#frequency_unit").text("days");
	}
});
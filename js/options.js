var options = (function() {
	var selected_color = null;
	var color_picker = null;

	var save_options = function() {
        chrome.extension.getBackgroundPage()
            .options.save({
                color: selected_color,
                threadRemovalTimeSeconds: $("#frequency").val() * 86400,
                border: $("#border").is(":checked")
            });

        var status_area = $("#status-message");
        status_area.text("Okay, got it!").fadeIn(function() {
            setTimeout(function() {
                status_area.fadeOut();
            }, 2000);
        });
	};

    var clear_storage = function() {
        chrome.extension.getBackgroundPage()
            .storage.clear();

        restore_options();
    };

	var restore_options = function() {
        var color = chrome.extension.getBackgroundPage()
            .options.get_color();
		color_picker.colpickSetColor(color);

        var seconds = chrome.extension.getBackgroundPage()
            .options.get_thread_removal_time_secs();
		$("#frequency").val(seconds / 86400);
		$("#frequency").trigger("input");

        var border = chrome.extension.getBackgroundPage()
            .options.get_has_border();
		$("#border").prop("checked", border);
	};

	var init = function() {
		color_picker = $("#color").colpick({
			flat: true,
			layout: "rgbhex",
			submit: false,
			onChange: function(hsb, hex) {
				selected_color = "#" + hex;
			}
		});

		restore_options();
	};

    return {
        init: init,
        clear_storage: clear_storage,
        save_options: save_options
    };
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
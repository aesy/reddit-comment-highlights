var options = {
	selected_color: null,
	color_picker: null,

	select_color: function(hex) {
		this.selected_color = hex;
	},

	save_options: function() {
		var opts = {
			color: "#" + this.selected_color,
			threadRemovalTimeSeconds: $("#frequency").val() * 86400,
			border: $("#border").is(":checked")
		};

		chrome.storage.sync.set({"reddit_au_options": opts}, function() {
			var status_area = $("#status-message");

			status_area.text("Okay, got it!").fadeIn(function() {
				setTimeout(function() {
					status_area.fadeOut();
				}, 2000);
			});
		});
	},

	clear_storage: function(){
		chrome.storage.sync.clear();
		this.restore_options();
	},

	restore_options: function() {
		var self = this;

		chrome.storage.sync.get("reddit_au_options", function(opts) {
			opts = opts.reddit_au_options || {};
			self.color_picker.colpickSetColor(opts.color || "#FFFDCC");

			var seconds = opts.threadRemovalTimeSeconds || 604800;
			$("#frequency").val(seconds / 86400);
			$("#frequency").trigger("input");

			$("#border").prop("checked", opts.border !== undefined ? opts.border : true);
		});
	},

	init: function() {
		var self = this;

		var picker = $("#color").colpick({
			flat: true,
			layout: "rgbhex",
			submit: false,
			onChange: function(hsb, hex) {
				self.select_color(hex);
			}
		});

		self.color_picker = picker;

		self.restore_options();
	}
}

$(document).ready(function() {
	options.init();
	$("#save-options").click(function() { options.save_options(); });
	$("#clear-options").click(function() { options.clear_storage(); });
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
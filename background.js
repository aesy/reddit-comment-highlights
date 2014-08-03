// Copyright (c) 2014. Daniel Watson. Please be a pal, and share or modify with attribution.
// Sourcecode obtained from http://www.github.com/staticfish/
// Email daniel+highlighter@staticfish.com

viewedCommentsObj = function(argument, retWhat){

	var threadRemovalTimeSeconds = 432000; // 432000 seconds == 5 days. Remove values older than this
	var maximumSavedThreadHeap = 490;
	var obj= {};
	var threadID;

	//chrome.storage.sync.clear();

	// Get the thread ID from the thread's title header div.
	var firstSiteTable = $("#siteTable").first();
	if (firstSiteTable == undefined) return false;

	var threadIDParts = $(firstSiteTable).children(":first").attr('data-fullname').split("_");
	if (threadIDParts == undefined) return false;
	threadID = threadIDParts[1];


	// If we have a valid ThreadID then we're in a reddit thread!
	if (threadID != undefined){
		console.log("Thread ID = " + threadID);

		// Get the current UTC time for the page load
		var pageLoadedString = new Date();
		var pageLoadedEpoch = new Date().getTime();
		console.log("Page loaded on " + pageLoadedString);

		// Try to grab the viewed thread ID out of storage
		chrome.storage.sync.get(obj[threadID], function(data) {
			var lastThreadVisitEpoch = data[threadID];

			if (lastThreadVisitEpoch !== undefined){
				console.log("saved epoch for thread = " + lastThreadVisitEpoch);

				// Now loop through all the comments. If we do not have the saved ID, but we DO have the thread ID
				// then highlight the comment
				$(".tagline").each(function(index, commentTagline){

					// Reddit comment date format: 2014-02-20T00:41:27+00:00
					var commentDateString = $(commentTagline).find("time").attr('datetime');
					if (commentDateString == undefined) return true;

					var commentDateEpoch = Date.parse(commentDateString)
					console.log("Comment made on " + commentDateString);

					if (commentDateEpoch >= lastThreadVisitEpoch){
						// The comment is newer than our last refresh date. Modify the next sibling's grandchild (markdown) div

						// Change background colour to pleasant yellow, add corner radius, a dotted line, and some padding.
						$(commentTagline).next().find(".md").css('background-color', '#FFFDCC');
						$(commentTagline).next().find(".md").css('border','1px dotted #CCCCCC');
						$(commentTagline).next().find(".md").css('border-radius', '2px');
						$(commentTagline).next().find(".md").css('padding', '2px');
						console.log("Current comment posted later than last thread view time. Colourising!");
					}

				});
			}

			// Let's save the current time we have visited this thread
			obj[threadID] = pageLoadedEpoch;
			chrome.storage.sync.set(obj, function() {
			    console.log("saved " + threadID + " at time " + pageLoadedEpoch);
			});


			// Perform a cleanup of all saved threads older than 7 days, *IF* we have low space.
			chrome.storage.sync.get(null, function(items) {
			    var allKeys = Object.keys(items);
			    console.log(allKeys.length + " reddit threads in storage");

				// If we have more than 490 keys stored, then we have very low space (limit is 512 for chrome sync)
				if (allKeys.length > maximumSavedThreadHeap){

					var keysToRemove = [];
					$.each(items, function(key, savedDate) {
						if (savedDate < (pageLoadedEpoch - threadRemovalTimeSeconds)){
							keysToRemove.push(key);
						}
					});

					chrome.storage.sync.remove(keysToRemove, function(removedItems) {
					       console.log("Removed " + keysToRemove.length + " old reddit threads");
					});
				}
			});

		});

	}

}

viewedCommentsObj();

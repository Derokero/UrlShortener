/* On load */
$(function () {
	/* Initialize popovers */
	$("[data-toggle='popover']").popover({trigger: "hover", placement: "top", delay: {show: 500, hide: 100}});

	/* Uncheck all checkboxes (Prevents from retaining their state after pressing the back button) */
	$(".form-check-input").each((index, input) => {
		input.checked = false;
	});

	/* Display additional options according to checked checkboxes */
	$(".form-check-input").on("click", function (ev) {
		const isChecked = ev.target.checked;
		const settings = $(ev.target).closest(".row").children().last();
		settings.toggle(isChecked);
		settings.find("input").attr("required", isChecked || null);
	});

	/* Custom error message function */
	$.fn.extend({
		displayError: function (error) {
			if (this.hasClass("show")) return;

			this.text(error);
			this.addClass("show");

			setTimeout(() => {
				this.removeClass("show");
			}, 4500);
		},
	});

	/* On submit */
	$("form").on("submit", async function (ev) {
		ev.preventDefault();

		$(".copyUrlBtn").text("Copy to clipboard!");

		// Get all inputs
		const inputs = {};
		$("input").each((index, input) => {
			let value = input.value;
			if (input.type === "checkbox") value = input.checked;

			inputs[input.id] = value;
		});

		// Send inputs to server
		try {
			const response = await fetch("/api/shorten", {
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify(inputs),
			});

			const data = await response.json();

			// Handle errors
			const {error} = data;
			if (response.status === 409 && error.reason === "urlSlug") {
				console.error(error);
				$(".urlSlugError").displayError(error.message);
				return;
			}
			if (response.status === 400 && error.reason === "baseUrl") {
				console.error(error);
				$(".baseUrlError").displayError(error.message);
				return;
			}

			if (error) {
				return console.error(error.message);
			}

			const {generatedUrl, expireAfter} = data.success;

			$("#generatedUrl").attr("href", generatedUrl);
			$("#generatedUrl").text(generatedUrl);

			/* Display extra info about the shortened URL */
			if (expireAfter) {
				const {time, clicks} = expireAfter;

				let text = "Reminder: Your shortened URL is set to expire after ";

				if (time && clicks) text += `${time} minutes or ${clicks} clicks.`;
				else if (time) text += `${time} minutes.`;
				else if (clicks) text += `${clicks} clicks.`;
				else text = "Your shortened URL won't expire.";

				$(".urlDisplay>.extraInfo").text(text);
			}

			$(".urlDisplay").collapse("show");
			setTimeout(() => {
				window.scrollTo({top: document.body.getBoundingClientRect().bottom, behavior: "smooth"});
			}, 500);
		} catch (err) {
			console.error("An unexpected error has occured!");
		}
	});

	/* Copy to clipboard button */
	$(".copyUrlBtn").on("click", async function (ev) {
		try {
			await navigator.clipboard.writeText($("#generatedUrl").text());
			$(".copyUrlBtn").text("Copied!");
		} catch (err) {
			$(".copyUrlBtn").text("Failed to copy!");
			console.error("An error has occured why trying to copy!");
		}
	});
});

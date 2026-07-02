const trackBtn =
document.getElementById("track-btn");

const trackingResult =
document.getElementById(
    "tracking-result"
);

const trackError =
document.getElementById(
    "track-error"
);

trackBtn.addEventListener(
"click",

function(){

    const code =
    document.getElementById(
        "tracking-number"
    ).value.trim();

    // Hide previous error
    trackError.style.display = "none";

if(code === ""){

    trackingInput.classList.add(
        "input-error"
    );

    return;
}

    document.getElementById(
        "tracking-id"
    ).textContent = code;

    trackingResult.style.display =
        "block";

    trackingResult.scrollIntoView({

        behavior:"smooth",

        block:"start"

    });

});
window.onload = function () {
    var gform = document.getElementById("gform");
    gform.onsubmit = handleFormSubmit;
}

function handleFormSubmit(event) {
    let nameValid = document.getElementById("name");
    let emailValid = document.getElementById("email");
    let addressValid = document.getElementById("address");
    let cityValid = document.getElementById("city");

    let errorMessage1 = document.getElementById("error-message-1");
    let errorMessage2 = document.getElementById("error-message-2");
    let errorMessage3 = document.getElementById("error-message-3");
    let errorMessage4 = document.getElementById("error-message-4");

    errorMessage1.style.display = "none";
    errorMessage2.style.display = "none";
    errorMessage3.style.display = "none";
    errorMessage4.style.display = "none";
    if (nameValid.value && emailValid.value && addressValid.value && cityValid.value) {
        console.log("valid form");
    } else {

        if (!nameValid.value) {
            errorMessage1.style.display = "inline";
        }

        if (!emailValid.value) {
            errorMessage2.style.display = "inline";
        }

        if (!addressValid.value) {
            errorMessage3.style.display = "inline";
        }

        if (!cityValid.value) {
            errorMessage4.style.display = "inline";
        }

        event.preventDefault();
        console.log("Invalid Form");
    }

}

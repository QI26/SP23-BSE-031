function loadDescription(fileName, descriptionId) {
    const descriptionElement = document.getElementById(descriptionId);
    
    if (descriptionElement.classList.contains('show')) {
        descriptionElement.innerHTML = ''; 
        descriptionElement.classList.remove('show');
    } else {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', fileName, true);

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                descriptionElement.innerHTML = xhr.responseText;
                descriptionElement.classList.add('show');
            } else if (xhr.readyState === 4 && xhr.status !== 200) {
                console.error('Error loading description:', xhr.status);
            }
        };
        xhr.send();
    }
}



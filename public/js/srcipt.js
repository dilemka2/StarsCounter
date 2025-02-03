// making warning
let progressLine = document.querySelector('.progress-line');
let progress = document.querySelector('.progress');
let warningBlock = document.querySelector('.warningBlock-wrapper')
let closeWarnB = document.querySelector('#close').addEventListener('click', () =>{
    warningBlock.style.display = 'none';
}) ;

function progressUpdating() {
    let amount = 100;
    progress.style.width = amount + '%';
    let interval = setInterval(() => {
        if (amount == 0) {
            warningBlock.style.display = 'none';
            clearInterval(interval);
        }
        else {
            amount = amount - 10;
            progress.style.width = amount + '%';
        }
    }, 300)
}

document.getElementById('form').addEventListener('submit', async(e) => {
    e.preventDefault();
    const file = document.getElementById('input').files[0];
    if (!file) {
        warningBlock.style.display = 'flex';
        progressUpdating();
        return;
    }
    const formData = new FormData();
    formData.append('photo', file);

    try {
        const response = await fetch('http://localhost:3030/send-photo', {
            method: 'POST',
            body:formData,
        })

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`)
        }
        const result = await response.json();
    }

    catch(e) {
        console.log(e);
    }
})